import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      branchId, 
      expenseType, 
      expenseDate, 
      totalPayable, 
      totalPaid, 
      balance 
    } = body;

    if (!branchId || !expenseType || !expenseDate) {
      return NextResponse.json(
        { message: "CRITICAL_VALIDATION_FAULT: Missing key metrics for ledger ingestion." },
        { status: 400 }
      );
    }

    const crusherLoadQuantity: number | null =
      body.crusher_load_quantity ?? body.crusherLoadQuantity ?? null;
    const outsideLoadQuantity: number | null =
      body.outside_load_quantity ?? body.outsideLoadQuantity ?? null;
    const totalCubeQuantity: number | null =
      body.total_cube_quantity ?? body.totalCubeQuantity ?? null;
    const unitCubeQuantity: number | null =
      body.unit_cube_quantity ??
      body.unitCubeQuantity ??
      body.unit_cube_price ??
      body.unitCubePrice ??
      null;

    const isCubeExpense = ["Loading Expenses", "Breker Expenses", "Breaker Expenses"].includes(String(expenseType));

  
    const crusherVal: number | null = isCubeExpense ? Number(crusherLoadQuantity) || 0 : null;
    const outsideVal: number | null = isCubeExpense ? Number(outsideLoadQuantity) || 0 : null;

  
    const totalCubeVal: number | null = isCubeExpense
      ? (totalCubeQuantity != null ? Number(totalCubeQuantity) || 0 : (crusherVal ?? 0) + (outsideVal ?? 0))
      : null;

    const unitCubeVal: number | null = isCubeExpense ? Number(unitCubeQuantity) || 0 : null;

    const finalPayable = isCubeExpense && (!totalPayable || Number(totalPayable) === 0) && totalCubeVal != null
      ? (totalCubeVal ?? 0) * (unitCubeVal ?? 0)
      : Number(totalPayable) || 0;

    const insertQuery = `
      INSERT INTO other_expenses (
        branch_id, 
        reason, 
        expense_date, 
        total_payable, 
        total_paid, 
        balance,
        crusher_load_quantity,
        outside_load_quantity,
        total_cube_quantity,
        unit_cube_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      Number(branchId),
      String(expenseType),
      String(expenseDate),
      finalPayable,
      Number(totalPaid) || 0,
      Number(balance) || 0,
      crusherVal,
      outsideVal,
      totalCubeVal,
      unitCubeVal,
    ];

    await db.query(insertQuery, values);

    return NextResponse.json(
      { message: "LEDGER_INTEGRATION_SUCCESS: Operational ledger entry committed." },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Critical error in Operational Expenses API Engine:", error);
    return NextResponse.json(
      { message: "INTERNAL_SERVER_MATRIX_FAULT", error: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId || branchId === "[id]") {
      return NextResponse.json([]);
    }

    const [rows]: any = await db.query(
      `SELECT 
        id, 
        reason, 
        total_payable, 
        total_paid, 
        balance, 
        DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date,
        crusher_load_quantity,
        outside_load_quantity,
        total_cube_quantity,
        unit_cube_quantity
       FROM other_expenses 
       WHERE branch_id = ? 
       ORDER BY id DESC`,
      [branchId]
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error: any) {
    console.error("Database operational read fault:", error);
    return NextResponse.json({ error: "Internal Server Ledger Error", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      branchId,
      branch_id,
      expense_type,
      expenseType,
      classification_reason,
      reason,
      total_payable,
      totalPaid,
      total_paid,
      balance,
      expense_date,
      date,
      expenseDate,
      crusher_load_quantity,
      crusherLoadQuantity,
      outside_load_quantity,
      outsideLoadQuantity,
      total_cube_quantity,
      totalCubeQuantity,
      unit_cube_quantity,
      unitCubeQuantity,
      unit_cube_price,
      unitCubePrice,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Record ID is required." }, { status: 400 });
    }

    const [existingRows]: any = await db.query(
      `SELECT * FROM other_expenses WHERE id = ?`,
      [id]
    );
    const old = Array.isArray(existingRows) ? existingRows[0] : null;
    if (!old) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }

    const finalBranchId = branchId || branch_id;
    if (finalBranchId && Number(old.branch_id) !== Number(finalBranchId)) {
      return NextResponse.json({ success: false, error: "Branch mismatch." }, { status: 403 });
    }

    const finalReason = String(expense_type || expenseType || classification_reason || reason || old.reason || "").trim();
    const finalPayable = (total_payable ?? totalPaid) !== undefined ? Number(total_payable ?? totalPaid) : Number(old.total_payable || 0);
    const finalPaid = total_paid !== undefined ? Number(total_paid) : Number(old.total_paid || 0);
    const finalBalance = balance !== undefined ? Number(balance) : Math.max(0, finalPayable - finalPaid);
    const finalDate = expense_date || date || expenseDate || old.expense_date;

    if (!finalReason) {
      return NextResponse.json({ success: false, error: "Classification / Expense Type eka danna ona." }, { status: 400 });
    }
    if (finalPaid > finalPayable) {
      return NextResponse.json({ success: false, error: "Total Paid, Total Payable ta wada wadi karanna ba." }, { status: 400 });
    }


    const isCubeExpense = ["Loading Expenses", "Breker Expenses", "Breaker Expenses"].includes(finalReason);
    const crusherVal = (crusher_load_quantity ?? crusherLoadQuantity) !== undefined
      ? (isCubeExpense ? Number(crusher_load_quantity ?? crusherLoadQuantity) || 0 : null)
      : old.crusher_load_quantity;
    const outsideVal = (outside_load_quantity ?? outsideLoadQuantity) !== undefined
      ? (isCubeExpense ? Number(outside_load_quantity ?? outsideLoadQuantity) || 0 : null)
      : old.outside_load_quantity;
    const totalCubeVal = (total_cube_quantity ?? totalCubeQuantity) !== undefined
      ? (isCubeExpense ? Number(total_cube_quantity ?? totalCubeQuantity) || 0 : null)
      : old.total_cube_quantity;
    const unitCubeVal = (unit_cube_quantity ?? unitCubeQuantity ?? unit_cube_price ?? unitCubePrice) !== undefined
      ? (isCubeExpense ? Number(unit_cube_quantity ?? unitCubeQuantity ?? unit_cube_price ?? unitCubePrice) || 0 : null)
      : old.unit_cube_quantity;

    let finalPayableCalc = finalPayable;
    if (isCubeExpense && totalCubeVal != null && unitCubeVal != null && (!finalPayable || finalPayable === Number(old.total_payable))) {

    }

    await db.query(
      `UPDATE other_expenses SET
        reason = ?,
        expense_date = ?,
        total_payable = ?,
        total_paid = ?,
        balance = ?,
        crusher_load_quantity = ?,
        outside_load_quantity = ?,
        total_cube_quantity = ?,
        unit_cube_quantity = ?
       WHERE id = ?`,
      [finalReason, finalDate, finalPayableCalc, finalPaid, finalBalance, crusherVal, outsideVal, totalCubeVal, unitCubeVal, id]
    );

    const [updatedRows]: any = await db.query(
      `SELECT id, reason, total_payable, total_paid, balance,
              DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date,
              crusher_load_quantity, outside_load_quantity, total_cube_quantity, unit_cube_quantity
       FROM other_expenses WHERE id = ?`,
      [id]
    );
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("PUT other expense error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update record.", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const branchId = searchParams.get("branchId") || searchParams.get("branch_id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Record ID is required." }, { status: 400 });
    }

    let q = `DELETE FROM other_expenses WHERE id = ?`;
    const params: any[] = [id];
    if (branchId) {
      q += ` AND branch_id = ?`;
      params.push(Number(branchId));
    }

    const [result]: any = await db.query(q, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Record deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE other expense error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete record.", details: error?.message }, { status: 500 });
  }
}
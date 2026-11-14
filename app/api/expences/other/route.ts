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
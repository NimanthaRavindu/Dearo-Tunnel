import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const branchId = new URL(request.url).searchParams.get("branch_id");
    if (!branchId) return NextResponse.json({ error: "branch_id is required" }, { status: 400 });

    // ✅ ALL MACHINES - machine filter ekak NA
    // Breaker / Crusher / Excavator / Lorry - okkoma enawa
    const [expenses] = await db.execute(
      `SELECT id, branch_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, machine, diesel, amount, payable, paid
       FROM diesel_expenses WHERE branch_id =? ORDER BY date DESC, id DESC`, [branchId]
    );

    const [expenseRows] = await db.execute(
      `SELECT COALESCE(SUM(diesel),0) AS dieselUsed, COALESCE(SUM(payable),0) AS amountUsed
       FROM diesel_expenses WHERE branch_id =?`, [branchId]
    );

    let stock = { totalDiesel: 0, totalAmount: 0 };
    try {
      const [stockRows] = await db.execute(
        `SELECT COALESCE(total_diesel,0) AS totalDiesel, COALESCE(total_amount,0) AS totalAmount
         FROM diesel_stock WHERE branch_id =? LIMIT 1`, [branchId]
      );
      stock = (stockRows as any[])[0] || { totalDiesel: 0, totalAmount: 0 };
    } catch {
      stock = { totalDiesel: 0, totalAmount: 0 };
    }

    const expense = (expenseRows as any[])[0] || {};
    const dieselUsed = Number(expense.dieselUsed || 0);
    const amountUsed = Number(expense.amountUsed || 0);
    const totalDiesel = Number((stock as any).totalDiesel || 0);
    const totalAmount = Number((stock as any).totalAmount || 0);

    return NextResponse.json({
      expenses,
      summary: {
        dieselUsed, amountUsed, totalDiesel, totalAmount,
        remainingDiesel: Math.max(0, totalDiesel - dieselUsed),
        remainingBalance: Math.max(0, totalAmount - amountUsed),
        initialDieselStock: totalDiesel,
        initialTotalAmount: totalAmount,
        isInitialSet: totalDiesel > 0,
      },
    });
  } catch (error: any) {
    console.error("GET DIESEL ERROR:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch diesel expenses", detail: String(error?.message || error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branch_id: branchId, date, machine, diesel, payable, paid, initialDiesel, initialAmount, action } = body;
    if (!branchId) return NextResponse.json({ error: "branch_id is required" }, { status: 400 });

    if (action === "set_initial") {
      const d = Number(initialDiesel);
      const a = Number(initialAmount);
      if (!d || d <= 0) return NextResponse.json({ error: "Valid initial diesel required" }, { status: 400 });
      await db.execute(
        `INSERT INTO diesel_stock (branch_id, total_diesel, total_amount)
         VALUES (?,?,?) ON DUPLICATE KEY UPDATE total_diesel=VALUES(total_diesel), total_amount=VALUES(total_amount)`,
        [branchId, d, a]
      );
      return NextResponse.json({ message: "Initial stock set", totalDiesel: d, totalAmount: a }, { status: 200 });
    }

    if (!date || !machine || diesel === undefined || payable === undefined || paid === undefined) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const dieselValue = Number(diesel);
    const payableValue = Number(payable);
    const paidValue = Number(paid);
    if (paidValue > payableValue) return NextResponse.json({ error: "Paid > Payable" }, { status: 400 });

    const [result] = await db.execute(
      `INSERT INTO diesel_expenses (branch_id, date, machine, diesel, amount, payable, paid) VALUES (?,?,?,?,?,?,?)`,
      [branchId, date, machine, dieselValue, payableValue, payableValue, paidValue]
    );
    return NextResponse.json({ message: "Saved", id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error("POST DIESEL ERROR:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// ✅ ALUTH - PUT : Row eke thulama Edit kalama Save wenna
// NOTE: balance kiyala column ekak diesel_expenses eke NA - balance = payable - paid walin Frontend eke hadenawa.
// Eka nisa balance eka DB eke save karanne na - payable / paid witharak update karanawa.
// POST eke wage amount = payable widiyata thiyagannawa - nathnam Total Amount / Payable dekak wenas wenawa.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      branchId,
      branch_id,
      date,
      machine,
      diesel,
      amount,
      payable,
      paid,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Record ID is required." }, { status: 400 });
    }

    // ✅ Thiyena record eka gannawa
    const [existingRows]: any = await db.execute(
      `SELECT * FROM diesel_expenses WHERE id = ?`,
      [id]
    );
    const old = Array.isArray(existingRows) ? existingRows[0] : null;
    if (!old) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }

    // ✅ branch check - wena branch ekaka record ekak update wena eka nawaththanawa
    const finalBranchId = branchId || branch_id;
    if (finalBranchId && Number(old.branch_id) !== Number(finalBranchId)) {
      return NextResponse.json({ success: false, error: "Branch mismatch." }, { status: 403 });
    }

    const finalDate = date || old.date;
    const finalMachine = machine?.trim() ? machine.trim() : old.machine;
    const finalDiesel = diesel !== undefined ? Number(diesel) : Number(old.diesel || 0);
    const finalPayable = payable !== undefined ? Number(payable) : Number(old.payable ?? old.amount ?? 0);
    // ✅ POST eke wage amount = payable - Total Amount / Payable dekama ekata thiyagannawa
    const finalAmount = amount !== undefined ? Number(amount) : finalPayable;
    const finalPaid = paid !== undefined ? Number(paid) : Number(old.paid || 0);

    if (!finalMachine) {
      return NextResponse.json({ success: false, error: "Machine eka danna ona." }, { status: 400 });
    }
    if (!finalDate) {
      return NextResponse.json({ success: false, error: "Date eka danna ona." }, { status: 400 });
    }
    if (finalDiesel < 0 || finalAmount < 0 || finalPayable < 0 || finalPaid < 0) {
      return NextResponse.json({ success: false, error: "Diesel / Amount / Payable / Paid 0 ta wada adu karanna ba." }, { status: 400 });
    }
    if (finalPaid > finalPayable) {
      return NextResponse.json({ success: false, error: "Paid, Payable ta wada wadi karanna ba." }, { status: 400 });
    }

    await db.execute(
      `UPDATE diesel_expenses SET
        date = ?,
        machine = ?,
        diesel = ?,
        amount = ?,
        payable = ?,
        paid = ?
       WHERE id = ?`,
      [finalDate, finalMachine, finalDiesel, finalAmount, finalPayable, finalPaid, id]
    );

    // ✅ Update wuna record eka aye gannawa - GET eke wage
    const [updatedRows]: any = await db.execute(
      `SELECT id, branch_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, machine, diesel, amount, payable, paid
       FROM diesel_expenses WHERE id = ?`,
      [id]
    );
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("PUT DIESEL ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update record.", details: error?.message },
      { status: 500 }
    );
  }
}

// ✅ FIX - DELETE : success + branch check + not found check
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const branchId = url.searchParams.get("branch_id") || url.searchParams.get("branchId");

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    let q = `DELETE FROM diesel_expenses WHERE id = ?`;
    const params: any[] = [id];
    // branchId awoth ekatath check karanawa - wena branch ekaka record ekak delete wena eka nawaththanawa
    if (branchId) {
      q += ` AND branch_id = ?`;
      params.push(Number(branchId));
    }

    const [result]: any = await db.execute(q, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE DIESEL ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to delete", details: error?.message }, { status: 500 });
  }
}
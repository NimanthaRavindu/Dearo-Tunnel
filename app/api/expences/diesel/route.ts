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

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.execute("DELETE FROM diesel_expenses WHERE id =?", [id]);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
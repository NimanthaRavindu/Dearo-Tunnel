import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const branchId = new URL(request.url).searchParams.get("branch_id");
    if (!branchId) return NextResponse.json({ error: "branch_id is required" }, { status: 400 });
    connection = await mysql.createConnection(dbConfig);

    const [expenses] = await connection.execute(
      `SELECT id, branch_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, machine, diesel, amount, payable, paid
       FROM diesel_expenses WHERE branch_id =? ORDER BY date DESC, id DESC`, [branchId]
    );
    const [expenseRows] = await connection.execute(
      `SELECT COALESCE(SUM(diesel),0) AS dieselUsed, COALESCE(SUM(payable),0) AS amountUsed, COALESCE(SUM(paid),0) AS paidUsed
       FROM diesel_expenses WHERE branch_id =?`, [branchId]
    );
    const [stockRows] = await connection.execute(
      `SELECT COALESCE(total_diesel,0) AS totalDiesel, COALESCE(total_amount,0) AS totalAmount
       FROM diesel_stock WHERE branch_id =? LIMIT 1`, [branchId]
    );

    const expense = (expenseRows as any[])[0] || {};
    const stock = (stockRows as any[])[0] || {};
    const dieselUsed = Number(expense.dieselUsed || 0);
    const amountUsed = Number(expense.amountUsed || 0);
    const totalDiesel = Number(stock.totalDiesel || 0);
    const totalAmount = Number(stock.totalAmount || 0);

    // Remaining = Initial - Used, minus na 0 ta clamp
    const remainingDiesel = Math.max(0, totalDiesel - dieselUsed);
    const remainingAmount = Math.max(0, totalAmount - amountUsed);
    const remainingBalance = Math.max(0, amountUsed - Number(expense.paidUsed||0));

    return NextResponse.json({
      expenses,
      summary: {
        dieselUsed,
        amountUsed,
        totalDiesel,
        totalAmount,
        remainingDiesel,
        remainingAmount,
        remainingBalance,
        initialDieselStock: totalDiesel,
        initialTotalAmount: totalAmount,
        isInitialSet: totalDiesel > 0,
      },
    });
  } catch (error) {
    console.error("GET DIESEL ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch diesel expenses" }, { status: 500 });
  } finally { if (connection) await connection.end(); }
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const body = await request.json();
    const { branch_id: branchId, date, machine, diesel, payable, paid, initialDiesel, initialAmount, action } = body;
    if (!branchId) return NextResponse.json({ error: "branch_id is required" }, { status: 400 });
    connection = await mysql.createConnection(dbConfig);

    if (action === "set_initial") {
      const d = Number(initialDiesel); const a = Number(initialAmount);
      if (!d || d <= 0) return NextResponse.json({ error: "Valid initial diesel required" }, { status: 400 });
      await connection.execute(
        `INSERT INTO diesel_stock (branch_id, total_diesel, total_amount)
         VALUES (?,?,?) ON DUPLICATE KEY UPDATE total_diesel=VALUES(total_diesel), total_amount=VALUES(total_amount)`,
        [branchId, d, a]
      );
      return NextResponse.json({ message: "Initial stock set", totalDiesel: d, totalAmount: a }, { status: 200 });
    }

    if (!date ||!machine || diesel === undefined || payable === undefined || paid === undefined) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const dieselValue = Number(diesel); const payableValue = Number(payable); const paidValue = Number(paid);
    if (paidValue > payableValue) return NextResponse.json({ error: "Paid > Payable" }, { status: 400 });

    const [result] = await connection.execute(
      `INSERT INTO diesel_expenses (branch_id, date, machine, diesel, amount, payable, paid) VALUES (?,?,?,?,?,?,?)`,
      [branchId, date, machine, dieselValue, payableValue, payableValue, paidValue]
    );
    return NextResponse.json({ message: "Saved", id: (result as mysql.ResultSetHeader).insertId }, { status: 201 });
  } catch (error) {
    console.error("POST DIESEL ERROR:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  } finally { if (connection) await connection.end(); }
}

export async function DELETE(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM diesel_expenses WHERE id =?", [id]);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  } finally { if (connection) await connection.end(); }
}
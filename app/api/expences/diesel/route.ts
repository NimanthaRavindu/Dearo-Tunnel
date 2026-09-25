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
    if (!branchId) {
      return NextResponse.json({ error: "branch_id is required" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    const [expenses] = await connection.execute(
      `
        SELECT
          id,
          branch_id,
          DATE_FORMAT(date, '%Y-%m-%d') AS date,
          machine,
          diesel,
          amount,
          payable,
          paid
        FROM diesel_expenses
        WHERE branch_id =?
        ORDER BY date DESC, id DESC
      `,
      [branchId],
    );

    const [expenseRows] = await connection.execute(
      `
        SELECT
          COALESCE(SUM(diesel), 0) AS dieselUsed,
          COALESCE(SUM(payable), 0) AS amountUsed
        FROM diesel_expenses
        WHERE branch_id =?
      `,
      [branchId],
    );

    const [stockRows] = await connection.execute(
      `
        SELECT
          COALESCE(total_diesel, 0) AS totalDiesel,
          COALESCE(total_amount, 0) AS totalAmount
        FROM diesel_stock
        WHERE branch_id =?
        LIMIT 1
      `,
      [branchId],
    );

    const expense = (expenseRows as any[])[0] || {};
    const stock = (stockRows as any[])[0] || {};

    const dieselUsed = Number(expense.dieselUsed || 0);
    const amountUsed = Number(expense.amountUsed || 0);
    const totalDiesel = Number(stock.totalDiesel || 0);
    const totalAmount = Number(stock.totalAmount || 0);

    // === FINAL LOGIC ===
    // totalDiesel / totalAmount = INITIAL STOCK (331 / 317000)
    // dieselUsed / amountUsed = DB eken SUM karapu pramanaya
    // 0 vita witharai wenas wenne - nathnam ehemama thiyenawa

    // Diesel Used card eke agaya 0 nam witharai Remaining wenas wenna ona
    const remainingDiesel = totalDiesel === 0 || dieselUsed === 0
     ? totalDiesel
      : Math.max(0, totalDiesel - dieselUsed);

    // Total Amount card eke count eka 0.00 nam witharai Remaining Balance ekathu wenna ona
    const remainingBalance = totalAmount === 0 || amountUsed === 0
     ? totalAmount
      : Math.max(0, totalAmount - amountUsed);

    return NextResponse.json({
      expenses,
      summary: {
        dieselUsed: totalDiesel === 0? 0 : Math.max(0, totalDiesel - dieselUsed), // Diesel Used card eke pennanne ithuru tika
        amountUsed: totalAmount === 0? 0 : Math.max(0, totalAmount - amountUsed), // Total Amount card eke pennanne ithuru tika
        totalDiesel,
        totalAmount,
        remainingDiesel,
        remainingBalance,
        initialDieselStock: totalDiesel,
        initialTotalAmount: totalAmount,
      },
    });
  } catch (error) {
    console.error("GET DIESEL EXPENSE ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch diesel expenses" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const body = await request.json();
    const { branch_id: branchId, date, machine, diesel, payable, paid } = body;

    if (!branchId ||!date ||!machine || diesel === undefined || payable === undefined || paid === undefined) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    const dieselValue = Number(diesel);
    const payableValue = Number(payable);
    const paidValue = Number(paid);

    if (!Number.isFinite(dieselValue) ||!Number.isFinite(payableValue) ||!Number.isFinite(paidValue)) {
      return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 });
    }
    if (dieselValue <= 0) {
      return NextResponse.json({ error: "Diesel quantity must be greater than 0" }, { status: 400 });
    }
    if (payableValue < 0 || paidValue < 0) {
      return NextResponse.json({ error: "Payable and paid values cannot be negative" }, { status: 400 });
    }
    if (paidValue > payableValue) {
      return NextResponse.json({ error: "Paid cannot be greater than payable" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    // FIX: diesel_stock eka update karanne na - initial stock eka ehemama thiyenawa
    // Wenas wenne diesel_expenses table eke witharai
    const [result] = await connection.execute(
      `
        INSERT INTO diesel_expenses
          (branch_id, date, machine, diesel, amount, payable, paid)
        VALUES (?,?,?,?,?,?,?)
      `,
      [branchId, date, machine, dieselValue, payableValue, payableValue, paidValue],
    );

    return NextResponse.json(
      { message: "Diesel expense saved successfully", id: (result as mysql.ResultSetHeader).insertId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST DIESEL EXPENSE ERROR:", error);
    return NextResponse.json({ error: "Failed to save diesel expense" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute("DELETE FROM diesel_expenses WHERE id =?", [id]);

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Expense record not found" }, { status: 404 });
    }

    // FIX: stock eka wadi karanna / adu karanna ona na
    return NextResponse.json({ message: "Diesel expense deleted successfully" });
  } catch (error) {
    console.error("DELETE DIESEL EXPENSE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete diesel expense" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
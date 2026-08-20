import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// 1. GET Request (Fetch expenses by branch_id)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch_id = searchParams.get("branch_id");

    let query = `
      SELECT s.id, s.branch_id, b.branch_name, s.personName, s.amount, s.date 
      FROM sales_expenses s
      LEFT JOIN branch b ON s.branch_id = b.id
    `;
    const queryParams: any[] = [];

    if (branch_id) {
      query += ` WHERE s.branch_id = ?`;
      queryParams.push(branch_id);
    }

    query += ` ORDER BY s.date DESC, s.id DESC`;

    const [rows] = await db.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales expenses records" },
      { status: 500 }
    );
  }
}

// 2. POST Request (New Entry with branch_name join)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch_id, personName, amount, date } = body;

    // Data validation
    if (!branch_id || !personName || !amount || !date) {
      return NextResponse.json(
        { error: "All required fields (branch_id, personName, amount, date) must be provided" },
        { status: 400 }
      );
    }

    const parsedBranchId = parseInt(branch_id, 10);
    if (isNaN(parsedBranchId)) {
      return NextResponse.json(
        { error: "Invalid branch_id provided" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided" },
        { status: 400 }
      );
    }

    // Insert into Database
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO sales_expenses (branch_id, personName, amount, date) VALUES (?, ?, ?, ?)",
      [parsedBranchId, personName.trim(), parsedAmount, date]
    );

    // Insert වූ Aluth record එක branch table එක සමඟ Join කර ගෙන UI එකට pass කිරීම
    const [newRows] = await db.query<RowDataPacket[]>(
      `SELECT s.id, s.branch_id, b.branch_name, s.personName, s.amount, s.date 
       FROM sales_expenses s 
       LEFT JOIN branch b ON s.branch_id = b.id 
       WHERE s.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newRows[0], { status: 201 });
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create sales expense entry" },
      { status: 500 }
    );
  }
}

// 3. DELETE Request
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Expense record ID is required" },
        { status: 400 }
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM sales_expenses WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Expense record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Expense record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense record" },
      { status: 500 }
    );
  }
}
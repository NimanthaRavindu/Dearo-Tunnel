import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, personName, amount, date FROM sales_expenses ORDER BY date DESC, id DESC"
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales expenses records" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { personName, amount, date } = body;

    // Data validation
    if (!personName || !amount || !date) {
      return NextResponse.json(
        { error: "All required fields (personName, amount, date) must be provided" },
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

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO sales_expenses (personName, amount, date) VALUES (?, ?, ?)",
      [personName.trim(), parsedAmount, date]
    );

    return NextResponse.json(
      {
        id: result.insertId,
        personName: personName.trim(),
        amount: parsedAmount,
        date,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create sales expense entry" },
      { status: 500 }
    );
  }
}


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
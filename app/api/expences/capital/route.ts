import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET Method
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branchId");
    const capitalIdParam = searchParams.get("capitalId") || searchParams.get("id");

    // 1. Single Capital Record query
    if (capitalIdParam && !branchIdParam) {
      const capitalId = Number(capitalIdParam);
      if (isNaN(capitalId)) {
        return NextResponse.json(
          { error: "Invalid Capital ID parameter" },
          { status: 400 }
        );
      }

      const [rows]: any = await db.query(
        `SELECT 
          id, 
          branch_id AS branchId,
          person_name AS personName, 
          date, 
          amount, 
          description, 
          created_at AS createdAt 
         FROM capital_expenses 
         WHERE id = ?`,
        [capitalId]
      );

      return NextResponse.json(rows[0] || null, { status: 200 });
    }

    // 2. Branch Capital Records query
    const branchId = Number(branchIdParam);
    if (!branchIdParam || isNaN(branchId)) {
      return NextResponse.json(
        { error: "Invalid or missing Branch ID parameter" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `SELECT 
        id, 
        branch_id AS branchId,
        person_name AS personName, 
        date, 
        amount, 
        description, 
        created_at AS createdAt 
       FROM capital_expenses 
       WHERE branch_id = ? 
       ORDER BY created_at DESC`,
      [branchId]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error("Database Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch capital expenses from DB", details: error.message },
      { status: 500 }
    );
  }
}

// POST Method 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, personName, date, amount, description } = body;

    if (!branchId || !personName || !date || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Missing required fields (branchId, personName, date, amount)" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: "Invalid amount value" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO capital_expenses (branch_id, person_name, date, amount, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [Number(branchId), personName, date, parsedAmount, description || ""]
    );

    const newRecord = {
      id: result.insertId,
      branchId: Number(branchId),
      personName,
      date,
      amount: parsedAmount,
      description: description || "",
    };

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("Database Insert Error:", error);
    return NextResponse.json(
      { error: "Failed to insert record into database", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE Method
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("id");

    if (!recordId || isNaN(Number(recordId))) {
      return NextResponse.json({ error: "Missing or invalid Record ID" }, { status: 400 });
    }

    await db.query(`DELETE FROM capital_expenses WHERE id = ?`, [Number(recordId)]);

    return NextResponse.json({ message: "Record deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Database Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete record", details: error.message },
      { status: 500 }
    );
  }
}
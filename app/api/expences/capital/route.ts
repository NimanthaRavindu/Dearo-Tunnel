import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Direct MySQL Database Connection configuration
async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "apextunnel",
  });
}

// 1. GET Method
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const branchId = Number(params.id);

    if (isNaN(branchId)) {
      return NextResponse.json({ error: "Invalid Branch ID" }, { status: 400 });
    }

    connection = await getDbConnection();

    const [rows] = await connection.execute(
      `SELECT 
        id, 
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
    console.error("DB Fetch Error:", error);
    return NextResponse.json(
      { error: "Database query failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// 2. POST Method 
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const branchId = Number(params.id);
    const body = await req.json();
    const { personName, date, amount, description } = body;

    if (!personName || !date || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // Raw SQL INSERT Query
    const [result]: any = await connection.execute(
      `INSERT INTO capital_expenses (branch_id, person_name, date, amount, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [branchId, personName, date, parseFloat(amount), description || ""]
    );

    const insertedId = result.insertId;

    return NextResponse.json(
      {
        id: insertedId,
        branchId,
        personName,
        date,
        amount: parseFloat(amount),
        description,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("DB Insert Error:", error);
    return NextResponse.json(
      { error: "Failed to insert record into database", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
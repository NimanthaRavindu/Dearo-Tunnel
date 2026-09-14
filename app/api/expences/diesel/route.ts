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
  let connection;

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");

    if (!branchId) {
      return NextResponse.json(
        { error: "branch_id is required" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        branch_id,
        date,
        machine,
        diesel,
        amount,
        payable,
        paid
      FROM diesel_expenses
      WHERE branch_id = ?
      ORDER BY date DESC, id DESC
      `,
      [branchId]
    );

    return NextResponse.json({
      expenses: rows,
    });
  } catch (error) {
    console.error("GET DIESEL EXPENSE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch diesel expenses",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();

    const {
      branch_id,
      date,
      machine,
      diesel,
      amount,
      payable,
      paid,
    } = body;

    if (
      !branch_id ||
      !date ||
      !machine ||
      diesel === undefined ||
      amount === undefined ||
      payable === undefined ||
      paid === undefined
    ) {
      return NextResponse.json(
        {
          error: "All required fields must be provided",
        },
        { status: 400 }
      );
    }

    const dieselValue = Number(diesel);
    const amountValue = Number(amount);
    const payableValue = Number(payable);
    const paidValue = Number(paid);

    if (
      !Number.isFinite(dieselValue) ||
      !Number.isFinite(amountValue) ||
      !Number.isFinite(payableValue) ||
      !Number.isFinite(paidValue)
    ) {
      return NextResponse.json(
        {
          error: "Invalid numeric values",
        },
        { status: 400 }
      );
    }

    if (dieselValue <= 0) {
      return NextResponse.json(
        {
          error: "Diesel quantity must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (
      amountValue < 0 ||
      payableValue < 0 ||
      paidValue < 0
    ) {
      return NextResponse.json(
        {
          error: "Amounts cannot be negative",
        },
        { status: 400 }
      );
    }

    if (paidValue > payableValue) {
      return NextResponse.json(
        {
          error: "Total Paid cannot be greater than Total Payable",
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      `
      INSERT INTO diesel_expenses
      (
        branch_id,
        date,
        machine,
        diesel,
        amount,
        payable,
        paid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        branch_id,
        date,
        machine,
        dieselValue,
        amountValue,
        payableValue,
        paidValue,
      ]
    );

    const insertId = (result as mysql.ResultSetHeader).insertId;

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        branch_id,
        date,
        machine,
        diesel,
        amount,
        payable,
        paid
      FROM diesel_expenses
      WHERE id = ?
      `,
      [insertId]
    );

    const insertedExpense = Array.isArray(rows)
      ? rows[0]
      : null;

    return NextResponse.json(
      {
        message: "Diesel expense saved successfully",
        expense: insertedExpense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST DIESEL EXPENSE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to save diesel expense",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function DELETE(request: NextRequest) {
  let connection;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Expense ID is required",
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      `
      DELETE FROM diesel_expenses
      WHERE id = ?
      `,
      [id]
    );

    const deleteResult =
      result as mysql.ResultSetHeader;

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        {
          error: "Expense record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Diesel expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DIESEL EXPENSE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete diesel expense",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
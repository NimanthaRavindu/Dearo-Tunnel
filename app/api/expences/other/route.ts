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

    // Basic Validation
    if (!branchId || !expenseType || !expenseDate) {
      return NextResponse.json(
        { message: "CRITICAL_VALIDATION_FAULT: Missing key metrics for ledger ingestion." },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO other_expenses (
        branch_id, 
        reason, 
        expense_date, 
        total_payable, 
        total_paid, 
        balance
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      Number(branchId),
      String(expenseType),
      String(expenseDate),
      Number(totalPayable) || 0,
      Number(totalPaid) || 0,
      Number(balance) || 0,
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
      `SELECT id, reason, total_payable, total_paid, balance, DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date 
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
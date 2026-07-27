import { NextRequest, NextResponse } from "next/server";
import {db} from "@/lib/db";

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

    await db.query(insertQuery, [
      Number(branchId),
      expenseType,
      expenseDate,
      typeof totalPayable === "string" ? parseFloat(totalPayable) : totalPayable,
      typeof totalPaid === "string" ? parseFloat(totalPaid) : totalPaid,
      typeof balance === "string" ? parseFloat(balance) : balance,
    ]);

    return NextResponse.json(
      { message: "LEDGER_INTEGRATION_SUCCESS: Operational ledger entry committed." },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Critical error in Operational Expenses API Engine:", error);
    return NextResponse.json(
      { message: "INTERNAL_SERVER_MATRIX_FAULT", error: error.message },
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

    const [rows] = await db.query(
      `SELECT id,reason, total_payable, total_paid, balance, DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date 
       FROM other_expenses 
       WHERE branch_id = ? 
       ORDER BY id DESC`,
      [branchId]
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Database operational read fault:", error);
    return NextResponse.json({ error: "Internal Server Ledger Error" }, { status: 500 });
  }
}
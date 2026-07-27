import { NextRequest, NextResponse } from "next/server";
import {db} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    

    const { branchId, employeeId, reason,date, totalPayable, totalPaid } = body;

    if (!branchId || branchId === "[id]" || branchId.includes("LOADING") || !date) {
      return NextResponse.json(
        { error: "EXECUTION FAULT: Invalid or uninitialized Branch ID context." }, 
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: "EXECUTION FAULT: Targeted employee vector is missing." }, 
        { status: 400 }
      );
    }

    const payable = parseFloat(totalPayable || 0);
    const paid = parseFloat(totalPaid || 0);
    const balance = payable - paid; 


    await db.query(
      `INSERT INTO salary_expenses 
        (branch_id, employee_id, reason,expense_date,total_payable, total_paid, balance) 
       VALUES (?, ?, ?,?,?, ?, ?)` ,
      [
        Number(branchId), 
        Number(employeeId), 
        reason || "Monthly structural salary payout",
        date, 
        payable, 
        paid, 
        balance
      ]
    );

   
    return NextResponse.json({ success: true, message: "Ledger ingested successfully" }, { status: 201 });

  } catch (error: any) {

    console.error("CRITICAL DATABASE WRITE FAULT:", error);
    
    return NextResponse.json(
      { 
        error: "INTERNAL_SERVER_MATRIX_FAULT", 
        details: error?.message || "Check SQL constraints or table structure" 
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID context is required for ledger routing" },
        { status: 400 }
      );
    }

    
    const [salaryLogs]: any = await db.query(
      `SELECT 
        s.id AS id,
        s.branch_id,
        s.employee_id,
        e.name AS employee_name,
        s.reason,
        s.total_payable,
        s.total_paid,
        s.balance,
        DATE_FORMAT(s.expense_date, '%Y-%m-%d') AS expense_date
       FROM salary_expenses s
       LEFT JOIN employee e ON s.employee_id = e.id
       WHERE s.branch_id = ?
       ORDER BY s.id DESC`,
      [branchId]
    );

    return NextResponse.json(Array.isArray(salaryLogs) ? salaryLogs : []);

  } catch (error) {
    console.error("Database connection or column mapping fault:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Critical matrix retrieval failure" },
      { status: 500 }
    );
  }
}
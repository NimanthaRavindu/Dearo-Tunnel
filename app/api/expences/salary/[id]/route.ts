import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
 
    let id = "";
    
    if (params instanceof Promise) {
      const resolvedParams = await params;
      id = resolvedParams?.id;
    } else {
      id = (params as any)?.id;
    }

    if (!id || id === "undefined" || id === "[id]") {
      const url = new URL(request.url);
      const segments = url.pathname.split("/");
      id = segments[segments.length - 1];
    }

    if (!id || id === "undefined" || id === "[id]") {
      return NextResponse.json(
        { error: "Voucher ID segment is invalid or unreadable within server context" }, 
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
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
       WHERE s.id = ? 
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Target salary voucher record completely absent from database" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error("Dynamic single salary record pipeline fault:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Secure matrix branch failure" }, 
      { status: 500 }
    );
  }
}
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
        { error: "Other Voucher ID is invalid or unreadable" }, 
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `SELECT 
        o.id AS id,
        o.branch_id,
        o.reason,
        o.total_payable,
        o.total_paid,
        o.balance,
        DATE_FORMAT(o.expense_date, '%Y-%m-%d') AS expense_date
       FROM other_expenses AS o 
       WHERE o.id = ? 
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Target other expense record completely absent from database" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error("Dynamic single other expense fault:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Other matrix branch failure" }, 
      { status: 500 }
    );
  }
}
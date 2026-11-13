import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const branch_id = req.nextUrl.searchParams.get("branch_id");
    if (!branch_id) return NextResponse.json({ success: false, error: "branch_id required" }, { status: 400 });

    // ✅ as any dala rows error eka ain kala
    const result: any = await db.query(
      `SELECT id, branch_id, bill_number, product_name, customer_name, contact_number,
              TO_CHAR(promise_date, 'YYYY-MM-DD') as promise_date,
              vehicle_number, credit_amount, total_amount, paid_amount,
              TO_CHAR(created_date, 'YYYY-MM-DD') as created_date, created_at
       FROM sales_credits
       WHERE branch_id = $1
       ORDER BY created_at DESC`,
      [branch_id]
    );
    const rows = result?.rows ?? result ?? [];
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    console.error("GET sales-credits error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branch_id, bill_number, product_name, customer_name,
      contact_number, promise_date, vehicle_number,
      credit_amount, total_amount, paid_amount, created_date,
    } = body;

    if (!branch_id || !customer_name || !contact_number || !promise_date || !vehicle_number) {
      return NextResponse.json({ success: false, error: "Missing required credit fields" }, { status: 400 });
    }

    const id = `CR-${Date.now()}`;
    const result: any = await db.query(
      `INSERT INTO sales_credits
       (id, branch_id, bill_number, product_name, customer_name, contact_number, promise_date, vehicle_number, credit_amount, total_amount, paid_amount, created_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        id,
        branch_id,
        bill_number || null,
        product_name || null,
        customer_name,
        contact_number,
        promise_date,
        vehicle_number.toUpperCase(),
        Number(credit_amount || 0),
        Number(total_amount || 0),
        Number(paid_amount || 0),
        created_date || null,
      ]
    );
    const rows = result?.rows ?? result ?? [];
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) {
    console.error("POST sales-credits error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    await db.query(`DELETE FROM sales_credits WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
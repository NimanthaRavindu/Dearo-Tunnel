import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const branch_id = req.nextUrl.searchParams.get("branch_id");
    if (!branch_id) return NextResponse.json({ success: false, error: "branch_id required" }, { status: 400 });

    // ✅ MySQL: TO_CHAR -> DATE_FORMAT, $1 -> ?
    const result: any = await db.query(
      `SELECT id, branch_id, bill_number, product_name, customer_name, contact_number,
              DATE_FORMAT(promise_date, '%Y-%m-%d') as promise_date,
              vehicle_number, credit_amount, total_amount, paid_amount,
              DATE_FORMAT(created_date, '%Y-%m-%d') as created_date, created_at
       FROM sales_credits
       WHERE branch_id = ?
       ORDER BY created_at DESC`,
      [branch_id]
    );
    // mysql2 returns [rows, fields] - rows ganna
    const rows = Array.isArray(result) ? result[0] : (result?.rows ?? result ?? []);
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

    // ✅ MySQL: $1 -> ?, RETURNING * ain kala
    await db.query(
      `INSERT INTO sales_credits
       (id, branch_id, bill_number, product_name, customer_name, contact_number, promise_date, vehicle_number, credit_amount, total_amount, paid_amount, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
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

    // ✅ Insert karapu eka aye gannawa - RETURNING wenawata
    const inserted: any = await db.query(
      `SELECT id, branch_id, bill_number, product_name, customer_name, contact_number,
              DATE_FORMAT(promise_date, '%Y-%m-%d') as promise_date,
              vehicle_number, credit_amount, total_amount, paid_amount,
              DATE_FORMAT(created_date, '%Y-%m-%d') as created_date, created_at
       FROM sales_credits WHERE id = ?`,
      [id]
    );
    const rows = Array.isArray(inserted) ? inserted[0] : (inserted?.rows ?? inserted ?? []);
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
    // ✅ MySQL: $1 -> ?
    await db.query(`DELETE FROM sales_credits WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import {db} from '@/lib/db';

// GET: Fetch records
export async function GET(request: Request) {
  try {
    const [rows] = await db.query('SELECT * FROM sales_incomes ORDER BY id DESC');
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Insert record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, date, amount, branchId } = body;

    const query = 'INSERT INTO sales_incomes (name, date, amount, branch_id) VALUES (?, ?, ?, ?)';
    await db.query(query, [name, date, amount, branchId || null]);

    return NextResponse.json({ success: true, message: 'Saved successfully' }, { status: 201 });
  } catch (error) {
    console.error("Database insert error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const query = 'DELETE FROM sales_incomes WHERE id = ?';
    await db.query(query, [itemId]);

    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch branch sales incomes entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');

    const urlParts = new URL(request.url).pathname.split('/');
    const branchIdIndex = urlParts.indexOf('branches') + 1;
    const branchId = urlParts[branchIdIndex];

    let query = `
      SELECT 
          id,
          name,
          amount,
          date,
          branch_id,
          created_at
      FROM 
          sales_incomes
      WHERE branch_id = ?
    `;

    const queryParams: any[] = [branchId];

    if (recordId) {
      query += ` AND id = ?`;
      queryParams.push(recordId);
    }

    query += ` ORDER BY date DESC, id DESC;`;

    const [rows]: any = await db.query(query, queryParams);

    const data = rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name || "",
      amount: Number(row.amount || 0),
      date: row.date,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data,
    }, { status: 200 });

  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add new sales income entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, amount, date } = body;

    const urlParts = new URL(request.url).pathname.split('/');
    const branchIdIndex = urlParts.indexOf('branches') + 1;
    const branchId = urlParts[branchIdIndex];

    if (!name || amount === undefined || !date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      INSERT INTO sales_incomes (branch_id, name, amount, date)
      VALUES (?, ?, ?, ?)
    `;

    const [result]: any = await db.query(query, [
      branchId,
      name,
      amount,
      date,
    ]);

    return NextResponse.json({
      success: true,
      insertId: result.insertId,
      message: 'Sales income added successfully',
    }, { status: 201 });

  } catch (error) {
    console.error("Database insert error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove sales income entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Income ID is required' }, { status: 400 });
    }

    const query = `DELETE FROM sales_incomes WHERE id = ?`;
    await db.query(query, [id]);

    return NextResponse.json({
      success: true,
      message: 'Sales income deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
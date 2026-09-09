import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to extract branch_id safely from URL
function extractBranchId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const urlParts = url.pathname.split('/');
    const branchIndex = urlParts.indexOf('branches');
    if (branchIndex !== -1 && urlParts[branchIndex + 1]) {
      return urlParts[branchIndex + 1];
    }
  } catch (e) {
    console.error("Error extracting branch id from URL", e);
  }
  return null;
}

// GET: Fetch branch sales incomes entries or Branch-wise Summary
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');
    const branchId = searchParams.get('branch_id') || extractBranchId(request);
    const isSummary = searchParams.get('summary') === 'true';

    // 1. Total Incomes Page එක සඳහා සියලුම බ්‍රාන්ච් වල summaries සහ grandTotal ලබා දීම
    if (isSummary) {
      const summaryQuery = `
        SELECT
            branch_id,
            SUM(amount) as total_amount,
            COUNT(id) as entries_count
        FROM
            sales_incomes
        GROUP BY branch_id
        ORDER BY total_amount DESC;
      `;

      const [rows]: any = await db.query(summaryQuery);

      let grandTotal = 0;
      const data = rows.map((row: any) => {
        const totalAmount = Number(row.total_amount || 0);
        grandTotal += totalAmount;

        return {
          branchId: row.branch_id ? row.branch_id.toString() : "Unknown",
          branchName: `Branch Unit #${row.branch_id}`,
          totalAmount: totalAmount,
          entriesCount: Number(row.entries_count || 0),
        };
      });

      return NextResponse.json({
        success: true,
        grandTotal,
        data,
      }, { status: 200 });
    }

    if (!branchId) {
      return NextResponse.json({ success: false, error: 'Branch ID is missing' }, { status: 400 });
    }

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
      branch_id: row.branch_id ? row.branch_id.toString() : branchId,
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

    const branchId = body.branch_id || extractBranchId(request);

    if (!branchId || !name || amount === undefined || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields (branch_id, name, amount, or date)'
      }, { status: 400 });
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
    const branchId = searchParams.get('branch_id') || extractBranchId(request);

    if (!id || !branchId) {
      return NextResponse.json({ success: false, error: 'Income ID and Branch ID are required' }, { status: 400 });
    }

    const query = `DELETE FROM sales_incomes WHERE id = ? AND branch_id = ?`;
    await db.query(query, [id, branchId]);

    return NextResponse.json({
      success: true,
      message: 'Sales income deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
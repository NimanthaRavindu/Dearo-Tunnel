import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch branch-wise total incomes summary
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedSalesId = searchParams.get('selected_sales_id');
    const selectedCapitalId = searchParams.get('selected_capital_id');

    let query = `
      SELECT 
          b.id AS branchId,
          b.branch_name AS branchName,
          COUNT(s.id) AS entriesCount,
          SUM(s.amount) AS totalAmount
      FROM 
          sales_incomes s
      LEFT JOIN 
          branches b ON s.branch_id = b.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    // Oyaage table eke sales_id / capital_id columns thiyena widihata methana column names check karaganna
    if (selectedSalesId) {
      query += ` AND s.sales_id = ?`;
      queryParams.push(selectedSalesId);
    }

    if (selectedCapitalId) {
      query += ` AND s.capital_id = ?`;
      queryParams.push(selectedCapitalId);
    }

    query += ` GROUP BY b.id, b.branch_name;`;

    const [rows]: any = await db.query(query, queryParams);

    const data = rows.map((row: any) => ({
      branchId: row.branchId ? row.branchId.toString() : "Unknown",
      branchName: row.branchName || `Branch Unit #${row.branchId}`,
      totalAmount: Number(row.totalAmount || 0),
      entriesCount: Number(row.entriesCount || 0),
    }));

    const grandTotal = data.reduce((sum: number, item: any) => sum + item.totalAmount, 0);

    return NextResponse.json({
      success: true,
      data,
      grandTotal,
    }, { status: 200 });

  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
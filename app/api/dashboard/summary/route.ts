import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedSalesId = searchParams.get("selected_sales_id");
    const selectedCapitalId = searchParams.get("selected_capital_id");

    const parsedSalesId = selectedSalesId ? Number(selectedSalesId) : null;
    const isSalesFiltered = parsedSalesId !== null && !isNaN(parsedSalesId);

    const parsedCapitalId = selectedCapitalId ? Number(selectedCapitalId) : null;
    const isCapitalFiltered = parsedCapitalId !== null && !isNaN(parsedCapitalId);

    // Arrays to hold parameters strictly in the order they appear in the final query
    const queryParams: any[] = [];

    // Sales Expenses Subquery
    let salesSubQuery = `
      SELECT branch_id, SUM(COALESCE(amount, 0)) AS sales_total 
      FROM sales_expenses 
      GROUP BY branch_id
    `;

    if (isSalesFiltered) {
      salesSubQuery = `
        SELECT branch_id, SUM(COALESCE(amount, 0)) AS sales_total 
        FROM sales_expenses 
        WHERE id = ?
        GROUP BY branch_id
      `;
      queryParams.push(parsedSalesId);
    }

    // Capital Expenses Subquery
    let capitalSubQuery = `
      SELECT branch_id, SUM(COALESCE(amount, 0)) AS capital_total 
      FROM capital_expenses 
      GROUP BY branch_id
    `;

    if (isCapitalFiltered) {
      capitalSubQuery = `
        SELECT branch_id, SUM(COALESCE(amount, 0)) AS capital_total 
        FROM capital_expenses 
        WHERE id = ?
        GROUP BY branch_id
      `;
      queryParams.push(parsedCapitalId); // Note: Correctly pushed after sales param if both exist
    }

    const query = `
      SELECT 
        b.id,
        b.branch_name,
        b.branch_code,
        COALESCE(s.salary_total, 0) AS salary_expenses,
        COALESCE(se.sales_total, 0) AS sales_expenses,
        COALESCE(c.capital_total, 0) AS capital_expenses,
        COALESCE(o.other_total, 0) AS other_expenses,
        COALESCE(s.salary_balance, 0) AS salary_balance,
        COALESCE(o.other_balance, 0) AS other_balance
      FROM branch b
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS salary_total, SUM(COALESCE(balance, 0)) AS salary_balance 
        FROM salary_expenses GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (${salesSubQuery}) se ON b.id = se.branch_id
      LEFT JOIN (${capitalSubQuery}) c ON b.id = c.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS other_total, SUM(COALESCE(balance, 0)) AS other_balance 
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
    `;

    const [branches]: any = await db.query(query, queryParams);

    let totalBranches = Array.isArray(branches) ? branches.length : 0;
    let totalExpenses = 0;
    let totalRemaining = 0;

    if (Array.isArray(branches)) {
      branches.forEach((b: any) => {
        b.salary_expenses = Number(b.salary_expenses || 0);
        b.sales_expenses = Number(b.sales_expenses || 0);
        b.capital_expenses = Number(b.capital_expenses || 0);
        b.other_expenses = Number(b.other_expenses || 0);

        b.total_expenses = b.salary_expenses + b.other_expenses + b.sales_expenses + b.capital_expenses;
        
        b.salary_balance = Number(b.salary_balance || 0);
        b.other_balance = Number(b.other_balance || 0);
        b.total_balance = b.salary_balance + b.other_balance;

        totalExpenses += b.total_expenses;
        totalRemaining += b.total_balance;
      });
    }

    return NextResponse.json({
      cards: {
        totalBranches,
        totalExpenses,
        totalRemaining,
      },
      branches: branches || [],
    });
  } catch (error: any) {
    console.error("Dashboard Summary API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
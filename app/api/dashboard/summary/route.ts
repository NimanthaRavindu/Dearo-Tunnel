import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedSalesId = searchParams.get("selected_sales_id");
    const selectedCapitalId = searchParams.get("selected_capital_id");

    const parsedSalesId = selectedSalesId ? Number(selectedSalesId) : null;
    const parsedCapitalId = selectedCapitalId ? Number(selectedCapitalId) : null;

    // Fixed and safe SQL Query for Summaries
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
      LEFT JOIN (
        SELECT branch_id, 
          SUM(
            CASE 
              WHEN ? IS NOT NULL THEN (CASE WHEN id = ? THEN COALESCE(amount, 0) ELSE 0 END)
              ELSE COALESCE(amount, 0) 
            END
          ) AS sales_total 
        FROM sales_expenses GROUP BY branch_id
      ) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT branch_id, 
          SUM(
            CASE 
              WHEN ? IS NOT NULL THEN (CASE WHEN id = ? THEN COALESCE(amount, 0) ELSE 0 END)
              ELSE COALESCE(amount, 0) 
            END
          ) AS capital_total 
        FROM capital_expenses GROUP BY branch_id
      ) c ON b.id = c.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS other_total, SUM(COALESCE(balance, 0)) AS other_balance 
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
    `;

    let finalQueryParams: any[] = [
      parsedSalesId, 
      parsedSalesId, 
      parsedCapitalId, 
      parsedCapitalId
    ];

    const [branches]: any = await db.query(query, finalQueryParams);

    // Fetch all available Sales details safely
    const [salesRows]: any = await db.query(`
      SELECT se.id, se.amount, se.date, se.description, b.branch_name 
      FROM sales_expenses se 
      LEFT JOIN branch b ON se.branch_id = b.id 
      ORDER BY se.id ASC
    `).catch(() => [[]]);

    // Fetch all available Capital details safely
    const [capitalRows]: any = await db.query(`
      SELECT ce.id, ce.amount, ce.date, ce.description, b.branch_name 
      FROM capital_expenses ce 
      LEFT JOIN branch b ON ce.branch_id = b.id 
      ORDER BY ce.id ASC
    `).catch(() => [[]]);

    let totalBranches = Array.isArray(branches) ? branches.length : 0;
    let totalExpenses = 0;
    let totalRemaining = 0;

    if (Array.isArray(branches)) {
      branches.forEach((b: any) => {
        b.salary_expenses = Number(b.salary_expenses || 0);
        b.sales_expenses = Number(b.sales_expenses || 0);
        b.capital_expenses = Number(b.capital_expenses || 0);
        b.other_expenses = Number(b.other_expenses || 0);

        b.salary_balance = Number(b.salary_balance || 0);
        b.other_balance = Number(b.other_balance || 0);
        
        b.sales_expenses_val = Number(b.sales_expenses || 0);
        b.capital_expenses_val = Number(b.capital_expenses || 0);

        b.total_expenses = b.salary_expenses + b.other_expenses + b.sales_expenses + b.capital_expenses;
        b.total_balance = b.salary_balance + b.other_balance + b.sales_expenses_val + b.capital_expenses_val;

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
      sales: Array.isArray(salesRows) ? salesRows.map((r: any) => ({
        id: r.id,
        name: r.description || `Sales Entry #${r.id}`,
        branch: { branch_name: r.branch_name || "N/A" },
        date: r.date || "",
        amount: r.amount || 0
      })) : [],
      capital: Array.isArray(capitalRows) ? capitalRows.map((r: any) => ({
        id: r.id,
        name: r.description || `Capital Entry #${r.id}`,
        branch: { branch_name: r.branch_name || "N/A" },
        date: r.date || "",
        amount: r.amount || 0
      })) : [],
    });
  } catch (error: any) {
    console.error("Dashboard Summary API Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
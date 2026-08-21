import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedSalesId = searchParams.get("selected_sales_id");

    // Dynamic Sales JOIN Query
    let salesSubQuery = `SELECT branch_id, SUM(COALESCE(amount, 0)) AS sales_total FROM sales_expenses GROUP BY branch_id`;
    
    if (selectedSalesId) {
      const parsedId = Number(selectedSalesId);
      if (!isNaN(parsedId)) {
        salesSubQuery = `SELECT branch_id, SUM(COALESCE(amount, 0)) AS sales_total FROM sales_expenses WHERE id = ${parsedId} GROUP BY branch_id`;
      }
    }

    // 1. UPDATE branch table (uses total_payable for other_expenses)
    await db.query(`
      UPDATE branch b
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS salary_total, SUM(COALESCE(balance, 0)) AS salary_balance
        FROM salary_expenses GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (${salesSubQuery}) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS other_total, SUM(COALESCE(balance, 0)) AS other_balance
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
      SET 
        b.total_expenses = COALESCE(s.salary_total, 0) + COALESCE(o.other_total, 0) + 
          CASE 
            WHEN COALESCE(s.salary_total, 0) > 0 AND COALESCE(o.other_total, 0) > 0 
            THEN COALESCE(se.sales_total, 0) 
            ELSE 0 
          END,
        b.total_balance = COALESCE(s.salary_balance, 0) + COALESCE(o.other_balance, 0)
    `);

    // 2. Fetch calculated values per branch
    const query = `
      SELECT 
        b.id,
        b.branch_name,
        b.branch_code,
        COALESCE(s.salary_total, 0) AS salary_expenses,
        COALESCE(se.sales_total, 0) AS sales_expenses,
        COALESCE(o.other_total, 0) AS other_expenses,
        (
          COALESCE(s.salary_total, 0) + COALESCE(o.other_total, 0) + 
          CASE 
            WHEN COALESCE(s.salary_total, 0) > 0 AND COALESCE(o.other_total, 0) > 0 
            THEN COALESCE(se.sales_total, 0) 
            ELSE 0 
          END
        ) AS total_expenses,
        COALESCE(s.salary_balance, 0) AS salary_balance,
        COALESCE(o.other_balance, 0) AS other_balance,
        (COALESCE(s.salary_balance, 0) + COALESCE(o.other_balance, 0)) AS total_balance
      FROM branch b
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS salary_total, SUM(COALESCE(balance, 0)) AS salary_balance 
        FROM salary_expenses GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (${salesSubQuery}) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS other_total, SUM(COALESCE(balance, 0)) AS other_balance 
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
    `;

    const [branches]: any = await db.query(query);

    let totalBranches = Array.isArray(branches) ? branches.length : 0;
    let totalExpenses = 0;
    let totalRemaining = 0;

    if (Array.isArray(branches)) {
      branches.forEach((b: any) => {
        b.salary_expenses = Number(b.salary_expenses || 0);
        b.sales_expenses = Number(b.sales_expenses || 0);
        b.other_expenses = Number(b.other_expenses || 0);

        // Condition: Salary සහ Other දෙකම > 0 නම් පමණක් Sales Expense එකතු වේ
        const effectiveSales = (b.salary_expenses > 0 && b.other_expenses > 0) ? b.sales_expenses : 0;
        
        b.total_expenses = b.salary_expenses + b.other_expenses + effectiveSales;
        b.salary_balance = Number(b.salary_balance || 0);
        b.other_balance = Number(b.other_balance || 0);
        b.total_balance = Number(b.total_balance || 0);

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
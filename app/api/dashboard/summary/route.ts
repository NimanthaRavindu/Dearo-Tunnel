import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET() {
  try {
    // 1. UPDATE branch table with conditional logic for total_expenses
    await db.query(`
      UPDATE branch b
      LEFT JOIN (
        SELECT 
          branch_id,
          SUM(COALESCE(total_payable, 0)) AS salary_total,
          SUM(COALESCE(balance, 0)) AS salary_balance
        FROM salary_expenses
        GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (
        SELECT 
          branch_id,
          SUM(COALESCE(amount, 0)) AS sales_total
        FROM sales_expenses
        GROUP BY branch_id
      ) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT 
          branch_id,
          SUM(COALESCE(total_payable, 0)) AS other_total,
          SUM(COALESCE(balance, 0)) AS other_balance
        FROM other_expenses
        GROUP BY branch_id
      ) o ON b.id = o.branch_id
      SET 
        b.total_expenses = CASE 
          WHEN COALESCE(s.salary_total, 0) > 0 OR COALESCE(o.other_total, 0) > 0 
          THEN COALESCE(s.salary_total, 0) + COALESCE(se.sales_total, 0) + COALESCE(o.other_total, 0)
          ELSE COALESCE(s.salary_total, 0) + COALESCE(o.other_total, 0)
        END,
        b.total_balance = COALESCE(s.salary_balance, 0) + COALESCE(o.other_balance, 0)
    `);

    // 2. Fetch calculated values per branch using Subquery Joins
    const query = `
      SELECT 
        b.id,
        b.branch_name,
        b.branch_code,
        COALESCE(s.salary_total, 0) AS salary_expenses,
        COALESCE(se.sales_total, 0) AS sales_expenses,
        COALESCE(o.other_total, 0) AS other_expenses,
        CASE 
          WHEN COALESCE(s.salary_total, 0) > 0 OR COALESCE(o.other_total, 0) > 0 
          THEN COALESCE(s.salary_total, 0) + COALESCE(se.sales_total, 0) + COALESCE(o.other_total, 0)
          ELSE COALESCE(s.salary_total, 0) + COALESCE(o.other_total, 0)
        END AS total_expenses,
        COALESCE(s.salary_balance, 0) AS salary_balance,
        COALESCE(o.other_balance, 0) AS other_balance,
        (COALESCE(s.salary_balance, 0) + COALESCE(o.other_balance, 0)) AS total_balance
      FROM branch b
      LEFT JOIN (
        SELECT branch_id, SUM(total_payable) AS salary_total, SUM(balance) AS salary_balance 
        FROM salary_expenses GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(amount) AS sales_total 
        FROM sales_expenses GROUP BY branch_id
      ) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(total_payable) AS other_total, SUM(balance) AS other_balance 
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
    `;

    const [branches]: any = await db.execute(query);

    let totalBranches = branches.length;
    let totalExpenses = 0;
    let totalRemaining = 0;

    branches.forEach((b: any) => {
      b.salary_expenses = parseFloat(b.salary_expenses);
      b.sales_expenses = parseFloat(b.sales_expenses);
      b.other_expenses = parseFloat(b.other_expenses);
      b.total_expenses = parseFloat(b.total_expenses);
      
      b.salary_balance = parseFloat(b.salary_balance);
      b.other_balance = parseFloat(b.other_balance);
      b.total_balance = parseFloat(b.total_balance);

      totalExpenses += b.total_expenses;
      totalRemaining += b.total_balance;
    });

    return NextResponse.json({
      cards: {
        totalBranches,
        totalExpenses,
        totalRemaining,
      },
      branches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
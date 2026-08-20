import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET() {
  try {
    // 1. UPDATE branch table with straight total calculation
    await db.query(`
      UPDATE branch b
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS salary_total, SUM(COALESCE(balance, 0)) AS salary_balance
        FROM salary_expenses GROUP BY branch_id
      ) s ON b.id = s.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(amount, 0)) AS sales_total
        FROM sales_expenses GROUP BY branch_id
      ) se ON b.id = se.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(COALESCE(total_payable, 0)) AS other_total, SUM(COALESCE(balance, 0)) AS other_balance
        FROM other_expenses GROUP BY branch_id
      ) o ON b.id = o.branch_id
      SET 
        b.total_expenses = COALESCE(s.salary_total, 0) + COALESCE(se.sales_total, 0) + COALESCE(o.other_total, 0),
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
        (COALESCE(s.salary_total, 0) + COALESCE(se.sales_total, 0) + COALESCE(o.other_total, 0)) AS total_expenses,
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
      b.salary_expenses = Number(b.salary_expenses || 0);
      b.sales_expenses = Number(b.sales_expenses || 0);
      b.other_expenses = Number(b.other_expenses || 0);
      b.total_expenses = Number(b.total_expenses || 0);
      
      b.salary_balance = Number(b.salary_balance || 0);
      b.other_balance = Number(b.other_balance || 0);
      b.total_balance = Number(b.total_balance || 0);

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
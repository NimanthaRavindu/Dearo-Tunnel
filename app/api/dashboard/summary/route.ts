import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET() {
  try {
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
          SUM(COALESCE(total_payable, 0)) AS other_total,
          SUM(COALESCE(balance, 0)) AS other_balance
        FROM other_expenses
        GROUP BY branch_id
      ) o ON b.id = o.branch_id
      SET 
        b.total_expenses = COALESCE(s.salary_total, 0) + COALESCE(o.other_total, 0),
        b.total_balance = COALESCE(s.salary_balance, 0) + COALESCE(o.other_balance, 0)
    `);

    const query = `
      SELECT 
        b.id,
        b.branch_name,
        b.branch_code,
        COALESCE(SUM(s.total_payable), 0) AS salary_expenses,
        COALESCE(SUM(o.total_payable), 0) AS other_expenses,
        (COALESCE(SUM(s.total_payable), 0) + COALESCE(SUM(o.total_payable), 0)) AS total_expenses,
        COALESCE(SUM(s.balance), 0) AS salary_balance,
        COALESCE(SUM(o.balance), 0) AS other_balance,
        (COALESCE(SUM(s.balance), 0) + COALESCE(SUM(o.balance), 0)) AS total_balance
      FROM branch b
      LEFT JOIN salary_expenses s ON b.id = s.branch_id
      LEFT JOIN other_expenses o ON b.id = o.branch_id
      GROUP BY b.id, b.branch_name, b.branch_code
    `;

    const [branches]: any = await db.execute(query);

    let totalBranches = branches.length;
    let totalExpenses = 0;
    let totalRemaining = 0;

    branches.forEach((b: any) => {
      b.salary_expenses = parseFloat(b.salary_expenses);
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
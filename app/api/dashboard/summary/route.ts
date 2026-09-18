import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const selectedSalesId = searchParams.get("selected_sales_id");
    const selectedCapitalId = searchParams.get("selected_capital_id");
    const selectedDieselId = searchParams.get("selected_diesel_id");

    const salesId = selectedSalesId ? Number(selectedSalesId) : null;
    const capitalId = selectedCapitalId ? Number(selectedCapitalId) : null;
    const dieselId = selectedDieselId ? Number(selectedDieselId) : null;

    const query = `
      SELECT
        b.id,
        b.branch_name,
        b.branch_code,

        COALESCE(s.salary_total, 0) AS salary_expenses,
        COALESCE(se.sales_total, 0) AS sales_expenses,
        COALESCE(c.capital_total, 0) AS capital_expenses,
        COALESCE(o.other_total, 0) AS other_expenses,
        COALESCE(d.diesel_total, 0) AS diesel_expenses,

        COALESCE(s.salary_balance, 0) AS salary_balance,
        COALESCE(o.other_balance, 0) AS other_balance,
        COALESCE(d.diesel_balance, 0) AS diesel_balance

      FROM branch b

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
        WHERE (? IS NULL OR id = ?)
        GROUP BY branch_id
      ) se ON b.id = se.branch_id

      LEFT JOIN (
        SELECT
          branch_id,
          SUM(COALESCE(amount, 0)) AS capital_total
        FROM capital_expenses
        WHERE (? IS NULL OR id = ?)
        GROUP BY branch_id
      ) c ON b.id = c.branch_id

      LEFT JOIN (
        SELECT
          branch_id,
          SUM(COALESCE(total_payable, 0)) AS other_total,
          SUM(COALESCE(balance, 0)) AS other_balance
        FROM other_expenses
        GROUP BY branch_id
      ) o ON b.id = o.branch_id

      LEFT JOIN (
        SELECT
          branch_id,
          SUM(COALESCE(amount, 0)) AS diesel_total,
          SUM(COALESCE(payable, 0) - COALESCE(paid, 0)) AS diesel_balance
        FROM diesel_expenses
        WHERE (? IS NULL OR id = ?)
        GROUP BY branch_id
      ) d ON b.id = d.branch_id
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [
      salesId,
      salesId,
      capitalId,
      capitalId,
      dieselId,
      dieselId,
    ]);

    const branches = rows.map((branch: any) => {
      const salaryExpenses = Number(branch.salary_expenses || 0);
      const salesExpenses = Number(branch.sales_expenses || 0);
      const capitalExpenses = Number(branch.capital_expenses || 0);
      const otherExpenses = Number(branch.other_expenses || 0);
      const dieselExpenses = Number(branch.diesel_expenses || 0);

      const salaryBalance = Number(branch.salary_balance || 0);
      const otherBalance = Number(branch.other_balance || 0);
      const dieselBalance = Number(branch.diesel_balance || 0);

      return {
        ...branch,

        salary_expenses: salaryExpenses,
        sales_expenses: salesExpenses,
        capital_expenses: capitalExpenses,
        other_expenses: otherExpenses,
        diesel_expenses: dieselExpenses,

        salary_balance: salaryBalance,
        other_balance: otherBalance,
        diesel_balance: dieselBalance,

        total_expenses:
          salaryExpenses +
          salesExpenses +
          capitalExpenses +
          otherExpenses +
          dieselExpenses,

        total_balance:
          salaryBalance +
          salesExpenses +
          capitalExpenses +
          otherBalance +
          dieselBalance,
      };
    });

    const [salesRows] = await db.query<RowDataPacket[]>(`
      SELECT
        se.*,
        b.branch_name
      FROM sales_expenses se
      LEFT JOIN branch b ON se.branch_id = b.id
      ORDER BY se.id ASC
    `);

    const [capitalRows] = await db.query<RowDataPacket[]>(`
      SELECT
        ce.*,
        b.branch_name
      FROM capital_expenses ce
      LEFT JOIN branch b ON ce.branch_id = b.id
      ORDER BY ce.id ASC
    `);

    const totalExpenses = branches.reduce(
      (total, branch: any) => total + Number(branch.total_expenses || 0),
      0,
    );

    const totalRemaining = branches.reduce(
      (total, branch: any) => total + Number(branch.total_balance || 0),
      0,
    );

    return NextResponse.json({
      cards: {
        totalBranches: branches.length,
        totalExpenses,
        totalRemaining,
      },

      branches,

      sales: salesRows.map((row: any) => ({
        id: row.id,
        name:
          row.personName ||
          row.person_name ||
          row.name ||
          `Sales Entry #${row.id}`,
        branch_name: row.branch_name || "N/A",
        date: row.date ? String(row.date).split("T")[0] : "",
        amount: Number(row.amount || 0),
      })),

      capital: capitalRows.map((row: any) => ({
        id: row.id,
        name:
          row.person_name ||
          row.personName ||
          row.name ||
          `Capital Entry #${row.id}`,
        branch_name: row.branch_name || "N/A",
        date: row.date ? String(row.date).split("T")[0] : "",
        amount: Number(row.amount || 0),
      })),
    });
  } catch (error: any) {
    console.error(
      "Dashboard Summary API Error:",
      error.message || error,
    );

    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
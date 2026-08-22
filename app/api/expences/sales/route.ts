import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// 1. GET Request
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch_id = searchParams.get("branch_id");
    const mode = searchParams.get("mode");
    const selected_sales_id = searchParams.get("selected_sales_id");

    // Summary mode computation for single branch
    if (mode === "summary" && branch_id) {
      const [branchRows] = await db.query<RowDataPacket[]>(
        `SELECT salary_expense, other_expense FROM branch WHERE id = ?`,
        [branch_id]
      );

      const salaryExpense = Number(branchRows[0]?.salary_expense || 0);
      const otherExpense = Number(branchRows[0]?.other_expense || 0);

      let salesQuery = `SELECT SUM(amount) AS total_sales FROM sales_expenses WHERE branch_id = ?`;
      const salesQueryParams: (string | number)[] = [branch_id];

      if (selected_sales_id) {
        salesQuery += ` AND id = ?`;
        salesQueryParams.push(selected_sales_id);
      }

      const [salesRows] = await db.query<RowDataPacket[]>(salesQuery, salesQueryParams);
      const rawSalesTotal = Number(salesRows[0]?.total_sales || 0);

      // Rule: Effective sales added ONLY IF both salary & other > 0
      const effectiveSalesExpense =
        salaryExpense <= 0 || otherExpense <= 0 ? 0 : rawSalesTotal;

      const grandTotal = salaryExpense + otherExpense + effectiveSalesExpense;

      return NextResponse.json(
        {
          branch_id: Number(branch_id),
          salary_expense: salaryExpense,
          other_expense: otherExpense,
          raw_sales_expense: rawSalesTotal,
          effective_sales_expense: effectiveSalesExpense,
          is_sales_ignored: salaryExpense <= 0 || otherExpense <= 0,
          grand_total: grandTotal,
        },
        { status: 200 }
      );
    }

    // Default Fetch Records mode
    let query = `
      SELECT s.id, s.branch_id, b.branch_name, s.personName, s.amount, DATE_FORMAT(s.date, '%Y-%m-%d') as date 
      FROM sales_expenses s
      LEFT JOIN branch b ON s.branch_id = b.id
    `;
    const queryParams: (string | number)[] = [];

    if (branch_id) {
      query += ` WHERE s.branch_id = ?`;
      queryParams.push(branch_id);
    }

    query += ` ORDER BY s.date DESC, s.id DESC`;

    const [rows] = await db.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales expenses records" },
      { status: 500 }
    );
  }
}

// 2. POST Request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch_id, personName, amount, date } = body;

    if (!branch_id || !personName || !amount || !date) {
      return NextResponse.json(
        { error: "All required fields (branch_id, personName, amount, date) must be provided" },
        { status: 400 }
      );
    }

    const parsedBranchId = parseInt(branch_id, 10);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedBranchId) || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid branch_id or amount provided" },
        { status: 400 }
      );
    }

    // Ensure valid YYYY-MM-DD string without UTC shift issues
    const cleanDate = date.split("T")[0];

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO sales_expenses (branch_id, personName, amount, date) VALUES (?, ?, ?, ?)",
      [parsedBranchId, personName.trim(), parsedAmount, cleanDate]
    );

    const [newRows] = await db.query<RowDataPacket[]>(
      `SELECT s.id, s.branch_id, b.branch_name, s.personName, s.amount, DATE_FORMAT(s.date, '%Y-%m-%d') as date 
       FROM sales_expenses s 
       LEFT JOIN branch b ON s.branch_id = b.id 
       WHERE s.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newRows[0], { status: 201 });
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create sales expense entry" },
      { status: 500 }
    );
  }
}

// 3. DELETE Request
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json(
        { error: "Valid expense record ID is required" },
        { status: 400 }
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM sales_expenses WHERE id = ?",
      [parseInt(id, 10)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Expense record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Expense record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense record" },
      { status: 500 }
    );
  }
}
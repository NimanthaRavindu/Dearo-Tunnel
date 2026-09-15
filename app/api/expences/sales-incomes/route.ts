import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SalesIncomeRequestBody {
  branch_id?: string | number;
  name?: string;
  amount?: number | string;
  credit?: number | string;
  date?: string;
}

function extractBranchId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const urlParts = url.pathname.split("/");
    const branchIndex = urlParts.indexOf("branches");

    if (branchIndex !== -1 && urlParts[branchIndex + 1]) {
      return urlParts[branchIndex + 1];
    }
  } catch (error) {
    console.error("Error extracting branch ID from URL:", error);
  }

  return null;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

function formatDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").slice(0, 10);
}

// GET: Fetch sales income records or branch-wise summary
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const recordId = searchParams.get("id");
    const requestedBranchId = searchParams.get("branch_id");
    const branchId = requestedBranchId || extractBranchId(request);
    const filterDate = searchParams.get("date");
    const isSummary = searchParams.get("summary") === "true";

    if (filterDate && !isValidDate(filterDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD.",
        },
        { status: 400 },
      );
    }

    if (isSummary) {
      const queryParams: string[] = [];

      let summaryQuery = `
        SELECT
          s.branch_id,
          b.branch_name AS branch_name,
          SUM(s.amount) AS total_amount,
          SUM(s.credit) AS total_credit,
          COUNT(s.id) AS entries_count
        FROM sales_incomes s
        LEFT JOIN branch b ON s.branch_id = b.id
      `;

      const whereConditions: string[] = [];

      if (branchId) {
        whereConditions.push("s.branch_id = ?");
        queryParams.push(branchId);
      }

      if (filterDate) {
        whereConditions.push("DATE(s.date) = ?");
        queryParams.push(filterDate);
      }

      if (whereConditions.length > 0) {
        summaryQuery += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      summaryQuery += `
        GROUP BY s.branch_id, b.branch_name
        ORDER BY total_amount DESC
      `;

      const [rows]: any = await db.query(summaryQuery, queryParams);

      let grandTotal = 0;
      let grandCredit = 0;

      const data = rows.map((row: any) => {
        const totalAmount = Number(row.total_amount || 0);
        const totalCredit = Number(row.total_credit || 0);

        grandTotal += totalAmount;
        grandCredit += totalCredit;

        return {
          branchId:
            row.branch_id !== null && row.branch_id !== undefined
              ? String(row.branch_id)
              : "Unknown",
          branchName:
            row.branch_name ||
            `Branch Unit #${row.branch_id ?? "Unknown"}`,
          totalAmount,
          totalCredit,
          entriesCount: Number(row.entries_count || 0),
        };
      });

      return NextResponse.json(
        {
          success: true,
          grandTotal,
          grandCredit,
          data,
        },
        { status: 200 },
      );
    }

    if (!branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Branch ID is missing.",
        },
        { status: 400 },
      );
    }

    let query = `
      SELECT
        id,
        name,
        amount,
        credit,
        date,
        branch_id,
        created_at
      FROM sales_incomes
      WHERE branch_id = ?
    `;

    const queryParams: Array<string | number> = [branchId];

    if (recordId) {
      query += " AND id = ?";
      queryParams.push(recordId);
    }

    if (filterDate) {
      query += " AND DATE(date) = ?";
      queryParams.push(filterDate);
    }

    query += " ORDER BY date DESC, id DESC";

    const [rows]: any = await db.query(query, queryParams);

    const data = rows.map((row: any) => ({
      id: String(row.id),
      name: row.name || "",
      amount: Number(row.amount || 0),
      credit: Number(row.credit || 0),
      date: formatDate(row.date),
      branch_id:
        row.branch_id !== null && row.branch_id !== undefined
          ? String(row.branch_id)
          : String(branchId),
      created_at: row.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Database fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error.",
      },
      { status: 500 },
    );
  }
}

// POST: Add a new sales income entry
export async function POST(request: Request) {
  try {
    const body: SalesIncomeRequestBody = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";

    const branchId =
      body.branch_id !== undefined && body.branch_id !== null
        ? String(body.branch_id)
        : extractBranchId(request);

    const amount = Number(body.amount);
    const credit = Number(body.credit ?? 0);

    if (!branchId || !name || !date || body.amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: branch_id, name, amount, or date.",
        },
        { status: 400 },
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be a valid non-negative number.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(credit) || credit < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Credit must be a valid non-negative number.",
        },
        { status: 400 },
      );
    }

    if (credit > amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Credit cannot be greater than the total amount.",
        },
        { status: 400 },
      );
    }

    const insertQuery = `
      INSERT INTO sales_incomes
        (branch_id, name, amount, credit, date)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result]: any = await db.query(insertQuery, [
      branchId,
      name,
      amount,
      credit,
      date,
    ]);

    return NextResponse.json(
      {
        success: true,
        insertId: result.insertId,
        message: "Sales income added successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Database insert error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error.",
      },
      { status: 500 },
    );
  }
}

// DELETE: Remove a sales income entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const requestedBranchId = searchParams.get("branch_id");
    const branchId = requestedBranchId || extractBranchId(request);

    if (!id || !branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Income ID and Branch ID are required.",
        },
        { status: 400 },
      );
    }

    const deleteQuery = `
      DELETE FROM sales_incomes
      WHERE id = ? AND branch_id = ?
    `;

    const [result]: any = await db.query(deleteQuery, [id, branchId]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sales income record not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sales income deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Database delete error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error.",
      },
      { status: 500 },
    );
  }
}
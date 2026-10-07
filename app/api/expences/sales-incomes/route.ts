import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SalesIncomeRequestBody {
  branch_id?: string | number;
  name?: string;
  amount?: number | string;
  credit?: number | string;
  unit_price?: number | string;
  quantity?: number | string;
  date?: string;
}

function extractBranchId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const urlParts = url.pathname.split("/");
    const branchIndex = urlParts.indexOf("branches");
    if (branchIndex!== -1 && urlParts[branchIndex + 1]) return urlParts[branchIndex + 1];
  } catch (error) { console.error("Error extracting branch ID from URL:", error); }
  return null;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return!Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
}

function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value?? "").slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("id") || searchParams.get("selected_sales_id");
    const requestedBranchId = searchParams.get("branch_id");
    const branchId = requestedBranchId || extractBranchId(request);
    const filterDate = searchParams.get("date");
    const isSummary = searchParams.get("summary") === "true";
    const isDetailed = searchParams.get("detailed") === "true";

    if (filterDate &&!isValidDate(filterDate)) {
      return NextResponse.json({ success: false, error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    // --- SUMMARY MODE (total-incomes + view-entries) ---
    if (isSummary) {
      // DETAILED: view-entries page eke anawa
      if (isDetailed || recordId) {
        const where: string[] = [];
        const params: any[] = [];
        if (branchId) { where.push("s.branch_id =?"); params.push(branchId); }
        if (filterDate) { where.push("DATE(s.date) =?"); params.push(filterDate); }
        if (recordId) { where.push("s.id =?"); params.push(recordId); }

        let q = `
          SELECT s.id, s.name, s.amount, s.credit, s.unit_price, s.quantity, s.date, s.branch_id, s.created_at, b.branch_name
          FROM sales_incomes s LEFT JOIN branch b ON s.branch_id = b.id
        `;
        if (where.length) q += ` WHERE ${where.join(" AND ")}`;
        q += ` ORDER BY s.date DESC, s.id DESC`;

        const [rows]: any = await db.query(q, params);
        let grandTotal = 0; let grandCredit = 0;
        const data = rows.map((r: any) => {
          grandTotal += Number(r.amount || 0);
          grandCredit += Number(r.credit || 0);
          return {
            id: String(r.id),
            name: r.name || "",
            amount: Number(r.amount || 0),
            credit: Number(r.credit || 0),
            unit_price: Number(r.unit_price || 0),
            quantity: Number(r.quantity || 0),
            date: formatDate(r.date),
            branch_id: String(r.branch_id),
            branch_name: r.branch_name || `Branch #${r.branch_id}`,
            created_at: r.created_at,
            description: r.name || `Income #${r.id}`,
          };
        });
        return NextResponse.json({ success: true, grandTotal, grandCredit, data }, { status: 200 });
      }

      // GROUPED: total-incomes page eke anawa
      const where: string[] = [];
      const params: any[] = [];
      if (branchId) { where.push("s.branch_id =?"); params.push(branchId); }
      if (filterDate) { where.push("DATE(s.date) =?"); params.push(filterDate); }

      let summaryQuery = `
        SELECT s.branch_id, COALESCE(b.branch_name, CONCAT('Branch #', s.branch_id)) as branch_name,
               SUM(s.amount) as total_amount, SUM(s.credit) as total_credit,
               COUNT(s.id) as entries_count, MAX(s.date) as last_date
        FROM sales_incomes s LEFT JOIN branch b ON s.branch_id = b.id
      `;
      if (where.length) summaryQuery += ` WHERE ${where.join(" AND ")}`;
      summaryQuery += ` GROUP BY s.branch_id, b.branch_name ORDER BY total_amount DESC`;

      const [rows]: any = await db.query(summaryQuery, params);
      let grandTotal = 0; let grandCredit = 0;
      const data = rows.map((row: any) => {
        grandTotal += Number(row.total_amount || 0);
        grandCredit += Number(row.total_credit || 0);
        return {
          branchId: String(row.branch_id),
          branchName: row.branch_name,
          branch_name: row.branch_name,
          totalAmount: Number(row.total_amount || 0),
          total_amount: Number(row.total_amount || 0),
          totalCredit: Number(row.total_credit || 0),
          total_credit: Number(row.total_credit || 0),
          entriesCount: Number(row.entries_count || 0),
          entries_count: Number(row.entries_count || 0),
          last_date: formatDate(row.last_date),
          date: formatDate(row.last_date),
        };
      });
      return NextResponse.json({ success: true, grandTotal, grandCredit, data }, { status: 200 });
    }

    // --- NORMAL BRANCH FETCH ---
    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID is missing." }, { status: 400 });
    }

    let query = `SELECT id, name, amount, credit, unit_price, quantity, date, branch_id, created_at FROM sales_incomes WHERE branch_id =?`;
    const qParams: any[] = [branchId];
    if (recordId) { query += " AND id =?"; qParams.push(recordId); }
    if (filterDate) { query += " AND DATE(date) =?"; qParams.push(filterDate); }
    query += " ORDER BY date DESC, id DESC";
    const [rows]: any = await db.query(query, qParams);
    const data = rows.map((row: any) => ({
      id: String(row.id),
      name: row.name || "",
      amount: Number(row.amount || 0),
      credit: Number(row.credit || 0),
      unit_price: Number(row.unit_price || 0),
      quantity: Number(row.quantity || 0),
      date: formatDate(row.date),
      branch_id: String(row.branch_id),
      created_at: row.created_at,
    }));
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: SalesIncomeRequestBody = await request.json();
    const name = typeof body.name === "string"? body.name.trim() : "";
    const date = typeof body.date === "string"? body.date : "";
    const branchId = body.branch_id!== undefined && body.branch_id!== null? String(body.branch_id) : extractBranchId(request);

    const unit_price = Number(body.unit_price?? 0);
    const quantity = Number(body.quantity?? 0);
    let amount = Number(body.amount);
    // auto calculate if amount not sent or 0
    if (!Number.isFinite(amount) || amount === 0) {
      amount = unit_price * quantity;
    }
    const credit = Number(body.credit?? 0);

    if (!branchId ||!name ||!date) {
      return NextResponse.json({ success: false, error: "Missing required fields: branch_id, name, date." }, { status: 400 });
    }
    if (body.unit_price === undefined || body.quantity === undefined) {
       // allow old code but require at least amount
       if (body.amount === undefined) {
         return NextResponse.json({ success: false, error: "Missing unit_price, quantity or amount" }, { status: 400 });
       }
    }
    if (!isValidDate(date)) return NextResponse.json({ success: false, error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    if (!Number.isFinite(unit_price) || unit_price < 0) return NextResponse.json({ success: false, error: "Unit price must be valid." }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ success: false, error: "Quantity must be > 0." }, { status: 400 });
    if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ success: false, error: "Amount must be valid." }, { status: 400 });
    if (!Number.isFinite(credit) || credit < 0) return NextResponse.json({ success: false, error: "Credit must be valid." }, { status: 400 });
    if (credit > amount) return NextResponse.json({ success: false, error: "Credit cannot be greater than the total amount." }, { status: 400 });

    const insertQuery = `INSERT INTO sales_incomes (branch_id, name, unit_price, quantity, amount, credit, date) VALUES (?,?,?,?,?,?,?)`;
    const [result]: any = await db.query(insertQuery, [branchId, name, unit_price, quantity, amount, credit, date]);
    return NextResponse.json({ success: true, insertId: result.insertId, message: "Sales income added successfully." }, { status: 201 });
  } catch (error) {
    console.error("Database insert error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const requestedBranchId = searchParams.get("branch_id");
    const branchId = requestedBranchId || extractBranchId(request);
    if (!id ||!branchId) return NextResponse.json({ success: false, error: "Income ID and Branch ID are required." }, { status: 400 });
    const deleteQuery = `DELETE FROM sales_incomes WHERE id =? AND branch_id =?`;
    const [result]: any = await db.query(deleteQuery, [id, branchId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Sales income record not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Sales income deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}
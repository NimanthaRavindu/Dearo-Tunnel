import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SalesIncomeRequestBody {
  branch_id?: string | number;
  bill_number?: string;
  name?: string;
  amount?: number | string;
  credit?: number | string;
  paid?: number | string;
  discount?: number | string;
  unit_price?: number | string;
  quantity?: number | string;
  date?: string;
}

function extractBranchId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const urlParts = url.pathname.split("/");
    const branchIndex = urlParts.indexOf("branches");
    if (branchIndex !== -1 && urlParts[branchIndex + 1]) return urlParts[branchIndex + 1];
  } catch (error) { console.error("Error extracting branch ID from URL:", error); }
  return null;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
}

function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

async function getPriceFromDB(name: string, branchId: string | null): Promise<number | null> {
  try {
    const [rows]: any = await db.query(
      `SELECT unit_price, category FROM product_prices WHERE product_name = ? AND (branch_id IS NULL OR branch_id = ?) LIMIT 1`,
      [name, branchId]
    );
    if (!rows || rows.length === 0) return null;
    if (rows[0].unit_price == null) return null;
    return Number(rows[0].unit_price);
  } catch { return null; }
}

// ✅ FIX - Rathu ira ain karala - paid column eka DB eke thiyenawada balanawa
let hasPaidColumn: boolean | null = null;
async function checkPaidColumn(): Promise<boolean> {
  if (hasPaidColumn !== null) return hasPaidColumn;
  try {
    const [rows]: any = await db.query(`SHOW COLUMNS FROM sales_incomes LIKE 'paid'`);
    hasPaidColumn = rows && rows.length > 0;
  } catch { hasPaidColumn = false; }
  return hasPaidColumn ?? false; // ✅ Me line eka thamai fix eka - null nam false
}

// ✅ Row ekak normalize karanawa - paid thibboth eka, nathnam parana widiyata
function normalizeRow(r: any) {
  const amount = Number(r.amount || 0);
  const discount = Number(r.discount ?? 0);
  let paid: number;
  let credit: number;
  if (r.paid !== undefined && r.paid !== null) {
    paid = Number(r.paid || 0);
    credit = Number(r.credit ?? 0);
  } else {
    // Parana DB - paid column eka na, credit column eke thiyenne Paid
    paid = Number(r.credit || 0);
    credit = Math.max(0, amount - discount - paid);
  }
  return { amount, discount, paid, credit };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("id") || searchParams.get("selected_sales_id");
    const requestedBranchId = searchParams.get("branch_id");
    const branchId = requestedBranchId || extractBranchId(request);
    const filterDate = searchParams.get("date");
    const filterName = searchParams.get("name");
    const isSummary = searchParams.get("summary") === "true";
    const isDetailed = searchParams.get("detailed") === "true";

    if (filterDate && !isValidDate(filterDate)) {
      return NextResponse.json({ success: false, error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    const hasPaid = await checkPaidColumn();
    const paidSelect = hasPaid ? "s.paid," : "NULL as paid,";

    // --- SUMMARY MODE ---
    if (isSummary) {
      if (isDetailed || recordId) {
        const where: string[] = [];
        const params: any[] = [];
        if (branchId) { where.push("s.branch_id =?"); params.push(branchId); }
        if (filterDate) { where.push("DATE(s.date) =?"); params.push(filterDate); }
        if (filterName) { where.push("s.name LIKE ?"); params.push(`%${filterName}%`); }
        if (recordId) { where.push("s.id =?"); params.push(recordId); }

        let q = `
          SELECT s.id, s.bill_number, s.name, s.amount, s.credit, ${paidSelect} s.discount, s.unit_price, s.quantity, s.date, s.branch_id, s.created_at, b.branch_name
          FROM sales_incomes s LEFT JOIN branch b ON s.branch_id = b.id
        `;
        if (where.length) q += ` WHERE ${where.join(" AND ")}`;
        q += ` ORDER BY s.date DESC, s.id DESC`;

        const [rows]: any = await db.query(q, params);
        let grandTotal = 0; let grandCredit = 0; let grandDiscount = 0; let grandPaid = 0;
        const data = rows.map((r: any) => {
          const { amount, discount, paid, credit } = normalizeRow(r);
          grandTotal += amount;
          grandCredit += credit;
          grandDiscount += discount;
          grandPaid += paid;
          return {
            id: String(r.id),
            bill_number: r.bill_number || "",
            billNumber: r.bill_number || "",
            name: r.name || "",
            amount,
            credit,
            paid,
            discount,
            balance: credit,
            unit_price: Number(r.unit_price || 0),
            quantity: Number(r.quantity || 0),
            date: formatDate(r.date),
            branch_id: String(r.branch_id),
            branch_name: r.branch_name || `Branch #${r.branch_id}`,
            created_at: r.created_at,
            description: r.name || `Income #${r.id}`,
          };
        });
        return NextResponse.json({ success: true, grandTotal, grandCredit, grandDiscount, grandPaid, data }, { status: 200 });
      }

      const where: string[] = [];
      const params: any[] = [];
      if (branchId) { where.push("s.branch_id =?"); params.push(branchId); }
      if (filterDate) { where.push("DATE(s.date) =?"); params.push(filterDate); }
      if (filterName) { where.push("s.name LIKE ?"); params.push(`%${filterName}%`); }

      const paidSum = hasPaid ? "SUM(s.paid) as total_paid," : "SUM(s.credit) as total_paid,";
      let summaryQuery = `
        SELECT s.branch_id, COALESCE(b.branch_name, CONCAT('Branch #', s.branch_id)) as branch_name,
               DATE(s.date) as date,
               SUM(s.amount) as total_amount, SUM(s.credit) as total_credit, ${paidSum} SUM(s.discount) as total_discount,
               COUNT(s.id) as entries_count, MAX(s.date) as last_date
        FROM sales_incomes s LEFT JOIN branch b ON s.branch_id = b.id
      `;
      if (where.length) summaryQuery += ` WHERE ${where.join(" AND ")}`;
      summaryQuery += ` GROUP BY s.branch_id, b.branch_name, DATE(s.date) ORDER BY DATE(s.date) DESC, total_amount DESC`;

      const [rows]: any = await db.query(summaryQuery, params);
      let grandTotal = 0; let grandCredit = 0; let grandDiscount = 0; let grandPaid = 0;
      const data = rows.map((row: any) => {
        const totalAmount = Number(row.total_amount || 0);
        const totalDiscount = Number(row.total_discount || 0);
        const totalPaid = Number(row.total_paid || 0);
        const totalCredit = hasPaid ? Number(row.total_credit || 0) : Math.max(0, totalAmount - totalDiscount - totalPaid);
        grandTotal += totalAmount;
        grandCredit += totalCredit;
        grandDiscount += totalDiscount;
        grandPaid += totalPaid;
        return {
          branchId: String(row.branch_id),
          branchName: row.branch_name,
          branch_name: row.branch_name,
          amount: totalAmount,
          totalAmount,
          total_amount: totalAmount,
          totalCredit,
          total_credit: totalCredit,
          totalPaid,
          total_paid: totalPaid,
          totalDiscount,
          total_discount: totalDiscount,
          entriesCount: Number(row.entries_count || 0),
          entries_count: Number(row.entries_count || 0),
          last_date: formatDate(row.last_date),
          date: formatDate(row.date || row.last_date),
        };
      });
      return NextResponse.json({ success: true, grandTotal, grandCredit, grandDiscount, grandPaid, data }, { status: 200 });
    }

    // --- NORMAL BRANCH FETCH ---
    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID is missing." }, { status: 400 });
    }

    let query = `SELECT id, bill_number, name, amount, credit, ${hasPaid ? "paid," : "NULL as paid,"} discount, unit_price, quantity, date, branch_id, created_at FROM sales_incomes WHERE branch_id =?`;
    const qParams: any[] = [branchId];
    if (recordId) { query += " AND id =?"; qParams.push(recordId); }
    if (filterDate) { query += " AND DATE(date) =?"; qParams.push(filterDate); }
    if (filterName) { query += " AND name LIKE ?"; qParams.push(`%${filterName}%`); }
    query += " ORDER BY date DESC, id DESC";
    const [rows]: any = await db.query(query, qParams);
    const data = rows.map((row: any) => {
      const { amount, discount, paid, credit } = normalizeRow(row);
      return {
        id: String(row.id),
        bill_number: row.bill_number || "",
        billNumber: row.bill_number || "",
        name: row.name || "",
        amount,
        credit,
        paid,
        discount,
        balance: credit,
        unit_price: Number(row.unit_price || 0),
        quantity: Number(row.quantity || 0),
        date: formatDate(row.date),
        branch_id: String(row.branch_id),
        created_at: row.created_at,
      };
    });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: SalesIncomeRequestBody = await request.json();
    const bill_number = typeof body.bill_number === "string" ? body.bill_number.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const branchId = body.branch_id !== undefined && body.branch_id !== null ? String(body.branch_id) : extractBranchId(request);

    let unit_price = Number(body.unit_price ?? 0);
    const quantity = Number(body.quantity ?? 0);

    if ((!Number.isFinite(unit_price) || unit_price <= 0) && name) {
      const dbPrice = await getPriceFromDB(name, branchId);
      if (dbPrice != null) unit_price = dbPrice;
    }

    let amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      amount = unit_price * quantity;
    }

    const discount = Number(body.discount ?? 0);
    const paid = Number(body.paid ?? 0);
    let credit = Number(body.credit);
    if (!Number.isFinite(credit)) {
      credit = Math.max(0, amount - discount - paid);
    }

    if (!branchId || !name || !date) {
      return NextResponse.json({ success: false, error: "Missing required fields: branch_id, name, date." }, { status: 400 });
    }
    if (body.unit_price === undefined || body.quantity === undefined) {
       if (body.amount === undefined) {
         return NextResponse.json({ success: false, error: "Missing unit_price, quantity or amount" }, { status: 400 });
       }
    }
    if (!isValidDate(date)) return NextResponse.json({ success: false, error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    if (!Number.isFinite(unit_price) || unit_price < 0) return NextResponse.json({ success: false, error: "Unit price must be valid." }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ success: false, error: "Quantity must be > 0." }, { status: 400 });
    if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ success: false, error: "Amount must be valid." }, { status: 400 });
    if (!Number.isFinite(discount) || discount < 0) return NextResponse.json({ success: false, error: "Discount must be valid." }, { status: 400 });
    if (discount > amount) return NextResponse.json({ success: false, error: "Discount cannot be greater than the total amount." }, { status: 400 });
    if (!Number.isFinite(paid) || paid < 0) return NextResponse.json({ success: false, error: "Paid must be valid." }, { status: 400 });
    if (paid > amount - discount) return NextResponse.json({ success: false, error: "Paid cannot be greater than Amount - Discount." }, { status: 400 });
    if (!Number.isFinite(credit) || credit < 0) return NextResponse.json({ success: false, error: "Credit must be valid." }, { status: 400 });

    const hasPaid = await checkPaidColumn();
    let insertQuery: string;
    let insertParams: any[];
    if (hasPaid) {
      insertQuery = `INSERT INTO sales_incomes (branch_id, bill_number, name, unit_price, quantity, amount, credit, paid, discount, date) VALUES (?,?,?,?,?,?,?,?,?,?)`;
      insertParams = [branchId, bill_number || null, name, unit_price, quantity, amount, credit, paid, discount, date];
    } else {
      // ✅ Parana DB - paid column eka na, credit column ekata paid danawa
      insertQuery = `INSERT INTO sales_incomes (branch_id, bill_number, name, unit_price, quantity, amount, credit, discount, date) VALUES (?,?,?,?,?,?,?,?,?)`;
      insertParams = [branchId, bill_number || null, name, unit_price, quantity, amount, paid, credit, date];
    }
    const [result]: any = await db.query(insertQuery, insertParams);
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
    if (!id || !branchId) return NextResponse.json({ success: false, error: "Income ID and Branch ID are required." }, { status: 400 });
    const deleteQuery = `DELETE FROM sales_incomes WHERE id =? AND branch_id =?`;
    const [result]: any = await db.query(deleteQuery, [id, branchId]);
    if (result.affectedRows === 0) return NextResponse.json({ success: false, error: "Sales income record not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Sales income deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Table eke thiyena columns balala, hari column eka hoyaganna
async function getColumns(table: string): Promise<string[]> {
  try {
    const [rows]: any = await db.query(`SHOW COLUMNS FROM \`${table}\``);
    return (Array.isArray(rows) ? rows : []).map((r: any) => r.Field);
  } catch { return []; }
}

async function tableExists(table: string): Promise<boolean> {
  try {
    const [rows]: any = await db.query(`SHOW TABLES LIKE '${table}'`);
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

// Category ekata hari table eka hoyaganna - candidates tika balanawa
async function findTable(candidates: string[]): Promise<string | null> {
  for (const t of candidates) {
    if (await tableExists(t)) return t;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const debug = searchParams.get("debug") === "1";

    // ✅ Oya DB eke thiyena real table names tika
    const [allTables]: any = await db.query(`SHOW TABLES`);
    const tableList = (Array.isArray(allTables) ? allTables : []).map((r: any) => Object.values(r)[0]);

    const branchFilter = (alias: string) =>
      branchId && branchId !== "all" ? `AND ${alias}.branch_id = ${Number(branchId)}` : "";

    const configs = [
      { category: "Salary", candidates: ["salary_expenses", "salary_expense", "salaries", "salary", "salary_expence", "salary_expences_tbl"] },
      { category: "Sales", candidates: ["sales_expenses", "sales_expense", "sales", "sale_expenses", "sales_expence"] },
      { category: "Capital", candidates: ["capital_expenses", "capital_expense", "capital", "capital_expence"] },
      { category: "Other", candidates: ["other_expenses", "other_expense", "other", "other_expence"] },
      { category: "Diesel", candidates: ["diesel_expenses", "diesel_expense", "diesel", "diesel_expence", "fuel_expenses"] },
    ];

    const allRows: any[] = [];
    const used: any = {};

    for (const cfg of configs) {
      const table = await findTable(cfg.candidates);
      used[cfg.category] = table || "NOT FOUND - candidates: " + cfg.candidates.join(", ");

      if (!table) continue;

      const cols = await getColumns(table);
      // ✅ Column names wenas nam auto map karanawa
      const reasonCol = cols.includes("reason") ? "reason"
        : cols.includes("description") ? "description"
        : cols.includes("name") ? "name"
        : cols.includes("expense_type") ? "expense_type"
        : cols.includes("title") ? "title"
        : "'-'";
      const dateCol = cols.includes("expense_date") ? "expense_date"
        : cols.includes("date") ? "date"
        : cols.includes("created_at") ? "created_at"
        : "NULL";
      const payableCol = cols.includes("total_payable") ? "total_payable"
        : cols.includes("payable") ? "payable"
        : cols.includes("amount") ? "amount"
        : cols.includes("total") ? "total"
        : "0";
      const paidCol = cols.includes("total_paid") ? "total_paid"
        : cols.includes("paid") ? "paid"
        : "0";
      const balanceCol = cols.includes("balance") ? "balance" : "0";
      const branchCol = cols.includes("branch_id") ? "branch_id" : null;
      if (!branchCol) continue;

      const hasCube = cols.includes("crusher_load_quantity");

      const q = `
        SELECT id, ${branchCol} AS branch_id, '${cfg.category}' AS category,
          ${reasonCol === "'-'" ? "'-'" : reasonCol} AS reason,
          ${dateCol === "NULL" ? "NULL" : dateCol} AS expense_date,
          ${payableCol} AS total_payable,
          ${paidCol} AS total_paid,
          ${balanceCol} AS balance,
          ${hasCube ? "crusher_load_quantity" : "NULL"} AS crusher_load_quantity,
          ${hasCube ? "outside_load_quantity" : "NULL"} AS outside_load_quantity,
          ${hasCube ? "total_cube_quantity" : "NULL"} AS total_cube_quantity,
          ${hasCube ? "unit_cube_quantity" : "NULL"} AS unit_cube_quantity
        FROM \`${table}\` WHERE 1=1 ${branchFilter("t")}
      `.replaceAll("t.branch_id", `${table}.branch_id`);

      // branch filter eka hariyata danna - table name eken
      const finalQ = q.replace(`WHERE 1=1 ${branchFilter("t")}`, `WHERE 1=1 ${branchId && branchId !== "all" ? `AND \`${table}\`.branch_id = ${Number(branchId)}` : ""}`);

      try {
        const [rows]: any = await db.query(finalQ);
        if (Array.isArray(rows)) allRows.push(...rows);
      } catch (e: any) {
        used[cfg.category] = table + " ERROR: " + e.message;
      }
    }

    // Sort - date eken
    allRows.sort((a: any, b: any) => {
      const da = new Date(a.expense_date || 0).getTime();
      const db2 = new Date(b.expense_date || 0).getTime();
      return db2 - da;
    });

    // Branch names
    let branchMap: any = {};
    try {
      const [branches]: any = await db.query(`SELECT id, branchName, bName, branch_name, code, branch_code FROM branch`);
      (Array.isArray(branches) ? branches : []).forEach((b: any) => {
        branchMap[b.id] = { name: b.branchName || b.bName || b.branch_name || `Branch ${b.id}`, code: b.code || b.branch_code || "" };
      });
    } catch {}

    const result = allRows.map((r: any) => ({
      ...r,
      branchName: branchMap[r.branch_id]?.name || `Branch ${r.branch_id}`,
      branchCode: branchMap[r.branch_id]?.code || "",
      expense_date: r.expense_date ? new Date(r.expense_date).toISOString().split("T")[0] : "",
    }));

    if (debug) {
      return NextResponse.json({ usedTables: used, allTablesInDB: tableList, count: result.length, sample: result.slice(0, 2) });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("all expenses error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
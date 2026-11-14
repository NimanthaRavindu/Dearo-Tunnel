import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const branchFilter = branchId && branchId !== "all" ? `AND branch_id = ${Number(branchId)}` : "";
    const query = `
      (SELECT id, branch_id, 'Salary' AS category, reason, expense_date, total_payable, total_paid, balance, NULL AS crusher_load_quantity, NULL AS outside_load_quantity, NULL AS total_cube_quantity, NULL AS unit_cube_quantity FROM salary_expenses WHERE 1=1 ${branchFilter})
      UNION ALL
      (SELECT id, branch_id, 'Sales' AS category, reason, expense_date, total_payable, total_paid, balance, NULL, NULL, NULL, NULL FROM sales_expenses WHERE 1=1 ${branchFilter})
      UNION ALL
      (SELECT id, branch_id, 'Capital' AS category, reason, expense_date, total_payable, total_paid, balance, NULL, NULL, NULL, NULL FROM capital_expenses WHERE 1=1 ${branchFilter})
      UNION ALL
      (SELECT id, branch_id, 'Other' AS category, reason, expense_date, total_payable, total_paid, balance, crusher_load_quantity, outside_load_quantity, total_cube_quantity, unit_cube_quantity FROM other_expenses WHERE 1=1 ${branchFilter})
      UNION ALL
      (SELECT id, branch_id, 'Diesel' AS category, reason, expense_date, total_payable, total_paid, balance, NULL, NULL, NULL, NULL FROM diesel_expenses WHERE 1=1 ${branchFilter})
      ORDER BY expense_date DESC, id DESC
    `;
    const [rows]: any = await db.query(query);
    const [branches]: any = await db.query(`SELECT id, branchName, bName, code FROM branch`);
    const map: any = {};
    (Array.isArray(branches) ? branches : []).forEach((b: any) => { map[b.id] = { name: b.branchName || b.bName, code: b.code || "" }; });
    const result = (Array.isArray(rows) ? rows : []).map((r: any) => ({
      ...r,
      branchName: map[r.branch_id]?.name || `Branch ${r.branch_id}`,
      branchCode: map[r.branch_id]?.code || "",
      expense_date: r.expense_date ? new Date(r.expense_date).toISOString().split("T")[0] : "",
    }));
    return NextResponse.json(result);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
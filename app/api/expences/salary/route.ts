import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { branchId, employeeId, reason, date, totalPayable, totalPaid } = body;

    if (!branchId || branchId === "[id]" || branchId.includes("LOADING") || !date) {
      return NextResponse.json(
        { error: "EXECUTION FAULT: Invalid or uninitialized Branch ID context." },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: "EXECUTION FAULT: Targeted employee vector is missing." },
        { status: 400 }
      );
    }

    const payable = parseFloat(totalPayable || 0);
    const paid = parseFloat(totalPaid || 0);
    const balance = payable - paid;

    await db.query(
      `INSERT INTO salary_expenses
        (branch_id, employee_id, reason, expense_date, total_payable, total_paid, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(branchId),
        Number(employeeId),
        reason || "Monthly structural salary payout",
        date,
        payable,
        paid,
        balance
      ]
    );

    return NextResponse.json({ success: true, message: "Ledger ingested successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("CRITICAL DATABASE WRITE FAULT:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_MATRIX_FAULT",
        details: error?.message || "Check SQL constraints or table structure"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID context is required for ledger routing" },
        { status: 400 }
      );
    }

    const [salaryLogs]: any = await db.query(
      `SELECT
        s.id AS id,
        s.branch_id,
        s.employee_id,
        e.name AS employee_name,
        s.reason,
        s.total_payable,
        s.total_paid,
        s.balance,
        DATE_FORMAT(s.expense_date, '%Y-%m-%d') AS expense_date
       FROM salary_expenses s
       LEFT JOIN employee e ON s.employee_id = e.id
       WHERE s.branch_id = ?
       ORDER BY s.id DESC`,
      [branchId]
    );

    return NextResponse.json(Array.isArray(salaryLogs) ? salaryLogs : []);

  } catch (error) {
    console.error("Database connection or column mapping fault:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Critical matrix retrieval failure" },
      { status: 500 }
    );
  }
}

// ✅ ALUTH - PUT : Row eke thulama Edit kalama Save wenna
// NOTE: employee_name kiyala column ekak salary_expenses eke NA - eka employee table eke.
// Eka nisa salary_expenses update karanawa + employee.name wenas unoth ekath update karanawa.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      branchId,
      branch_id,
      employee_id,
      employeeId,
      employee_name,
      reason,
      total_payable,
      totalPaid,
      total_paid,
      balance,
      expense_date,
      date,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Salary record ID is required." }, { status: 400 });
    }

    // ✅ Thiyena record eka gannawa
    const [existingRows]: any = await db.query(
      `SELECT s.*, e.name AS employee_name
       FROM salary_expenses s
       LEFT JOIN employee e ON s.employee_id = e.id
       WHERE s.id = ?`,
      [id]
    );
    const old = Array.isArray(existingRows) ? existingRows[0] : null;
    if (!old) {
      return NextResponse.json({ success: false, error: "Salary record not found." }, { status: 404 });
    }

    // ✅ branch check - wena branch ekaka record ekak update wena eka nawaththanawa
    const finalBranchId = branchId || branch_id;
    if (finalBranchId && Number(old.branch_id) !== Number(finalBranchId)) {
      return NextResponse.json({ success: false, error: "Branch mismatch." }, { status: 403 });
    }

    const finalEmployeeId = employee_id ?? employeeId ?? old.employee_id;
    const finalReason = reason?.trim() ? reason.trim() : old.reason;
    const finalPayable = (total_payable ?? totalPaid) !== undefined ? Number(total_payable ?? totalPaid) : Number(old.total_payable || 0);
    const finalPaid = total_paid !== undefined ? Number(total_paid) : Number(old.total_paid || 0);
    const finalBalance = balance !== undefined ? Number(balance) : Math.max(0, finalPayable - finalPaid);
    const finalDate = expense_date || date || old.expense_date;
    const finalEmployeeName = employee_name?.trim() ? employee_name.trim() : old.employee_name;

    if (!finalEmployeeId) {
      return NextResponse.json({ success: false, error: "Employee ID missing." }, { status: 400 });
    }
    if (finalPaid > finalPayable) {
      return NextResponse.json({ success: false, error: "Total Paid, Total Payable ta wada wadi karanna ba." }, { status: 400 });
    }

    // 1️⃣ salary_expenses table eka update karanawa
    await db.query(
      `UPDATE salary_expenses SET
        employee_id = ?,
        reason = ?,
        total_payable = ?,
        total_paid = ?,
        balance = ?,
        expense_date = ?
       WHERE id = ?`,
      [Number(finalEmployeeId), finalReason, finalPayable, finalPaid, finalBalance, finalDate, id]
    );

    // 2️⃣ Employee name eka wenas unoth - employee table eke name eka update karanawa
    if (finalEmployeeName && finalEmployeeName !== old.employee_name) {
      await db.query(
        `UPDATE employee SET name = ? WHERE id = ?`,
        [finalEmployeeName, Number(finalEmployeeId)]
      );
    }

    // ✅ Update wuna record eka aye gannawa - GET eke wage JOIN ekath ekka
    const [updatedRows]: any = await db.query(
      `SELECT
        s.id AS id,
        s.branch_id,
        s.employee_id,
        e.name AS employee_name,
        s.reason,
        s.total_payable,
        s.total_paid,
        s.balance,
        DATE_FORMAT(s.expense_date, '%Y-%m-%d') AS expense_date
       FROM salary_expenses s
       LEFT JOIN employee e ON s.employee_id = e.id
       WHERE s.id = ?`,
      [id]
    );
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("PUT salary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update salary record.", details: error?.message },
      { status: 500 }
    );
  }
}

// ✅ ALUTH - DELETE : Salary record eka DB eken delete karanawa
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const branchId = searchParams.get("branchId") || searchParams.get("branch_id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Salary record ID is required." },
        { status: 400 }
      );
    }

    // ✅ Table eka salary_expenses - Oya GET eke thiyena eka ma thamai
    let q = `DELETE FROM salary_expenses WHERE id = ?`;
    const params: any[] = [id];

    // branchId awoth ekatath check karanawa - wena branch ekaka record ekak delete wena eka nawaththanawa
    if (branchId) {
      q += ` AND branch_id = ?`;
      params.push(Number(branchId));
    }

    const [result]: any = await db.query(q, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Salary record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Salary record deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error.", details: error?.message },
      { status: 500 }
    );
  }
}
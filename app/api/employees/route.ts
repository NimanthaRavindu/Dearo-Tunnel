import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empNumber, name, nicId, address, role, branchId } = body;

    if (!empNumber || !name || !nicId || !branchId) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 }
      );
    }

    const parseBranchId = parseInt(branchId, 10);

    const [result]: any = await db.query(
      `INSERT INTO employee (empNumber,name,nicId,address,role, branchId) VALUES (?,?,?,?,?,?)`,
      [empNumber, name, nicId, address, role, parseBranchId]
    )

    const newEmployee = {
      id: result.insertId,
      empNumber,
      name,
      nicId,
      address,
      role,
      branchId: parseBranchId
    };

    return NextResponse.json(newEmployee, { status: 201 });

  } catch (error: any) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { message: "Branch ID parameter is required" },
        { status: 400 }
      );
    }
   
    const query = "SELECT * FROM employee WHERE branchId = ?";
    const [rows]: any = await db.query(query, [Number(branchId)]);

    return NextResponse.json(Array.isArray(rows) ? rows : [], { status: 200 });

  } catch (error: any) {
    console.error("Database query error inside employees API:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// ✅ PUT
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();

    const id = body.id || searchParams.get("id");
    const { name, nicId, address, role } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Employee ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `UPDATE employee SET name = ?, nicId = ?, address = ?, role = ? WHERE id = ?`,
      [name, nicId || null, address || null, role || null, Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Employee updated successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ✅ DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Employee ID is required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `DELETE FROM employee WHERE id = ?`,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Employee deleted successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
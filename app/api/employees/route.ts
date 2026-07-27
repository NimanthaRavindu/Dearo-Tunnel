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

    const parseBranchId = parseInt(branchId,10);

    const [result]:any = await db.query(
      `INSERT INTO employee (empNumber,name,nicId,address,role,	branchId) VALUES (?,?,?,?,?,?)`,
      [empNumber,name,nicId,address,role,parseBranchId]
    )

    const newEmployee = {
      id:result.insertId,
      empNumber,
      name,
      nicId,
      address,
      role,
      branchId:parseBranchId
    };

    return NextResponse.json(newEmployee, { status: 201 });

  } catch (error : any) {
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
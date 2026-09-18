import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  
    const resolvedParams = await params; 
    const branchId = Number(resolvedParams.id);

    if (isNaN(branchId)) {
      return NextResponse.json(
        { message: "Invalid Branch Identity Parameter" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT id, branch_name, branch_code FROM branch WHERE id = ? LIMIT 1",
      [branchId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Branch infrastructure location not found" },
        { status: 404 }
      );
    }

    const branch = rows[0];

    const response = NextResponse.json(
      {
        id: branch.id,
        branchName: branch.branch_name,
        branchCode: branch.branch_code, 
      },
      { status: 200 }
    );

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error: any) {
    console.error("Critical error in branch summary API:", error);
    return NextResponse.json(
      { message: "Internal Cryptographic Server Error", error: error.message },
      { status: 500 }
    );
  }
}
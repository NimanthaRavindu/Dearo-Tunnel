import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET() {
  try {
    
    const [rows]:any = await db.execute(
      "SELECT id,branch_name,branch_code FROM branch ORDER BY branch_name ASC"
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching branches from database:", error);
    
    return NextResponse.json(
      { message: "Internal Server Error", data: [] }, 
      { status: 500 }
    );
  }
}

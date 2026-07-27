import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 }
      );
    }
  
    const [rows]: any = await db.execute(
      "SELECT id, username, password, role, email, branch_name, created_at FROM user WHERE username = ? LIMIT 1",
      [username]
    );


    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid credentials. Please verify your administrative access logs." },
        { status: 401 }
      );
    }

    const user = rows[0];

    const isPasswordValid = user.password === password;


    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials. Please verify your administrative access logs." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          branch_name: user.branch_name,
          created_at: user.created_at
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
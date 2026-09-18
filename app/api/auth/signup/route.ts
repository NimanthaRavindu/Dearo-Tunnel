import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "apextunnel",
};

export async function POST(request: Request) {
  let connection;

  try {
    const body = await request.json();

    const { username, email, password, role, branch_name } = body;

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { message: "Required fields are missing." },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const [existingUsers]: any = await connection.execute(
      "SELECT id FROM user WHERE username = ? OR email = ? LIMIT 1",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "Username or Email already exists." },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO user 
      (username, email, password, role, branch_name, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const [result]: any = await connection.execute(insertQuery, [
      username,
      email,
      password,
      role,
      branch_name || null,
    ]);

    return NextResponse.json(
      {
        message: "User registered successfully.",
        userId: result.insertId,
      },
      { status: 201 }
    );

  } catch (error: any) {

    console.error("Database Signup Error:", error);

    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );

  } finally {

    if (connection) {
      await connection.end();
    }

  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request:Request) {
    try {
        const {username,newPassword} = await request.json();

        if (!username || !newPassword) {
            return NextResponse.json({message:"Username and new password are required."},{status:400});
        }

        const [users]:any = await db.query(
            "SELECT * FROM user where username = ?",
            [username]
        );
        
        if (users.length === 0) {
            return NextResponse.json({message:`User "${username}" not found.`},{status:404});
        }

        await db.query(
            "UPDATE user SET password = ? WHERE username = ?",
            [newPassword,username]
        );

        return NextResponse.json({message:`Password for "${username}" updated successfully!`},{status:200});
    } catch (error) {
        console.error("Password update backend error:",error);
        return NextResponse.json({message:"Internal Server Error"},{status:500});        
    }
}

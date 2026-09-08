import { NextResponse } from 'next/server';

// GET: Fetch records
export async function GET(request: Request) {
  try {

    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Insert record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, date, amount } = body;


    return NextResponse.json({ success: true, message: 'Saved successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
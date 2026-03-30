import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams;
    const id = query.get("id");
    const name = query.get("name");
    console.log(id, name);
    return NextResponse.json({ message: "Get 请求" });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    console.log(body);
    return NextResponse.json({ message: "Post 请求" }, { status: 201 });
}
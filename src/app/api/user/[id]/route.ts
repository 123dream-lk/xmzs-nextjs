import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, {params}:{params:Promise<{id:string}>}) {
    const { id } = await params;
    console.log(id);
    return NextResponse.json({ message: "Get 请求 ==> 动态参数" });
}
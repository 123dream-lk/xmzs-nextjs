import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 统一响应格式
function success<T>(data: T, message = "操作成功") {
    return NextResponse.json({ code: 200, data, message })
}

function fail(message = "操作失败", code = 500) {
    return NextResponse.json({ code, data: null, message }, { status: code })
}

export async function GET(_request: NextRequest) {
    try {
        const users = await prisma.user.findMany()
        return success(users, "查询成功")
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "查询失败"
        return fail(message)
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json()
        if (!name || !email || !password) {
            return fail("name、email、password 均为必填项", 400)
        }
        const user = await prisma.user.create({
            data: { name, email, password }
        })
        return success(user, "创建成功")
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "创建失败"
        return fail(message)
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { id, name, email, password } = await request.json()
        if (!id) {
            return fail("id 为必填项", 400)
        }
        const user = await prisma.user.update({
            where: { id },
            data: { name, email, password }
        })
        return success(user, "更新成功")
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "更新失败"
        return fail(message)
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json()
        if (!id) {
            return fail("id 为必填项", 400)
        }
        const user = await prisma.user.delete({
            where: { id }
        })
        return success(user, "删除成功")
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "删除失败"
        return fail(message)
    }
}
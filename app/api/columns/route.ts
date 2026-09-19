import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserId, getOrCreateBoard } from "@/lib/server-helpers";
import { columnSchema } from "@/lib/schemas/jobCard.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = columnSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const userId = await getUserId();
    const board = await getOrCreateBoard(userId);
    if (!board) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
    const count = await prisma.column.count({ where: { boardId: body.boardId ?? board.id } });
    const col = await prisma.column.create({
      data: { boardId: body.boardId ?? board.id, name: parsed.data.name, order: count },
    });
    return NextResponse.json(col, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create column failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // reorder: { order: string[] }
  try {
    const { order } = await req.json();
    if (!Array.isArray(order)) return NextResponse.json({ error: "order[] required" }, { status: 400 });
    await prisma.$transaction(order.map((id: string, i: number) => prisma.column.update({ where: { id }, data: { order: i } })));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}

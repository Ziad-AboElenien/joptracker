import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserId, getOrCreateBoard, serializeCard } from "@/lib/server-helpers";
import { jobCardSchema } from "@/lib/schemas/jobCard.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = jobCardSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const userId = await getUserId();
    const board = await getOrCreateBoard(userId);
    if (!board) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const column = await prisma.column.findFirst({ where: { id: parsed.data.columnId, boardId: board.id } });
    if (!column) return NextResponse.json({ error: "Invalid column" }, { status: 400 });

    const count = await prisma.jobCard.count({ where: { columnId: column.id } });
    const created = await prisma.jobCard.create({
      data: {
        columnId: column.id,
        order: count,
        company: parsed.data.company,
        role: parsed.data.role,
        jobUrl: parsed.data.jobUrl || null,
        salary: parsed.data.salary ?? null,
        notes: parsed.data.notes || null,
        tags: JSON.stringify(parsed.data.tags ?? []),
        dateApplied: parsed.data.dateApplied ? new Date(parsed.data.dateApplied) : null,
      },
    });
    await prisma.activityLog.create({ data: { jobCardId: created.id, action: `Created in ${column.name}` } });
    return NextResponse.json(serializeCard(created), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

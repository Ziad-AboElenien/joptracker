import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { serializeCard } from "@/lib/server-helpers";
import { jobCardSchema } from "@/lib/schemas/jobCard.schema";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = jobCardSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (parsed.data.company !== undefined) data.company = parsed.data.company;
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.jobUrl !== undefined) data.jobUrl = parsed.data.jobUrl || null;
    if (parsed.data.salary !== undefined) data.salary = parsed.data.salary;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
    if (parsed.data.tags !== undefined) data.tags = JSON.stringify(parsed.data.tags);
    if (parsed.data.dateApplied !== undefined) data.dateApplied = parsed.data.dateApplied ? new Date(parsed.data.dateApplied) : null;
    if (parsed.data.columnId !== undefined) data.columnId = parsed.data.columnId;
    const updated = await prisma.jobCard.update({ where: { id }, data });
    return NextResponse.json(serializeCard(updated));
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.jobCard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const col = await prisma.column.update({ where: { id }, data: { name: name.trim() } });
    return NextResponse.json(col);
  } catch {
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.column.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

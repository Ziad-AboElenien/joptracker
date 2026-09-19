import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { serializeCard } from "@/lib/server-helpers";

/**
 * PATCH /api/cards/:id/move { toColumnId, toIndex }
 * Reorders within a column or moves across columns, then rewrites `order`
 * for affected columns. Also writes an ActivityLog entry on column change.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { toColumnId, toIndex } = await req.json();
    if (!toColumnId) return NextResponse.json({ error: "toColumnId required" }, { status: 400 });
    const card = await prisma.jobCard.findUnique({ where: { id }, include: { column: true } });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const fromColumnId = card.columnId;
    const targetCol = await prisma.column.findUnique({ where: { id: toColumnId } });
    if (!targetCol) return NextResponse.json({ error: "Target column not found" }, { status: 400 });

    const moveInTx = await prisma.$transaction(async (tx) => {
      const siblings = await tx.jobCard.findMany({ where: { columnId: toColumnId, NOT: { id } }, orderBy: { order: "asc" } });
      const clamped = Math.max(0, Math.min(toIndex ?? siblings.length, siblings.length));
      // update moved card first
      await tx.jobCard.update({ where: { id }, data: { columnId: toColumnId, order: clamped } });
      for (let i = 0; i < siblings.length; i++) {
        await tx.jobCard.update({ where: { id: siblings[i].id }, data: { order: i >= clamped ? i + 1 : i } });
      }
      if (fromColumnId !== toColumnId) {
        const leftBehind = await tx.jobCard.findMany({ where: { columnId: fromColumnId }, orderBy: { order: "asc" } });
        for (let i = 0; i < leftBehind.length; i++) {
          await tx.jobCard.update({ where: { id: leftBehind[i].id }, data: { order: i } });
        }
        await tx.activityLog.create({ data: { jobCardId: id, action: `Moved to ${targetCol.name}` } });
      }
      return tx.jobCard.findUnique({ where: { id } });
    });

    return NextResponse.json(moveInTx ? serializeCard(moveInTx) : null);
  } catch {
    return NextResponse.json({ error: "Move failed" }, { status: 500 });
  }
}

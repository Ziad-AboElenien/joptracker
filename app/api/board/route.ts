import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserId, getOrCreateBoard, serializeCard } from "@/lib/server-helpers";

export async function GET() {
  const userId = await getUserId();
  const board = await getOrCreateBoard(userId);
  if (!board) {
    // DB unavailable: return demo payload; client falls back to mock store
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
  const cards = await prisma.jobCard.findMany({
    where: { column: { boardId: board.id } },
    orderBy: [{ columnId: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({
    boardId: board.id,
    boardName: board.name,
    columns: board.columns,
    cards: cards.map(serializeCard),
  });
}

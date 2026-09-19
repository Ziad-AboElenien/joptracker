import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_STAGES = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];

export async function getUserId(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: (session.user as { name?: string })?.name ?? email.split("@")[0] },
      });
      return user.id;
    }
  } catch {
    // DB unavailable — fall back to demo
  }
  return "demo-user";
}

export async function getOrCreateBoard(userId: string) {
  try {
    let board = await prisma.board.findFirst({ where: { userId }, include: { columns: { orderBy: { order: "asc" } } } });
    if (!board) {
      const email = `${userId}@demo.local`;
      await prisma.user.upsert({ where: { email }, update: {}, create: { id: userId === "demo-user" ? "demo-user" : undefined, email, name: "Demo" } });
      board = await prisma.board.create({
        data: { userId, name: "Job Search", columns: { create: DEFAULT_STAGES.map((name, order) => ({ name, order })) } },
        include: { columns: true },
      });
    }
    if (board.columns.length === 0) {
      for (let i = 0; i < DEFAULT_STAGES.length; i++) {
        await prisma.column.create({ data: { boardId: board.id, name: DEFAULT_STAGES[i], order: i } });
      }
      board = await prisma.board.findFirst({ where: { userId }, include: { columns: { orderBy: { order: "asc" } } } });
    }
    return board!;
  } catch {
    return null; // DB unavailable → caller serves mock
  }
}

export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string") {
    try {
      const p = JSON.parse(tags);
      if (Array.isArray(p)) return p.map(String);
    } catch {
      return tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

export function serializeCard(c: { tags: string; [k: string]: unknown }) {
  return { ...c, tags: parseTags(c.tags) };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobCardId = searchParams.get("jobCardId");
  if (!jobCardId) return NextResponse.json({ error: "jobCardId required" }, { status: 400 });
  try {
    const logs = await prisma.activityLog.findMany({ where: { jobCardId }, orderBy: { timestamp: "desc" }, take: 50 });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}

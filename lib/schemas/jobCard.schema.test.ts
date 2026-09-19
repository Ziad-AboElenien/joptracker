import { describe, it, expect } from "vitest";
import { jobCardSchema } from "@/lib/schemas/jobCard.schema";

describe("jobCard schema", () => {
  it("requires company and role", () => {
    const r = jobCardSchema.safeParse({ company: "", role: "", columnId: "c1" });
    expect(r.success).toBe(false);
  });
  it("rejects invalid URL", () => {
    const r = jobCardSchema.safeParse({ company: "A", role: "R", columnId: "c1", jobUrl: "not-a-url", tags: [] });
    expect(r.success).toBe(false);
  });
  it("accepts valid payload", () => {
    const r = jobCardSchema.safeParse({ company: "Acme", role: "Eng", columnId: "c1", jobUrl: "https://example.com", salary: 100000, tags: ["remote"] });
    expect(r.success).toBe(true);
  });
});

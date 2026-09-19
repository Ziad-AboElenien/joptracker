import { z } from "zod";

export const jobCardSchema = z.object({
  company: z.string().min(1, "Company is required").max(100),
  role: z.string().min(1, "Role is required").max(100),
  jobUrl: z
    .string()
    .max(2048)
    .optional()
    .nullable()
    .refine(
      (v) => !v || v === "" || /^https?:\/\/.+/.test(v),
      "Must be a valid http(s) URL"
    ),
  salary: z.preprocess(
    (v) => {
      if (v === "" || v === undefined || v === null) return null;
      if (typeof v === "string") {
        const n = Number(v.replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) ? n : null;
      }
      return v;
    },
    z.number().nonnegative("Salary must be >= 0").nullable().optional()
  ),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  dateApplied: z.string().optional().nullable(),
  columnId: z.string().min(1, "Column is required"),
});

export type JobCardFormValues = z.infer<typeof jobCardSchema>;

export const columnSchema = z.object({
  name: z.string().min(1, "Column name required").max(40),
});

export type ColumnFormValues = z.infer<typeof columnSchema>;

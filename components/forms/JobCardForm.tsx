"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobCardSchema, type JobCardFormValues } from "@/lib/schemas/jobCard.schema";
import { Input, Textarea, Button } from "@/components/ui/primitives";
import { useBoardStore } from "@/lib/store/boardStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function saveCard(payload: JobCardFormValues & { id?: string }) {
  const res = await fetch(payload.id ? `/api/cards/${payload.id}` : "/api/cards", {
    method: payload.id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

export function JobCardForm() {
  const isOpen = useBoardStore((s) => s.isFormOpen);
  const editingCardId = useBoardStore((s) => s.editingCardId);
  const formDefaultColumnId = useBoardStore((s) => s.formDefaultColumnId);
  const closeForm = useBoardStore((s) => s.closeForm);
  const upsertCardLocal = useBoardStore((s) => s.upsertCardLocal);
  const cards = useBoardStore((s) => s.cards);
  const columns = useBoardStore((s) => s.columns);
  const columnOrder = useBoardStore((s) => s.columnOrder);
  const qc = useQueryClient();

  const editing = editingCardId ? cards[editingCardId] : null;

  const form = useForm<JobCardFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(jobCardSchema) as any,
    defaultValues: {
      company: editing?.company ?? "",
      role: editing?.role ?? "",
      jobUrl: editing?.jobUrl ?? "",
      salary: editing?.salary ?? null,
      notes: editing?.notes ?? "",
      tags: editing?.tags ?? [],
      dateApplied: editing?.dateApplied?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      columnId: editing?.columnId ?? formDefaultColumnId ?? columnOrder[0] ?? "",
    },
    values: editing
      ? {
          company: editing.company,
          role: editing.role,
          jobUrl: editing.jobUrl ?? "",
          salary: editing.salary ?? null,
          notes: editing.notes ?? "",
          tags: editing.tags,
          dateApplied: editing.dateApplied?.slice(0, 10) ?? "",
          columnId: editing.columnId,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: saveCard,
    onMutate: async (payload) => {
      // Optimistic: insert temp card immediately
      const id = payload.id ?? `temp-${Date.now()}`;
      const now = new Date().toISOString();
      upsertCardLocal({
        id,
        columnId: payload.columnId,
        order: 9999,
        company: payload.company,
        role: payload.role,
        jobUrl: payload.jobUrl ?? null,
        salary: payload.salary ?? null,
        notes: payload.notes ?? null,
        tags: payload.tags ?? [],
        dateApplied: payload.dateApplied ? new Date(payload.dateApplied).toISOString() : null,
        createdAt: now,
        updatedAt: now,
      });
      return { tempId: id };
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      alert("Save failed — rolled back.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      closeForm();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Job card form">
      <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
      <form
        className="relative w-full max-w-lg space-y-3 rounded-xl bg-white p-5 dark:bg-zinc-900"
        onSubmit={form.handleSubmit((v: JobCardFormValues) => mutation.mutate({ ...v, tags: typeof v.tags === "string" ? (v.tags as unknown as string).split(",").map((t: string) => t.trim()).filter(Boolean) : v.tags, id: editing?.id }))}
      >
        <h2 className="text-lg font-semibold">{editing ? "Edit job" : "Add job"}</h2>
        <div>
          <label className="text-sm">Company *</label>
          <Input {...form.register("company")} />
          {form.formState.errors.company && <p className="text-xs text-red-600">{form.formState.errors.company.message}</p>}
        </div>
        <div>
          <label className="text-sm">Role *</label>
          <Input {...form.register("role")} />
          {form.formState.errors.role && <p className="text-xs text-red-600">{form.formState.errors.role.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Job URL</label>
            <Input {...form.register("jobUrl")} placeholder="https://…" />
            {form.formState.errors.jobUrl && <p className="text-xs text-red-600">{String(form.formState.errors.jobUrl.message)}</p>}
          </div>
          <div>
            <label className="text-sm">Salary (number)</label>
            <Input type="number" {...form.register("salary" as never)} />
            {form.formState.errors.salary && <p className="text-xs text-red-600">Invalid salary</p>}
          </div>
        </div>
        <div>
          <label className="text-sm">Tags (comma separated)</label>
          <Input placeholder="react, remote" defaultValue={(editing?.tags ?? []).join(", ")} onChange={(e) => form.setValue("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Stage</label>
            <select {...form.register("columnId")} className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
              {columnOrder.map((id) => (
                <option key={id} value={id}>{columns[id]?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Date applied</label>
            <Input type="date" {...form.register("dateApplied")} />
          </div>
        </div>
        <div>
          <label className="text-sm">Notes</label>
          <Textarea rows={3} {...form.register("notes")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}

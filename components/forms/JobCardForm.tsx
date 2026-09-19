"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase, faCheck, faSpinner, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobCardSchema, type JobCardFormValues } from "@/lib/schemas/jobCard.schema";
import { Input, Textarea, Button, Field } from "@/components/ui/primitives";
import { Dropdown } from "@/components/ui/dropdown";
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

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() is the sanctioned reactive read API
  const stageId = form.watch("columnId");

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

  const err = form.formState.errors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Job card form">
      <div className="anim-overlay absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={closeForm} />
      <form
        className="anim-panel relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85"
        onSubmit={form.handleSubmit((v: JobCardFormValues) => mutation.mutate({ ...v, tags: typeof v.tags === "string" ? (v.tags as unknown as string).split(",").map((t: string) => t.trim()).filter(Boolean) : v.tags, id: editing?.id }))}
      >
        <h2 className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4" />
          </span>
          {editing ? "Edit job" : "Add job"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company" required error={err.company?.message}>
            <Input {...form.register("company")} placeholder="Acme Corp" autoFocus />
          </Field>
          <Field label="Role" required error={err.role?.message}>
            <Input {...form.register("role")} placeholder="Frontend Engineer" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job URL" error={err.jobUrl ? String(err.jobUrl.message) : null}>
            <Input {...form.register("jobUrl")} placeholder="https://…" inputMode="url" />
          </Field>
          <Field label="Salary" error={err.salary ? "Invalid salary" : null}>
            <Input type="number" min={0} {...form.register("salary" as never)} placeholder="120000" />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <Input placeholder="react, remote" defaultValue={(editing?.tags ?? []).join(", ")} onChange={(e) => form.setValue("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Stage">
            <Dropdown
              ariaLabel="Stage"
              value={stageId}
              onChange={(v) => form.setValue("columnId", v, { shouldValidate: true })}
              options={columnOrder.map((id) => ({ value: id, label: columns[id]?.name ?? id }))}
            />
          </Field>
          <Field label="Date applied">
            <Input type="date" {...form.register("dateApplied")} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={3} {...form.register("notes")} placeholder="Interview notes, contacts…" />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={closeForm}>
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending
              ? <><FontAwesomeIcon icon={faSpinner} spin className="h-3.5 w-3.5" /> Saving…</>
              : <><FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" /> Save</>}
          </Button>
        </div>
      </form>
    </div>
  );
}

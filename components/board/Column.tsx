"use client";

import { useMemo, useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useBoardStore, applyCardFilters } from "@/lib/store/boardStore";
import type { JobCardT } from "@/lib/types";
import { JobCard } from "@/components/board/Card";
import { Button, Input } from "@/components/ui/primitives";

export function ColumnView({ columnId }: { columnId: string }) {
  const column = useBoardStore((s) => s.columns[columnId]);
  // Select only stable refs here: deriving a fresh array inside a selector
  // breaks getSnapshot caching (infinite-loop error), so filter via useMemo.
  const cardIds = useBoardStore((s) => s.cardOrderByColumn[columnId]);
  const cardsById = useBoardStore((s) => s.cards);
  const filters = useBoardStore((s) => s.filters);
  const cards: JobCardT[] = useMemo(() => {
    const list = (cardIds ?? []).map((id) => cardsById[id]).filter((c): c is JobCardT => Boolean(c));
    return applyCardFilters(list, filters);
  }, [cardIds, cardsById, filters]);
  const openCreate = useBoardStore((s) => s.openCreate);
  const renameColumnLocal = useBoardStore((s) => s.renameColumnLocal);
  const deleteColumnLocal = useBoardStore((s) => s.deleteColumnLocal);
  const reorderColumn = useBoardStore((s) => s.reorderColumn);
  const columnIndex = useBoardStore((s) => s.columnOrder.indexOf(columnId));
  const columnCount = useBoardStore((s) => s.columnOrder.length);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column?.name ?? "");

  // Reorder is optimistic (undoable in store); persist the new order, refetch on failure.
  const moveColumn = async (dir: -1 | 1) => {
    reorderColumn(columnId, columnIndex + dir);
    const order = useBoardStore.getState().columnOrder;
    const res = await fetch("/api/columns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) });
    if (!res.ok) {
      useBoardStore.getState().undo();
      alert("Reorder failed — restored.");
    }
  };

  const { setNodeRef } = useDroppable({ id: `col-${columnId}` });
  if (!column) return null;

  return (
    <div ref={setNodeRef} className="flex w-72 shrink-0 flex-col rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800/60" data-testid={`column-${column.id}`}>
      <div className="mb-2 flex items-center justify-between">
        {editing ? (
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                renameColumnLocal(columnId, name.trim());
                fetch(`/api/columns/${columnId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
              }
              setEditing(false);
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Column name" />
            <Button size="sm" type="submit">Save</Button>
          </form>
        ) : (
          <>
            <h3 className="font-semibold">{column.name} <span className="text-xs text-zinc-500">({cards.length})</span></h3>
            <div className="flex gap-1">
              <button aria-label={`Move ${column.name} left`} disabled={columnIndex <= 0} className="rounded px-1 text-xs hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700" onClick={() => moveColumn(-1)}>◀</button>
              <button aria-label={`Move ${column.name} right`} disabled={columnIndex >= columnCount - 1} className="rounded px-1 text-xs hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700" onClick={() => moveColumn(1)}>▶</button>
              <button aria-label={`Rename ${column.name}`} className="rounded px-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => { setName(column.name); setEditing(true); }}>✎</button>
              <button aria-label={`Delete ${column.name}`} className="rounded px-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => { if (confirm(`Delete column "${column.name}" and its cards?`)) { deleteColumnLocal(columnId); fetch(`/api/columns/${columnId}`, { method: "DELETE" }); } }}>🗑</button>
            </div>
          </>
        )}
      </div>
      <SortableContext items={cards.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {cards.map((c) => (
            <JobCard key={c.id} card={c} />
          ))}
        </div>
      </SortableContext>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => openCreate(columnId)}>+ Add job</Button>
    </div>
  );
}

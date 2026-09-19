"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPen, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
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
  const requestConfirm = useBoardStore((s) => s.requestConfirm);
  const showNotice = useBoardStore((s) => s.showNotice);
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
      await showNotice({ title: "Reorder failed", message: "The column order was restored." });
    }
  };

  const handleDeleteColumn = async () => {
    const ok = await requestConfirm({
      title: "Delete column?",
      message: `Delete "${column.name}" and all its cards? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    deleteColumnLocal(columnId);
    fetch(`/api/columns/${columnId}`, { method: "DELETE" });
  };

  const { setNodeRef } = useDroppable({ id: `col-${columnId}` });
  if (!column) return null;

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-indigo-500/10 hover:text-indigo-600 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-zinc-400 dark:text-zinc-500 dark:hover:text-indigo-300";

  return (
    <div
      ref={setNodeRef}
      className="flex w-full flex-col rounded-2xl border border-white/60 bg-white/55 p-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-black/30"
      data-testid={`column-${column.id}`}
    >
      <div className="mb-3 flex items-center justify-between gap-1">
        {editing ? (
          <form
            className="flex w-full gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                renameColumnLocal(columnId, name.trim());
                fetch(`/api/columns/${columnId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
              }
              setEditing(false);
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Column name" autoFocus className="h-8" />
            <Button size="sm" variant="primary" type="submit">Save</Button>
          </form>
        ) : (
          <>
            <h3 className="flex min-w-0 items-center gap-2 font-semibold">
              <span className="truncate">{column.name}</span>
              <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{cards.length}</span>
            </h3>
            <div className="flex shrink-0 items-center">
              <button aria-label={`Move ${column.name} left`} disabled={columnIndex <= 0} className={iconBtn} onClick={() => moveColumn(-1)}>
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
              </button>
              <button aria-label={`Move ${column.name} right`} disabled={columnIndex >= columnCount - 1} className={iconBtn} onClick={() => moveColumn(1)}>
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </button>
              <button aria-label={`Rename ${column.name}`} className={iconBtn} onClick={() => { setName(column.name); setEditing(true); }}>
                <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
              </button>
              <button aria-label={`Delete ${column.name}`} className={iconBtn + " hover:bg-red-500/10 hover:text-red-500"} onClick={handleDeleteColumn}>
                <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>
      <SortableContext items={cards.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-10 flex-col gap-2">
          {cards.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-400 dark:border-white/10 dark:text-zinc-500">
              Drop cards here
            </p>
          )}
          {cards.map((c) => (
            <JobCard key={c.id} card={c} />
          ))}
        </div>
      </SortableContext>
      <Button variant="ghost" size="sm" className="mt-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300" onClick={() => openCreate(columnId)}>
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" /> Add job
      </Button>
    </div>
  );
}

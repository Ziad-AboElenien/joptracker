"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBoardStore, buildMockBoard } from "@/lib/store/boardStore";
import { ColumnView } from "@/components/board/Column";
import { JobCardForm } from "@/components/forms/JobCardForm";
import { SearchFilterBar } from "@/components/board/SearchFilterBar";
import { CardDetailModal } from "@/components/board/CardDetailModal";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { Button, Input } from "@/components/ui/primitives";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEffect } from "react";
import type { ColumnT, JobCardT } from "@/lib/types";

async function fetchBoard() {
  const res = await fetch("/api/board");
  if (!res.ok) throw new Error("board fetch failed");
  return res.json() as Promise<{ boardId: string; boardName: string; columns: ColumnT[]; cards: JobCardT[] }>;
}

export function Board() {
  const columnOrder = useBoardStore((s) => s.columnOrder);
  const hydrate = useBoardStore((s) => s.hydrate);
  const boardId = useBoardStore((s) => s.boardId);
  const setShowAnalytics = useBoardStore((s) => s.setShowAnalytics);
  const openCreate = useBoardStore((s) => s.openCreate);
  const addColumnLocal = useBoardStore((s) => s.addColumnLocal);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const [newCol, setNewCol] = useState("");
  const qc = useQueryClient();
  useUndoRedo();

  const { data, isError } = useQuery({ queryKey: ["board"], queryFn: fetchBoard, retry: 1 });

  useEffect(() => {
    if (data) hydrate(data.boardId, data.boardName, data.columns, data.cards);
    else if (isError) {
      // Fallback to local mock data so DnD demo works without DB
      const mock = buildMockBoard();
      hydrate("demo-board", "Job Search (demo)", mock.columns, mock.cards);
    }
  }, [data, isError, hydrate]);

  const moveMutation = useMutation({
    mutationFn: async ({ cardId, toColumnId, toIndex }: { cardId: string; toColumnId: string; toIndex: number }) => {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toColumnId, toIndex }),
      });
      if (!res.ok) throw new Error("move failed");
      return res.json();
    },
    onError: (_e, _v, ctx) => {
      (ctx as { rollback?: () => void } | undefined)?.rollback?.();
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });

  // Optimistic move persistence: Zustand is updated first inside the hook,
  // here we only sync to the server and roll back on failure.
  const persistMove = useCallback(
    ({ cardId, toColumnId, toIndex, rollback }: { cardId: string; toColumnId: string; toIndex: number; rollback: () => void }) => {
      moveMutation.mutate(
        { cardId, toColumnId, toIndex },
        {
          onError: () => {
            rollback();
            qc.invalidateQueries({ queryKey: ["board"] });
          },
        }
      );
    },
    [moveMutation, qc]
  );

  const { sensors, collisionDetection, onDragStart, onDragEnd, activeCard } = useDragAndDrop(persistMove);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchFilterBar />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => undo()}>↩ Undo</Button>
          <Button variant="outline" size="sm" onClick={() => redo()}>↪ Redo</Button>
          <Button variant="outline" size="sm" onClick={() => setShowAnalytics(true)}>📊 Analytics</Button>
          <Button size="sm" onClick={() => openCreate()}>+ New job</Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columnOrder.map((id) => (
            <ColumnView key={id} columnId={id} />
          ))}
          <form
            className="flex h-fit w-60 shrink-0 gap-1 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800/60"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCol.trim()) return;
              const res = await fetch("/api/columns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCol.trim(), boardId: boardId ?? "demo-board" }) });
              if (res.ok) {
                const col = await res.json();
                addColumnLocal(col);
              } else {
                // local fallback
                addColumnLocal({ id: `col-${Date.now()}`, boardId: boardId ?? "demo-board", name: newCol.trim(), order: columnOrder.length });
              }
              setNewCol("");
              qc.invalidateQueries({ queryKey: ["board"] });
            }}
          >
            <Input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="New stage…" aria-label="New column name" />
            <Button size="sm" type="submit">Add</Button>
          </form>
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="w-72 rounded-lg border bg-white p-3 shadow-lg dark:bg-zinc-900">
              <p className="text-sm font-semibold">{activeCard.company}</p>
              <p className="text-sm">{activeCard.role}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <JobCardForm />
      <CardDetailModal />
      <AnalyticsView />
      <p className="text-xs text-zinc-500">Tip: drag cards with mouse or keyboard (Tab → Space → arrows). Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or +Y redo.</p>
    </div>
  );
}

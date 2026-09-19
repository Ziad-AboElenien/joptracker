"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartColumn, faPlus, faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
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
  const openCreate = useBoardStore((s) => s.openCreate);
  const addColumnLocal = useBoardStore((s) => s.addColumnLocal);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const canUndo = useBoardStore((s) => s.past.length > 0);
  const canRedo = useBoardStore((s) => s.future.length > 0);
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
    onError: () => {
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

  const scrollToAnalytics = () => {
    document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchFilterBar />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => undo()} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <FontAwesomeIcon icon={faRotateLeft} className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={() => redo()} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <FontAwesomeIcon icon={faRotateRight} className="h-3.5 w-3.5" /> Redo
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToAnalytics}>
            <FontAwesomeIcon icon={faChartColumn} className="h-3.5 w-3.5" /> Analytics
          </Button>
          <Button size="sm" variant="primary" onClick={() => openCreate()}>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /> New job
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Vertical wrap grid: columns fill the viewport width and flow to the
            next row instead of a horizontal slider. */}
        <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {columnOrder.map((id) => (
            <ColumnView key={id} columnId={id} />
          ))}
          <form
            className="flex gap-1.5 rounded-2xl border border-dashed border-indigo-300/60 bg-white/40 p-3 backdrop-blur-xl dark:border-indigo-400/20 dark:bg-white/5"
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
            <Input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="New stage…" aria-label="New column name" className="h-9" />
            <Button size="sm" variant="primary" type="submit" className="h-9 shrink-0">
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /> Add
            </Button>
          </form>
        </div>
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
          {activeCard ? (
            <div className="w-72 rotate-2 rounded-2xl border border-white/60 bg-white/90 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
              <p className="truncate text-sm font-semibold">{activeCard.company}</p>
              <p className="truncate text-sm text-zinc-500">{activeCard.role}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnalyticsView />

      <JobCardForm />
      <CardDetailModal />
      <p className="pb-4 text-xs text-zinc-500 dark:text-zinc-400">Tip: drag cards with mouse or keyboard (Tab, Space, then arrow keys). Undo: Ctrl/Cmd+Z — Redo: Ctrl/Cmd+Shift+Z or Ctrl+Y.</p>
    </div>
  );
}

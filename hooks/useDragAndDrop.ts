"use client";

import { useCallback, useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoardStore } from "@/lib/store/boardStore";
import type { JobCardT } from "@/lib/types";

export interface PersistMove {
  (args: { cardId: string; toColumnId: string; toIndex: number; rollback: () => void }): void;
}

function stripPrefix(raw: string, prefix: string): string {
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

/**
 * Owns dnd-kit sensors + active-card state + the optimistic move handler.
 * The caller renders <DndContext>/<DragOverlay> itself so layout stays in Board.
 * See lib/store/boardStore.ts for why the update is optimistic with rollback.
 */
export function useDragAndDrop(persist: PersistMove) {
  const moveCard = useBoardStore((s) => s.moveCard);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const collisionDetection: CollisionDetection = closestCorners;

  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(stripPrefix(String(e.active.id), "card-"));
  }, []);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over) return;
      const rawActive = String(active.id);
      const rawOver = String(over.id);
      const cardId = stripPrefix(rawActive, "card-");
      const s = useBoardStore.getState();
      if (!s.cards[cardId]) return;

      // `over` is either a card ("card-<id>") or a column ("col-<id>" / raw id).
      let toColumnId: string | null = null;
      let toIndex = 0;
      if (rawOver.startsWith("card-")) {
        const overCardId = stripPrefix(rawOver, "card-");
        const overCard = s.cards[overCardId];
        if (!overCard) return;
        toColumnId = overCard.columnId;
        toIndex = (s.cardOrderByColumn[toColumnId] ?? []).indexOf(overCardId);
      } else if (rawOver.startsWith("col-")) {
        toColumnId = stripPrefix(rawOver, "col-");
        toIndex = (s.cardOrderByColumn[toColumnId] ?? []).length;
      } else if (s.columns[rawOver]) {
        toColumnId = rawOver;
        toIndex = (s.cardOrderByColumn[toColumnId] ?? []).length;
      } else if (s.cards[rawOver]) {
        const oc = s.cards[rawOver];
        toColumnId = oc.columnId;
        toIndex = (s.cardOrderByColumn[toColumnId] ?? []).indexOf(rawOver);
      }
      if (!toColumnId) return;
      const result = moveCard(cardId, toColumnId, toIndex);
      if (result) persist({ cardId, toColumnId, toIndex: result.to.index, rollback: result.rollback });
    },
    [moveCard, persist]
  );

  const cards = useBoardStore((s) => s.cards);
  const activeCard: JobCardT | null = activeId ? (cards[activeId] ?? null) : null;

  return { sensors, collisionDetection, onDragStart, onDragEnd, activeId, activeCard };
}

"use client";

import { create } from "zustand";
import type { ColumnT, JobCardT } from "@/lib/types";

/**
 * ARCHITECTURE NOTES
 * - Why normalized state? Cards are NOT nested inside columns. Instead:
 *     columns: Record<id, Column>, cards: Record<id, Card>, cardOrderByColumn: Record<columnId, cardId[]>
 *   This makes moves/reorders O(1) lookups + array splice on a single column,
 *   avoids deep-clone bugs, and mirrors how Prisma + TanStack Query cache works.
 * - Why Zustand + TanStack Query? Zustand = ephemeral UI state (selection, filters,
 *   undo stack, optimistic order). TanStack Query = server state (fetch/persist).
 *   The store exposes `applyServerSnapshot` for hydration and optimistic helpers
 *   that return a rollback closure.
 * - Optimistic updates: mutate Zustand first, fire API, on failure restore snapshot.
 * - Undo/redo: push {columns, cards, cardOrderByColumn} snapshots (capped at 50).
 *   Snapshots are cheap here (small boards); for huge boards we'd store diffs.
 */

export interface Filters {
  query: string; // matches company + role
  tag: string | null;
  dateFrom: string | null; // ISO date yyyy-mm-dd
  dateTo: string | null;
}

interface Snapshot {
  columns: Record<string, ColumnT>;
  columnOrder: string[];
  cards: Record<string, JobCardT>;
  cardOrderByColumn: Record<string, string[]>;
}

interface BoardStore {
  boardId: string | null;
  boardName: string;
  columns: Record<string, ColumnT>;
  columnOrder: string[];
  cards: Record<string, JobCardT>;
  cardOrderByColumn: Record<string, string[]>;

  selectedCardId: string | null;
  isFormOpen: boolean;
  editingCardId: string | null;
  formDefaultColumnId: string | null;
  detailCardId: string | null;
  showAnalytics: boolean;

  filters: Filters;

  past: Snapshot[];
  future: Snapshot[];

  // hydration
  hydrate: (boardId: string, boardName: string, columns: ColumnT[], cards: JobCardT[]) => void;

  // selectors (as methods to keep it simple in tests)
  cardsInColumn: (columnId: string) => JobCardT[];
  filteredCardsInColumn: (columnId: string) => JobCardT[];

  // optimistic mutations (pure local, caller persists)
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => { rollback: () => void; from: { columnId: string; index: number }; to: { columnId: string; index: number } } | null;
  reorderColumn: (columnId: string, toIndex: number) => void;
  upsertCardLocal: (card: JobCardT) => void;
  deleteCardLocal: (cardId: string) => JobCardT | null;
  addColumnLocal: (col: ColumnT) => void;
  renameColumnLocal: (columnId: string, name: string) => void;
  deleteColumnLocal: (columnId: string) => void;

  // undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ui
  setFilters: (p: Partial<Filters>) => void;
  openCreate: (columnId?: string) => void;
  openEdit: (cardId: string) => void;
  closeForm: () => void;
  setDetailCard: (cardId: string | null) => void;
  setShowAnalytics: (v: boolean) => void;
}

function takeSnapshot(s: BoardStore): Snapshot {
  return {
    columns: s.columns,
    columnOrder: s.columnOrder,
    cards: s.cards,
    cardOrderByColumn: s.cardOrderByColumn,
  };
}

function pushHistory(
  prev: BoardStore,
  next: Partial<Pick<BoardStore, "columns" | "columnOrder" | "cards" | "cardOrderByColumn">>
): Partial<BoardStore> {
  const past = [...prev.past, takeSnapshot(prev)].slice(-50);
  return { ...next, past, future: [] };
}

export const DEFAULT_COLUMNS = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];

/**
 * Pure filter helper. Components must NOT call store methods that return fresh
 * arrays inside a zustand selector (getSnapshot must be cached) — instead
 * select stable refs (ids, records, filters) and memoize with this function.
 */
export function applyCardFilters(cards: JobCardT[], filters: Filters): JobCardT[] {
  const q = filters.query.trim().toLowerCase();
  return cards.filter((c) => {
    if (q && !(c.company.toLowerCase().includes(q) || c.role.toLowerCase().includes(q))) return false;
    if (filters.tag && !c.tags.includes(filters.tag)) return false;
    if (filters.dateFrom && c.dateApplied && c.dateApplied.slice(0, 10) < filters.dateFrom) return false;
    if (filters.dateTo && c.dateApplied && c.dateApplied.slice(0, 10) > filters.dateTo) return false;
    return true;
  });
}

export function buildMockBoard(): { columns: ColumnT[]; cards: JobCardT[] } {
  const cols: ColumnT[] = DEFAULT_COLUMNS.map((name, i) => ({
    id: `col-${i}`,
    boardId: "demo-board",
    name,
    order: i,
  }));
  const seed: Array<[string, string, string, string[], number]> = [
    ["Acme Corp", "Frontend Engineer", "col-1", ["react", "remote"], 120000],
    ["Globex", "Full-stack Dev", "col-0", ["wishlist"], 140000],
    ["Initech", "Backend Engineer", "col-2", ["onsite", "python"], 150000],
    ["Umbrella", "DevOps Engineer", "col-1", ["aws"], 135000],
  ];
  const cards: JobCardT[] = seed.map(([company, role, columnId, tags, salary], i) => ({
    id: `card-${i}`,
    columnId,
    order: i,
    company,
    role,
    jobUrl: "https://example.com/jobs/" + i,
    salary,
    notes: "",
    tags,
    dateApplied: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  return { columns: cols, cards };
}

export const useBoardStore = create<BoardStore>()((set, get) => ({
  boardId: null,
  boardName: "Job Search",
  columns: {},
  columnOrder: [],
  cards: {},
  cardOrderByColumn: {},
  selectedCardId: null,
  isFormOpen: false,
  editingCardId: null,
  formDefaultColumnId: null,
  detailCardId: null,
  showAnalytics: false,
  filters: { query: "", tag: null, dateFrom: null, dateTo: null },
  past: [],
  future: [],

  hydrate: (boardId, boardName, columns, cards) => {
    const cols: Record<string, ColumnT> = {};
    const order: string[] = [...columns].sort((a, b) => a.order - b.order).map((c) => {
      cols[c.id] = c;
      return c.id;
    });
    const cardMap: Record<string, JobCardT> = {};
    const byCol: Record<string, string[]> = {};
    for (const c of order) byCol[c] = [];
    for (const card of cards) {
      cardMap[card.id] = card;
      if (!byCol[card.columnId]) byCol[card.columnId] = [];
      byCol[card.columnId].push(card.id);
    }
    for (const k of Object.keys(byCol)) {
      byCol[k].sort((a, b) => (cardMap[a]?.order ?? 0) - (cardMap[b]?.order ?? 0));
    }
    set({ boardId, boardName, columns: cols, columnOrder: order, cards: cardMap, cardOrderByColumn: byCol, past: [], future: [] });
  },

  cardsInColumn: (columnId) => {
    const s = get();
    return (s.cardOrderByColumn[columnId] ?? []).map((id) => s.cards[id]).filter(Boolean);
  },

  filteredCardsInColumn: (columnId) => {
    const s = get();
    return applyCardFilters(s.cardsInColumn(columnId), s.filters);
  },

  moveCard: (cardId, toColumnId, toIndex) => {
    const s = get();
    const card = s.cards[cardId];
    if (!card) return null;
    const fromColumnId = card.columnId;
    const fromList = [...(s.cardOrderByColumn[fromColumnId] ?? [])];
    const fromIndex = fromList.indexOf(cardId);
    const toListBase = fromColumnId === toColumnId ? fromList : [...(s.cardOrderByColumn[toColumnId] ?? [])];
    if (fromColumnId === toColumnId) {
      toListBase.splice(fromIndex, 1);
    } else {
      fromList.splice(fromIndex, 1);
    }
    const clamped = Math.max(0, Math.min(toIndex, toListBase.length));
    toListBase.splice(clamped, 0, cardId);

    const nextByCol = { ...s.cardOrderByColumn };
    if (fromColumnId === toColumnId) {
      nextByCol[fromColumnId] = toListBase;
    } else {
      nextByCol[fromColumnId] = fromList;
      nextByCol[toColumnId] = toListBase;
    }
    const reindex = (ids: string[], colId: string, cards: Record<string, JobCardT>) => {
      const out = { ...cards };
      ids.forEach((id, idx) => {
        if (out[id]) out[id] = { ...out[id], columnId: colId, order: idx, updatedAt: new Date().toISOString() };
      });
      return out;
    };
    let nextCards = reindex(nextByCol[fromColumnId] ?? [], fromColumnId, s.cards);
    if (fromColumnId !== toColumnId) nextCards = reindex(nextByCol[toColumnId] ?? [], toColumnId, nextCards);

    const prevSnapshot = takeSnapshot(s);
    set({
      cards: nextCards,
      cardOrderByColumn: nextByCol,
      past: [...s.past, prevSnapshot].slice(-50),
      future: [],
    });

    const rollback = () => {
      set({ columns: prevSnapshot.columns, columnOrder: prevSnapshot.columnOrder, cards: prevSnapshot.cards, cardOrderByColumn: prevSnapshot.cardOrderByColumn });
    };
    return { rollback, from: { columnId: fromColumnId, index: fromIndex }, to: { columnId: toColumnId, index: clamped } };
  },

  reorderColumn: (columnId, toIndex) => {
    const s = get();
    const list = [...s.columnOrder];
    const from = list.indexOf(columnId);
    if (from < 0) return;
    list.splice(from, 1);
    list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, columnId);
    const columns = { ...s.columns };
    list.forEach((id, i) => {
      if (columns[id]) columns[id] = { ...columns[id], order: i };
    });
    set({ ...pushHistory(s, { columns, columnOrder: list }) });
  },

  upsertCardLocal: (card) => {
    const s = get();
    const cards = { ...s.cards, [card.id]: card };
    const byCol = { ...s.cardOrderByColumn };
    // remove from all lists then insert sorted
    for (const k of Object.keys(byCol)) byCol[k] = byCol[k].filter((id) => id !== card.id);
    if (!byCol[card.columnId]) byCol[card.columnId] = [];
    byCol[card.columnId] = [...byCol[card.columnId], card.id].sort(
      (a, b) => (cards[a]?.order ?? 0) - (cards[b]?.order ?? 0)
    );
    set({ ...pushHistory(s, { cards, cardOrderByColumn: byCol }) });
  },

  deleteCardLocal: (cardId) => {
    const s = get();
    const removed = s.cards[cardId] ?? null;
    if (!removed) return null;
    const cards = { ...s.cards };
    delete cards[cardId];
    const byCol: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(s.cardOrderByColumn)) byCol[k] = v.filter((id) => id !== cardId);
    set({ ...pushHistory(s, { cards, cardOrderByColumn: byCol }) });
    return removed;
  },

  addColumnLocal: (col) => {
    const s = get();
    set({ ...pushHistory(s, { columns: { ...s.columns, [col.id]: col }, columnOrder: [...s.columnOrder, col.id], cardOrderByColumn: { ...s.cardOrderByColumn, [col.id]: [] } }) });
  },

  renameColumnLocal: (columnId, name) => {
    const s = get();
    if (!s.columns[columnId]) return;
    set({ ...pushHistory(s, { columns: { ...s.columns, [columnId]: { ...s.columns[columnId], name } } }) });
  },

  deleteColumnLocal: (columnId) => {
    const s = get();
    const columns = { ...s.columns };
    delete columns[columnId];
    const columnOrder = s.columnOrder.filter((id) => id !== columnId);
    const cards = { ...s.cards };
    for (const id of s.cardOrderByColumn[columnId] ?? []) delete cards[id];
    const byCol = { ...s.cardOrderByColumn };
    delete byCol[columnId];
    set({ ...pushHistory(s, { columns, columnOrder, cards, cardOrderByColumn: byCol }) });
  },

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({ columns: prev.columns, columnOrder: prev.columnOrder, cards: prev.cards, cardOrderByColumn: prev.cardOrderByColumn, past: s.past.slice(0, -1), future: [...s.future, takeSnapshot(s)] });
  },

  redo: () => {
    const s = get();
    const next = s.future[s.future.length - 1];
    if (!next) return;
    set({ columns: next.columns, columnOrder: next.columnOrder, cards: next.cards, cardOrderByColumn: next.cardOrderByColumn, future: s.future.slice(0, -1), past: [...s.past, takeSnapshot(s)] });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
  openCreate: (columnId) => set({ isFormOpen: true, editingCardId: null, formDefaultColumnId: columnId ?? null }),
  openEdit: (cardId) => set({ isFormOpen: true, editingCardId: cardId }),
  closeForm: () => set({ isFormOpen: false, editingCardId: null }),
  setDetailCard: (cardId) => set({ detailCardId: cardId }),
  setShowAnalytics: (v) => set({ showAnalytics: v }),
}));

// Activity log is server-fetched per card (TanStack Query), not kept in Zustand
// to keep UI state small. See components/board/CardDetailModal.tsx.
export type { Snapshot };

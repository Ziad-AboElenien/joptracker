import { describe, it, expect, beforeEach } from "vitest";
import { useBoardStore, buildMockBoard } from "@/lib/store/boardStore";

beforeEach(() => {
  const { columns, cards } = buildMockBoard();
  useBoardStore.getState().hydrate("demo-board", "Test", columns, cards);
});

describe("boardStore normalized moves", () => {
  it("moves a card between columns and reindexes", () => {
    const s = useBoardStore.getState();
    const cardId = s.cardOrderByColumn["col-0"][0];
    const res = s.moveCard(cardId, "col-2", 0);
    expect(res).not.toBeNull();
    const after = useBoardStore.getState();
    expect(after.cards[cardId].columnId).toBe("col-2");
    expect(after.cardOrderByColumn["col-2"][0]).toBe(cardId);
  });

  it("supports undo/redo", () => {
    const before = useBoardStore.getState().cardOrderByColumn["col-2"]?.length ?? 0;
    const s = useBoardStore.getState();
    const cardId = s.cardOrderByColumn["col-0"][0];
    s.moveCard(cardId, "col-2", 99);
    expect(useBoardStore.getState().cardOrderByColumn["col-2"].length).toBe(before + 1);
    useBoardStore.getState().undo();
    expect(useBoardStore.getState().cardOrderByColumn["col-2"].length).toBe(before);
    useBoardStore.getState().redo();
    expect(useBoardStore.getState().cardOrderByColumn["col-2"].length).toBe(before + 1);
  });

  it("filters by query and tag", () => {
    const s = useBoardStore.getState();
    s.setFilters({ query: "acme", tag: null, dateFrom: null, dateTo: null });
    const filtered = useBoardStore.getState().filteredCardsInColumn("col-1");
    expect(filtered.some((c) => c.company === "Acme Corp")).toBe(true);
    s.setFilters({ query: "", tag: "remote", dateFrom: null, dateTo: null });
    const byTag = useBoardStore.getState().filteredCardsInColumn("col-1");
    expect(byTag.every((c) => c.tags.includes("remote"))).toBe(true);
  });
});

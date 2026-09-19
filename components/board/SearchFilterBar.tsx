"use client";

import { useBoardStore } from "@/lib/store/boardStore";
import { Input, Button } from "@/components/ui/primitives";

export function SearchFilterBar() {
  const filters = useBoardStore((s) => s.filters);
  const setFilters = useBoardStore((s) => s.setFilters);
  const cards = useBoardStore((s) => s.cards);
  const allTags = [...new Set(Object.values(cards).flatMap((c) => c.tags))].sort();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search company or role…"
        value={filters.query}
        onChange={(e) => setFilters({ query: e.target.value })}
        className="max-w-64"
        aria-label="Search cards"
      />
      <select
        aria-label="Filter by tag"
        value={filters.tag ?? ""}
        onChange={(e) => setFilters({ tag: e.target.value || null })}
        className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">All tags</option>
        {allTags.map((t) => (
          <option key={t} value={t}>#{t}</option>
        ))}
      </select>
      <Input type="date" aria-label="From date" value={filters.dateFrom ?? ""} onChange={(e) => setFilters({ dateFrom: e.target.value || null })} className="max-w-40" />
      <Input type="date" aria-label="To date" value={filters.dateTo ?? ""} onChange={(e) => setFilters({ dateTo: e.target.value || null })} className="max-w-40" />
      {(filters.query || filters.tag || filters.dateFrom || filters.dateTo) && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ query: "", tag: null, dateFrom: null, dateTo: null })}>Clear</Button>
      )}
    </div>
  );
}

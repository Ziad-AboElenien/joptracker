"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useBoardStore } from "@/lib/store/boardStore";
import { Input, Button } from "@/components/ui/primitives";
import { Dropdown } from "@/components/ui/dropdown";

export function SearchFilterBar() {
  const filters = useBoardStore((s) => s.filters);
  const setFilters = useBoardStore((s) => s.setFilters);
  const cards = useBoardStore((s) => s.cards);
  const allTags = [...new Set(Object.values(cards).flatMap((c) => c.tags))].sort();
  const hasActive = filters.query || filters.tag || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search company or role…"
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          className="w-56 pl-9"
          aria-label="Search cards"
        />
      </div>
      <Dropdown
        ariaLabel="Filter by tag"
        value={filters.tag ?? ""}
        onChange={(v) => setFilters({ tag: v || null })}
        options={[{ value: "", label: "All tags" }, ...allTags.map((t) => ({ value: t, label: `#${t}` }))]}
        className="w-40"
      />
      <Input type="date" aria-label="From date" value={filters.dateFrom ?? ""} onChange={(e) => setFilters({ dateFrom: e.target.value || null })} className="w-36" />
      <Input type="date" aria-label="To date" value={filters.dateTo ?? ""} onChange={(e) => setFilters({ dateTo: e.target.value || null })} className="w-36" />
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ query: "", tag: null, dateFrom: null, dateTo: null })}>
          <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

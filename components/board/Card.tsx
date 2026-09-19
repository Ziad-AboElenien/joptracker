"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JobCardT } from "@/lib/types";
import { Badge, CardShell } from "@/components/ui/primitives";
import { useBoardStore } from "@/lib/store/boardStore";

export function JobCard({ card }: { card: JobCardT }) {
  const openEdit = useBoardStore((s) => s.openEdit);
  const setDetailCard = useBoardStore((s) => s.setDetailCard);
  const deleteCardLocal = useBoardStore((s) => s.deleteCardLocal);
  const upsertCardLocal = useBoardStore((s) => s.upsertCardLocal);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  // Optimistic delete: remove locally first, restore on API failure.
  const handleDelete = async () => {
    if (!confirm(`Delete ${card.company} — ${card.role}?`)) return;
    const removed = deleteCardLocal(card.id);
    if (!removed) return;
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      upsertCardLocal(removed);
      alert("Delete failed — card restored.");
    }
  };

  return (
    <CardShell
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab p-3 active:cursor-grabbing"
      data-testid={`card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{card.company}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{card.role}</p>
        </div>
        {card.salary != null && <Badge>${card.salary.toLocaleString()}</Badge>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {card.tags.map((t) => (
          <Badge key={t} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">#{t}</Badge>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="text-xs underline" onClick={() => setDetailCard(card.id)}>Details</button>
        <button className="text-xs underline" onClick={() => openEdit(card.id)}>Edit</button>
        <button className="text-xs underline text-red-600 dark:text-red-400" onClick={handleDelete} aria-label={`Delete ${card.company} ${card.role}`}>Delete</button>
      </div>
    </CardShell>
  );
}

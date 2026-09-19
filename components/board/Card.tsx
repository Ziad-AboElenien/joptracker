"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";
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
      className="anim-card-in cursor-grab p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:cursor-grabbing"
      data-testid={`card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{card.company}</p>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{card.role}</p>
        </div>
        {card.salary != null && <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">${card.salary.toLocaleString()}</Badge>}
      </div>
      {card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((t) => (
            <Badge key={t} className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">#{t}</Badge>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1 border-t border-black/5 pt-2 text-xs dark:border-white/10">
        <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 transition hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300" onClick={() => setDetailCard(card.id)}>
          <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" /> Details
        </button>
        <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 transition hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300" onClick={() => openEdit(card.id)}>
          <FontAwesomeIcon icon={faPen} className="h-3 w-3" /> Edit
        </button>
        <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400" onClick={handleDelete} aria-label={`Delete ${card.company} ${card.role}`}>
          <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" /> Delete
        </button>
      </div>
    </CardShell>
  );
}

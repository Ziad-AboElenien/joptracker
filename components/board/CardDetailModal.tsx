"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal, Badge, Button } from "@/components/ui/primitives";
import { useBoardStore } from "@/lib/store/boardStore";
import type { ActivityLogT } from "@/lib/types";

export function CardDetailModal() {
  const detailCardId = useBoardStore((s) => s.detailCardId);
  const setDetailCard = useBoardStore((s) => s.setDetailCard);
  const card = useBoardStore((s) => (detailCardId ? s.cards[detailCardId] : undefined));
  const openEdit = useBoardStore((s) => s.openEdit);

  const { data: logs = [] } = useQuery<ActivityLogT[]>({
    queryKey: ["activity", detailCardId],
    queryFn: async () => {
      if (!detailCardId) return [];
      const res = await fetch(`/api/activity?jobCardId=${detailCardId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!detailCardId,
  });

  return (
    <Modal open={!!card} onClose={() => setDetailCard(null)} title={card ? `${card.company} — ${card.role}` : "Details"}>
      {card && (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-1">
            {card.tags.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
          {card.jobUrl && <a className="text-blue-600 underline" href={card.jobUrl} target="_blank" rel="noreferrer">{card.jobUrl}</a>}
          {card.salary != null && <p>Salary: ${card.salary.toLocaleString()}</p>}
          {card.dateApplied && <p>Applied: {new Date(card.dateApplied).toLocaleDateString()}</p>}
          {card.notes && <p className="whitespace-pre-wrap rounded bg-zinc-100 p-2 dark:bg-zinc-800">{card.notes}</p>}
          <div>
            <h3 className="font-semibold">Activity</h3>
            <ul className="mt-1 space-y-1">
              {logs.length === 0 && <li className="text-zinc-500">No moves yet.</li>}
              {logs.map((l) => (
                <li key={l.id}>• {l.action} on {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setDetailCard(null); openEdit(card.id); }}>Edit</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

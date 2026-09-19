"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faBriefcase,
  faBuilding,
  faCalendarDays,
  faClockRotateLeft,
  faLink,
  faMoneyBillWave,
  faNoteSticky,
  faPen,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { Modal, Badge, Button } from "@/components/ui/primitives";
import { useBoardStore } from "@/lib/store/boardStore";
import type { ActivityLogT } from "@/lib/types";

export function CardDetailModal() {
  const detailCardId = useBoardStore((s) => s.detailCardId);
  const setDetailCard = useBoardStore((s) => s.setDetailCard);
  const card = useBoardStore((s) => (detailCardId ? s.cards[detailCardId] : undefined));
  const stageName = useBoardStore((s) => (card ? s.columns[card.columnId]?.name : undefined));
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

  const row = "flex items-center gap-2.5 text-sm";

  return (
    <Modal
      open={!!card}
      onClose={() => setDetailCard(null)}
      title={card ? `${card.company} — ${card.role}` : "Details"}
      icon={<FontAwesomeIcon icon={faBriefcase} className="h-4 w-4 text-indigo-500" />}
    >
      {card && (
        <div className="space-y-3">
          {stageName && <Badge className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{stageName}</Badge>}
          <div className="space-y-2 rounded-xl border border-white/60 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className={row}><FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />{card.company}</p>
            <p className={row}><FontAwesomeIcon icon={faBriefcase} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />{card.role}</p>
            {card.jobUrl && (
              <p className={row}>
                <FontAwesomeIcon icon={faLink} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <a className="truncate text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300" href={card.jobUrl} target="_blank" rel="noreferrer">{card.jobUrl}</a>
              </p>
            )}
            {card.salary != null && <p className={row}><FontAwesomeIcon icon={faMoneyBillWave} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />${card.salary.toLocaleString()}</p>}
            {card.dateApplied && <p className={row}><FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />Applied {new Date(card.dateApplied).toLocaleDateString()}</p>}
            {card.tags.length > 0 && (
              <p className={row}>
                <FontAwesomeIcon icon={faTags} className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="flex flex-wrap gap-1">{card.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</span>
              </p>
            )}
          </div>
          {card.notes && (
            <p className="whitespace-pre-wrap rounded-xl border border-white/60 bg-white/50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
              <FontAwesomeIcon icon={faNoteSticky} className="mr-2 h-3.5 w-3.5 text-zinc-400" />{card.notes}
            </p>
          )}
          <div className="rounded-xl border border-white/60 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-3.5 w-3.5 text-indigo-500" /> Activity
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              {logs.length === 0 && <li>No moves yet.</li>}
              {logs.map((l) => (
                <li key={l.id} className="flex items-start gap-1.5">
                  <FontAwesomeIcon icon={faAngleRight} className="mt-1 h-3 w-3 shrink-0 text-indigo-400" />
                  <span>{l.action} on {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="primary" onClick={() => { setDetailCard(null); openEdit(card.id); }}>
              <FontAwesomeIcon icon={faPen} className="h-3 w-3" /> Edit
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

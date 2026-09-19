"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/lib/store/boardStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { Modal } from "@/components/ui/primitives";

export function AnalyticsView() {
  const show = useBoardStore((s) => s.showAnalytics);
  const setShow = useBoardStore((s) => s.setShowAnalytics);
  const cards = useBoardStore((s) => s.cards);
  const columns = useBoardStore((s) => s.columns);

  const perWeek = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const c of Object.values(cards)) {
      const d = c.dateApplied ? new Date(c.dateApplied) : new Date(c.createdAt);
      const week = `${d.getFullYear()}-W${String(Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, "0")}`;
      buckets[week] = (buckets[week] ?? 0) + 1;
    }
    return Object.entries(buckets).sort(([a], [b]) => (a < b ? -1 : 1)).map(([week, count]) => ({ week, count }));
  }, [cards]);

  const funnel = useMemo(() => {
    const byName: Record<string, number> = {};
    for (const c of Object.values(cards)) {
      const name = columns[c.columnId]?.name ?? "Unknown";
      byName[name] = (byName[name] ?? 0) + 1;
    }
    const order = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];
    return order.filter((n) => byName[n] != null).map((n) => ({ name: n, value: byName[n] }));
  }, [cards, columns]);

  return (
    <Modal open={show} onClose={() => setShow(false)} title="Analytics">
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Applications per week</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perWeek}>
                <XAxis dataKey="week" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Conversion funnel</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnel} isAnimationActive={false} fill="#10b981">
                  <LabelList position="right" fill="#888" stroke="none" dataKey="name" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Modal>
  );
}

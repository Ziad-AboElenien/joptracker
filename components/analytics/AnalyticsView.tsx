"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartColumn, faFilter } from "@fortawesome/free-solid-svg-icons";
import { useBoardStore } from "@/lib/store/boardStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";
import { CardShell, Badge } from "@/components/ui/primitives";

const BAR_COLORS = ["#6366f1", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];

/**
 * Permanent analytics section rendered below the board (id="analytics",
 * linked from the header nav). No modal: always visible, scroll into view.
 */
export function AnalyticsView() {
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

  const total = Object.values(cards).length;

  return (
    <section id="analytics" aria-label="Analytics" className="scroll-mt-24 pt-2">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
          <FontAwesomeIcon icon={faChartColumn} className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight">Analytics</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <Badge>{total} application{total === 1 ? "" : "s"}</Badge>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardShell className="p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FontAwesomeIcon icon={faChartColumn} className="h-3.5 w-3.5 text-indigo-500" /> Applications per week
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perWeek} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }}
                />
                <Bar dataKey="count" radius={[8, 8, 4, 4]}>
                  {perWeek.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardShell>
        <CardShell className="p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FontAwesomeIcon icon={faFilter} className="h-3.5 w-3.5 text-cyan-500" /> Conversion funnel
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }}
                />
                <Funnel dataKey="value" data={funnel} fill="#6366f1">
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                  <LabelList position="right" fill="#888" stroke="none" dataKey="name" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardShell>
      </div>
    </section>
  );
}

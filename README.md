# Kanban Job Tracker

Trello-style kanban board for tracking job applications (Wishlist → Applied → Interviewing → Offer → Rejected), with drag & drop, validated forms, optimistic persistence, undo/redo, search/filter, custom columns, tags, activity log, analytics, auth, and dark mode.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS v4
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag & drop
- Zustand (UI state) + TanStack Query (server state)
- React Hook Form + Zod
- Prisma 5 + SQLite (`file:./dev.db`, swap `provider` to `postgresql` for prod)
- NextAuth.js (Credentials demo + GitHub OAuth when `GITHUB_ID/SECRET` set)
- Recharts for analytics; Vitest + RTL; Playwright for E2E

## Getting started

```bash
cp .env.example .env
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev   # http://localhost:3000 → redirects to /board
```

Tests: `npm test` · E2E: `npm run test:e2e` · Build: `npm run build`

## Architectural decisions (short)

- **Why dnd-kit over react-beautiful-dnd / pragmatics?** dnd-kit is headless, supports sortable + droppable primitives, keyboard sensors (`KeyboardSensor` + `sortableKeyboardCoordinates`) out of the box, and works with React 19. Accessibility: cards are sortable items focusable via Tab, movable via Space + arrows.
- **Why normalized Zustand state?** `columns: Record<id,Column>`, `cards: Record<id,Card>`, `cardOrderByColumn: Record<colId, cardId[]>` — see `lib/store/boardStore.ts`. Avoids deep nested updates, makes `moveCard` a splice on 1–2 id arrays + reindex, and mirrors server cache shape. Undo/redo = capped (50) snapshots of these three maps.
- **How optimistic updates work:** `Board.tsx` calls `moveCard()` (Zustand) immediately, then `PATCH /api/cards/:id/move`. On failure the returned `rollback()` closure restores the pre-move snapshot; `JobCardForm` does the same via `upsertCardLocal` + `invalidateQueries(["board"])` on error. Server re-sequences `order` in a Prisma transaction and writes `ActivityLog` on column change.
- **Zustand vs TanStack Query split:** Zustand owns filters, selection, modal state, order, undo stack. Query owns `["board"]` fetch and `["activity", cardId]` logs. `hydrate()` bridges server → client.

## Features (priority order implemented)

1. Board UI (`components/board/*`) from normalized store
2. Drag & drop inter- + intra-column, keyboard accessible
3. `JobCardForm` (RHF + Zod: required company/role, http(s) URL, numeric salary)
4. Prisma CRUD: `/api/board`, `/api/cards`, `/api/cards/:id`, `/api/cards/:id/move`, `/api/columns`, `/api/columns/:id`, `/api/activity`
5. Optimistic UI with rollback
6. Normalized Zustand shape
7. Undo/redo (buttons + Ctrl/Cmd+Z / Shift+Z / Y via `hooks/useUndoRedo.ts`)
8. Search (company/role) + tag + date-range filter (`SearchFilterBar`)
9. Custom columns: add / rename / delete (reorder via `reorderColumn`)
10. Tags per card
11. Card detail modal + activity log ("Moved to X on …")
12. Analytics modal: applications/week bar + funnel (`AnalyticsView`, Recharts)
13. Auth: NextAuth, per-user boards (`lib/server-helpers.ts#getOrCreateBoard`); demo fallback `demo-user` when logged out; set `AUTH_STRICT=1` to force `/login`
14. Dark mode (`ThemeToggle`, `.dark` variant, localStorage)

## Folder structure

```
/app/(dashboard)/board/page.tsx  /api/cards|columns|board|activity/route.ts
/components/board/{Board,Column,Card,CardDetailModal,SearchFilterBar}.tsx
/components/forms/JobCardForm.tsx  /components/analytics/AnalyticsView.tsx
/lib/store/boardStore.ts  /lib/schemas/jobCard.schema.ts  /lib/db/prisma.ts
/hooks/{useDragAndDrop,useUndoRedo}.ts  /prisma/schema.prisma
```

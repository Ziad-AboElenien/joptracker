"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleExclamation, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useBoardStore } from "@/lib/store/boardStore";
import { Modal, Button } from "@/components/ui/primitives";

/**
 * Styled replacement for native confirm(). Awaiting components call
 * requestConfirm() and continue when the user picks an action.
 */
export function ConfirmDialog() {
  const req = useBoardStore((s) => s.confirmRequest);
  const answerConfirm = useBoardStore((s) => s.answerConfirm);

  return (
    <Modal
      open={!!req}
      onClose={() => answerConfirm(false)}
      narrow
      title={req?.title ?? "Confirm"}
      icon={
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md ${req?.danger ? "bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-red-500/30" : "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-indigo-500/30"}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
        </span>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{req?.message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={() => answerConfirm(false)}>
          <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button variant={req?.danger ? "destructive" : "primary"} onClick={() => answerConfirm(true)} autoFocus>
          <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" /> {req?.confirmLabel ?? "Confirm"}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Styled replacement for native alert(). Awaiting components call
 * showNotice() for error/info feedback with motion.
 */
export function NoticeDialog() {
  const notice = useBoardStore((s) => s.notice);
  const dismissNotice = useBoardStore((s) => s.dismissNotice);

  return (
    <Modal
      open={!!notice}
      onClose={dismissNotice}
      narrow
      title={notice?.title ?? "Notice"}
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-4 w-4" />
        </span>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{notice?.message}</p>
      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={dismissNotice} autoFocus>
          <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" /> OK
        </Button>
      </div>
    </Modal>
  );
}

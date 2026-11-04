"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { common } from "@/content/ko";
import { Button } from "@/components/ui/Button";

// <dialog>.showModal() 로 포커스 트랩·Esc·inert 를 브라우저에 맡긴다. 닫히면 열기 전 포커스로 돌아간다.
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  danger = false,
  busy = false,
  cancelLabel = common.cancel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
  cancelLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const onClosed = () => {
      restoreRef.current?.focus?.();
    };
    el.addEventListener("cancel", onCancel);
    el.addEventListener("close", onClosed);
    return () => {
      el.removeEventListener("cancel", onCancel);
      el.removeEventListener("close", onClosed);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-body">
        <h2 id={titleId} className="t-title">
          {title}
        </h2>
        {description ? <p id={descId}>{description}</p> : null}
        {children}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={busy} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

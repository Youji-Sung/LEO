"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { common } from "@/content/ko";

type Tone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ show: (message: string, tone?: Tone) => void } | null>(null);

const AUTO_CLOSE_MS = 5000;

// 하단 중앙 토스트. role=status 로 조용히 알리고, 5초 뒤 닫히되 포인터·포커스가 올라가 있으면 멈춘다.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((list) => list.filter((i) => i.id !== id));
  }, []);

  const arm = useCallback(
    (id: number) => {
      const prev = timers.current.get(id);
      if (prev) clearTimeout(prev);
      const t = setTimeout(() => dismiss(id), AUTO_CLOSE_MS);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = ++seq.current;
      setItems((list) => {
        const kept = list.slice(-2);
        for (const dropped of list.slice(0, -2)) {
          const t = timers.current.get(dropped.id);
          if (t) clearTimeout(t);
          timers.current.delete(dropped.id);
        }
        return [...kept, { id, message, tone }];
      });
      arm(id);
    },
    [arm],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = t.tone === "success" ? CircleCheck : t.tone === "error" ? CircleAlert : Info;
          return (
            <div
              key={t.id}
              className={`toast toast-${t.tone}`}
              onMouseEnter={() => {
                const timer = timers.current.get(t.id);
                if (timer) clearTimeout(timer);
              }}
              onMouseLeave={() => arm(t.id)}
              onFocus={() => {
                const timer = timers.current.get(t.id);
                if (timer) clearTimeout(timer);
              }}
              onBlur={() => arm(t.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{t.message}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon-only"
                aria-label={common.close}
                onClick={() => dismiss(t.id)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider 안에서만 useToast 를 쓸 수 있다.");
  return ctx;
}

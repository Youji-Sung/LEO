"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { common, portfolio } from "@/content/ko";
import { apiJson, readError } from "@/lib/client-fetch";
import { formatDateTime } from "@/lib/format";

type Item = { id: string; title: string; createdAt: string; chars: number; preview: string };

export function PortfolioManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      let created: { portfolio: Item };
      if (mode === "pdf") {
        if (!file) throw new Error(portfolio.fileRequired);
        const fd = new FormData();
        fd.set("title", title);
        fd.set("file", file);
        const res = await fetch("/api/portfolios", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await readError(res));
        created = (await res.json()) as { portfolio: Item };
      } else {
        created = await apiJson<{ portfolio: Item }>("/api/portfolios", { method: "POST", body: JSON.stringify({ title, content }) });
      }
      setItems((list) => [{ ...created.portfolio, preview: content.slice(0, 200) }, ...list]);
      setTitle("");
      setContent("");
      setFile(null);
      setStatus(portfolio.added(created.portfolio.title, common.chars(created.portfolio.chars)));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(portfolio.deleteTitle)) return;
    try {
      await apiJson(`/api/portfolios/${id}`, { method: "DELETE" });
      setItems((list) => list.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="stack">
      <form onSubmit={onSubmit} className="card stack" aria-label={portfolio.formLabel}>
        <div className="row" role="radiogroup" aria-label={portfolio.modeLabel}>
          <label className="row" style={{ gap: 4 }}>
            <input type="radio" name="mode" checked={mode === "text"} onChange={() => setMode("text")} /> {portfolio.modeText}
          </label>
          <label className="row" style={{ gap: 4 }}>
            <input type="radio" name="mode" checked={mode === "pdf"} onChange={() => setMode("pdf")} /> {portfolio.modePdf}
          </label>
        </div>
        <div className="field">
          <label htmlFor="pf-title">{portfolio.title}</label>
          <input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "pdf" ? portfolio.titlePlaceholderPdf : portfolio.titlePlaceholderText} />
        </div>
        {mode === "text" ? (
          <div className="field">
            <label htmlFor="pf-content">{portfolio.content}</label>
            <textarea id="pf-content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder={portfolio.contentPlaceholder} />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="pf-file">{portfolio.file}</label>
            <input id="pf-file" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {status && <p role="status">{status}</p>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? portfolio.submitting : portfolio.submit}
          </button>
        </div>
      </form>

      <h2>{portfolio.listTitle}</h2>
      {items.length === 0 ? (
        <p className="muted">{portfolio.empty}</p>
      ) : (
        <ul className="list" data-testid="portfolio-list">
          {items.map((p) => (
            <li key={p.id} className="list-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{p.title}</strong>
                <button type="button" className="btn" onClick={() => remove(p.id)} aria-label={portfolio.deleteLabel(p.title)}>
                  {portfolio.deleteAction}
                </button>
              </div>
              <span className="muted">
                {formatDateTime(p.createdAt)} · {common.chars(p.chars)}
              </span>
              {p.preview && <p className="muted" style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>{p.preview}{p.chars > 200 ? "…" : ""}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

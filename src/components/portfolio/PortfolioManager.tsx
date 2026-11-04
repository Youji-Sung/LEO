"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { common, portfolio } from "@/content/ko";
import { apiJson, readError } from "@/lib/client-fetch";
import { formatDateTime } from "@/lib/format";
import {
  Button,
  Card,
  Choice,
  ChoiceGroup,
  Dialog,
  EmptyState,
  StatusMessage,
  TextArea,
  TextField,
  useToast,
} from "@/components/ui";

type Item = { id: string; title: string; createdAt: string; chars: number; preview: string };

// 미리보기는 마크다운 제목 기호를 떼고 한 줄로 보여 준다(AUDIT P4).
function previewText(raw: string): string {
  return raw
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function PortfolioManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        created = await apiJson<{ portfolio: Item }>("/api/portfolios", {
          method: "POST",
          body: JSON.stringify({ title, content }),
        });
      }
      const message = portfolio.added(
        created.portfolio.title,
        common.chars(created.portfolio.chars),
      );
      setItems((list) => [{ ...created.portfolio, preview: content.slice(0, 200) }, ...list]);
      setTitle("");
      setContent("");
      setFile(null);
      setStatus(message);
      toast.show(message, "success");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pending) return;
    const target = pending;
    setDeleting(true);
    try {
      await apiJson(`/api/portfolios/${target.id}`, { method: "DELETE" });
      setItems((list) => list.filter((p) => p.id !== target.id));
      setPending(null);
      toast.show(portfolio.deleted(target.title), "success");
      router.refresh();
    } catch (err) {
      setPending(null);
      toast.show((err as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="stack" aria-labelledby="portfolio-list-title">
        <h2 id="portfolio-list-title">{portfolio.listTitle}</h2>
        {items.length === 0 ? (
          <EmptyState title={portfolio.empty} />
        ) : (
          <ul className="list" data-testid="portfolio-list">
            {items.map((p) => (
              <li key={p.id} className="list-item">
                <div className="list-main">
                  <strong>{p.title}</strong>
                  <span className="list-meta">
                    <span>{formatDateTime(p.createdAt)}</span>
                    <span>{common.chars(p.chars)}</span>
                  </span>
                  {p.preview ? (
                    <p className="muted">
                      {previewText(p.preview)}
                      {p.chars > 200 ? "…" : ""}
                    </p>
                  ) : null}
                </div>
                <div className="list-actions">
                  <Button
                    variant="secondary"
                    icon={<Trash2 size={16} aria-hidden="true" />}
                    aria-label={portfolio.deleteLabel(p.title)}
                    onClick={() => setPending(p)}
                  >
                    {portfolio.deleteAction}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card as="section" title={portfolio.formLabel} titleId="portfolio-form-title">
        <form onSubmit={onSubmit} className="stack" aria-label={portfolio.formLabel}>
          <ChoiceGroup legend={portfolio.modeLabel}>
            <Choice
              kind="radio"
              name="mode"
              compact
              title={portfolio.modeText}
              checked={mode === "text"}
              onChange={() => setMode("text")}
            />
            <Choice
              kind="radio"
              name="mode"
              compact
              title={portfolio.modePdf}
              checked={mode === "pdf"}
              onChange={() => setMode("pdf")}
            />
          </ChoiceGroup>
          <TextField
            id="pf-title"
            label={portfolio.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              mode === "pdf" ? portfolio.titlePlaceholderPdf : portfolio.titlePlaceholderText
            }
          />
          {mode === "text" ? (
            <TextArea
              id="pf-content"
              label={portfolio.content}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder={portfolio.contentPlaceholder}
            />
          ) : (
            <div className="field">
              <label htmlFor="pf-file">{portfolio.file}</label>
              <input
                id="pf-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
          {error ? <StatusMessage tone="error" focus>{error}</StatusMessage> : null}
          {status ? <StatusMessage tone="success">{status}</StatusMessage> : null}
          <div>
            <Button
              type="submit"
              variant="primary"
              loading={busy}
              loadingLabel={portfolio.submitting}
            >
              {portfolio.submit}
            </Button>
          </div>
        </form>
      </Card>

      <Dialog
        open={pending !== null}
        title={portfolio.deleteTitle}
        description={pending ? portfolio.deleteBody(pending.title) : undefined}
        confirmLabel={portfolio.deleteAction}
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setPending(null);
        }}
      />
    </div>
  );
}

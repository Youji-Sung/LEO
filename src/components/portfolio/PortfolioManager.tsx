"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
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
        if (!file) throw new Error("PDF 파일을 선택하세요.");
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
      setStatus(`"${created.portfolio.title}" 등록 완료 (${created.portfolio.chars.toLocaleString()}자)`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("이 포트폴리오를 삭제할까요?")) return;
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
      <form onSubmit={onSubmit} className="card stack" aria-label="포트폴리오 등록">
        <div className="row" role="radiogroup" aria-label="입력 방식">
          <label className="row" style={{ gap: 4 }}>
            <input type="radio" name="mode" checked={mode === "text"} onChange={() => setMode("text")} /> 텍스트/마크다운 붙여넣기
          </label>
          <label className="row" style={{ gap: 4 }}>
            <input type="radio" name="mode" checked={mode === "pdf"} onChange={() => setMode("pdf")} /> PDF 업로드
          </label>
        </div>
        <div className="field">
          <label htmlFor="pf-title">제목</label>
          <input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "pdf" ? "비우면 파일 이름을 씁니다" : "예: 2025 백엔드 포트폴리오"} />
        </div>
        {mode === "text" ? (
          <div className="field">
            <label htmlFor="pf-content">내용</label>
            <textarea id="pf-content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="프로젝트 설명, 역할, 기술 스택, 성과를 영어 또는 한국어로…" />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="pf-file">PDF 파일</label>
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
            {busy ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>

      <h2>등록된 포트폴리오</h2>
      {items.length === 0 ? (
        <p className="muted">아직 없습니다.</p>
      ) : (
        <ul className="list" data-testid="portfolio-list">
          {items.map((p) => (
            <li key={p.id} className="list-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{p.title}</strong>
                <button type="button" className="btn" onClick={() => remove(p.id)} aria-label={`${p.title} 삭제`}>
                  삭제
                </button>
              </div>
              <span className="muted">
                {formatDateTime(p.createdAt)} · {p.chars.toLocaleString()}자
              </span>
              {p.preview && <p className="muted" style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>{p.preview}{p.chars > 200 ? "…" : ""}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

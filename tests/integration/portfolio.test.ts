import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as createConversation } from "@/app/api/conversations/route";
import { GET as listPortfolios, POST as createPortfolio } from "@/app/api/portfolios/route";
import { DELETE as deletePortfolio } from "@/app/api/portfolios/[id]/route";
import { prisma } from "@/lib/db";
import { buildPortfolioBlock } from "@/services/claude/prompts/themes";
import { extractPdfText } from "@/services/portfolio";

let cookie = "";

function req(
  pathname: string,
  init: { method?: string; body?: BodyInit; json?: unknown; headers?: Record<string, string> } = {},
) {
  return new NextRequest(`http://localhost${pathname}`, {
    method: init.method ?? "POST",
    headers: {
      ...(init.json !== undefined ? { "Content-Type": "application/json" } : {}),
      cookie,
      ...(init.headers ?? {}),
    },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(async () => {
  const res = await signup(
    req("/api/auth/signup", {
      json: { email: `pf-${Date.now()}@test.local`, password: "password-123", name: "포폴" },
    }),
    {},
  );
  cookie = (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
});

describe("portfolio API", () => {
  it("creates from text, lists, and deletes", async () => {
    const created = await createPortfolio(
      req("/api/portfolios", {
        json: { title: "My portfolio", content: "# Project A\nBuilt a Node API." },
      }),
      {},
    );
    expect(created.status).toBe(201);
    const { portfolio } = (await created.json()) as { portfolio: { id: string; chars: number } };
    expect(portfolio.chars).toBeGreaterThan(10);

    const list = (await (
      await listPortfolios(req("/api/portfolios", { method: "GET" }), {})
    ).json()) as { portfolios: Array<{ id: string }> };
    expect(list.portfolios.some((p) => p.id === portfolio.id)).toBe(true);

    const del = await deletePortfolio(
      req(`/api/portfolios/${portfolio.id}`, { method: "DELETE" }),
      ctx(portfolio.id),
    );
    expect(del.status).toBe(200);
    expect(await prisma.portfolio.findUnique({ where: { id: portfolio.id } })).toBeNull();
    const again = await deletePortfolio(
      req(`/api/portfolios/${portfolio.id}`, { method: "DELETE" }),
      ctx(portfolio.id),
    );
    expect(again.status).toBe(404);
  });

  it("rejects empty content and empty title", async () => {
    expect(
      (await createPortfolio(req("/api/portfolios", { json: { title: "t", content: "   " } }), {}))
        .status,
    ).toBe(400);
    expect(
      (await createPortfolio(req("/api/portfolios", { json: { title: " ", content: "x" } }), {}))
        .status,
    ).toBe(400);
  });

  it("extracts text from an uploaded PDF", async () => {
    const bytes = readFileSync(path.join(process.cwd(), "e2e/fixtures/sample.pdf"));
    expect(await extractPdfText(new Uint8Array(bytes))).toContain("LEO sample portfolio");

    const form = new FormData();
    form.set("title", "");
    form.set("file", new File([bytes], "resume.pdf", { type: "application/pdf" }));
    const res = await createPortfolio(req("/api/portfolios", { body: form }), {});
    expect(res.status).toBe(201);
    const { portfolio } = (await res.json()) as { portfolio: { id: string; title: string } };
    expect(portfolio.title).toBe("resume");
    const stored = await prisma.portfolio.findUniqueOrThrow({ where: { id: portfolio.id } });
    expect(stored.content).toContain("Built a Node API");

    const bad = new FormData();
    bad.set("file", new File([new Uint8Array([1, 2, 3])], "x.pdf", { type: "application/pdf" }));
    expect((await createPortfolio(req("/api/portfolios", { body: bad }), {})).status).toBe(400);
  });

  it("requires a portfolio for the portfolio theme and rejects foreign portfolios", async () => {
    const none = await createConversation(
      req("/api/conversations", { json: { kind: "call", theme: "portfolio" } }),
      {},
    );
    expect(none.status).toBe(400);
    const other = await prisma.user.create({
      data: { email: `op-${Date.now()}@t.local`, name: "o", passwordHash: "x" },
    });
    const foreign = await prisma.portfolio.create({
      data: { userId: other.id, title: "theirs", content: "secret" },
    });
    const res = await createConversation(
      req("/api/conversations", {
        json: { kind: "call", theme: "portfolio", portfolioId: foreign.id },
      }),
      {},
    );
    expect(res.status).toBe(404);
  });

  it("refuses to delete a portfolio used by a live call, then allows it after the call ends", async () => {
    const created = await createPortfolio(
      req("/api/portfolios", { json: { title: "In use", content: "Project Z" } }),
      {},
    );
    const { portfolio } = (await created.json()) as { portfolio: { id: string } };
    const conv = await createConversation(
      req("/api/conversations", {
        json: { kind: "call", theme: "portfolio", portfolioId: portfolio.id, durationMin: 10 },
      }),
      {},
    );
    expect(conv.status).toBe(201);
    const { conversation } = (await conv.json()) as { conversation: { id: string } };
    const blocked = await deletePortfolio(
      req(`/api/portfolios/${portfolio.id}`, { method: "DELETE" }),
      ctx(portfolio.id),
    );
    expect(blocked.status).toBe(409);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { endedAt: new Date() },
    });
    const ok = await deletePortfolio(
      req(`/api/portfolios/${portfolio.id}`, { method: "DELETE" }),
      ctx(portfolio.id),
    );
    expect(ok.status).toBe(200);
  });

  it("places the portfolio in a fixed system block for caching", () => {
    expect(buildPortfolioBlock("X")).toMatch(/^Candidate portfolio/);
  });
});

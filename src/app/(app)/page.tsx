import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { common, home } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { formatDateTime } from "@/lib/format";

export default async function HomePage() {
  const user = await requireUser();
  const recent = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { report: { select: { id: true } }, _count: { select: { messages: true } } },
  });
  return (
    <>
      <h1>{home.greeting(user.name)}</h1>
      <p className="muted">{home.intro}</p>
      <div className="row" style={{ margin: "16px 0" }}>
        <Link className="btn btn-primary" href="/call">
          {home.startCall}
        </Link>
        <Link className="btn" href="/chat">
          {home.startChat}
        </Link>
      </div>
      <h2>{home.recentTitle}</h2>
      {recent.length === 0 ? (
        <p className="muted">{home.recentEmpty}</p>
      ) : (
        <ul className="list">
          {recent.map((c) => (
            <li key={c.id} className="list-item">
              <Link href={c.report ? `/history/${c.id}/report` : c.kind === "chat" ? `/chat/${c.id}` : `/history/${c.id}`}>
                {c.kind === "call" ? common.callLabel : common.chatLabel} · {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme}
                {c.title ? ` · ${c.title}` : ""}
              </Link>
              <span className="muted">
                {formatDateTime(c.updatedAt)} · {common.messagesCount(c._count.messages)}
                {c.report ? ` · ${common.hasReport}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

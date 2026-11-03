import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
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
      <h1>안녕하세요, {user.name}님</h1>
      <p className="muted">개발자 해외 취업용 영어 회화 연습. 오늘은 무엇을 해 볼까요?</p>
      <div className="row" style={{ margin: "16px 0" }}>
        <Link className="btn btn-primary" href="/call">
          📞 전화 영어 시작
        </Link>
        <Link className="btn" href="/chat">
          💬 채팅 시작
        </Link>
      </div>
      <h2>최근 활동</h2>
      {recent.length === 0 ? (
        <p className="muted">아직 기록이 없습니다. 전화 영어나 채팅을 시작해 보세요.</p>
      ) : (
        <ul className="list">
          {recent.map((c) => (
            <li key={c.id} className="list-item">
              <Link href={c.report ? `/history/${c.id}/report` : c.kind === "chat" ? `/chat/${c.id}` : `/history/${c.id}`}>
                {c.kind === "call" ? "📞" : "💬"} {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme}
                {c.title ? ` · ${c.title}` : ""}
              </Link>
              <span className="muted">
                {formatDateTime(c.updatedAt)} · 메시지 {c._count.messages}개{c.report ? " · 리포트 있음" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import { randomUUID } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { acquireWorkLease, assertWorkLease } from "@/lib/work-lease";
import { enqueueReport, recoverInterruptedReports, reportJobState } from "@/services/report";
import { getClaudeProvider } from "@/services/claude";

afterEach(() => vi.restoreAllMocks());
async function fixture() {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, name: "lease", passwordHash: "unused", provisioned: true } });
  const conv = await prisma.conversation.create({ data: { userId: user.id, kind: "chat", theme: "free", messages: { create: { role: "user", content: "I go there yesterday.", index: 0 } } } });
  return { user, conv };
}
it("rejects concurrent claims and fences expired workers without releasing their successor", async () => {
  const key = `test:${randomUUID()}`;
  const original = await acquireWorkLease(key);
  await expect(acquireWorkLease(key)).rejects.toMatchObject({ code: "conversation_busy" });
  await prisma.workLease.update({ where: { key }, data: { expiresAt: new Date(0) } });
  const successor = await acquireWorkLease(key);
  try {
    await expect(assertWorkLease(original)).rejects.toMatchObject({ code: "work_interrupted" });
    await original.release();
    await expect(assertWorkLease(successor)).resolves.toBeUndefined();
  } finally { await original.release(); await successor.release(); }
});
it("a new process leaves the previous process's active report intact and does not call AI twice", async () => {
  const { user, conv } = await fixture();
  const provider = getClaudeProvider();
  const original = provider.generateReport.bind(provider);
  let finish!: () => void;
  const wait = new Promise<void>((resolve) => { finish = resolve; });
  const generate = vi.spyOn(provider, "generateReport").mockImplementation(async (input) => { await wait; return original(input); });
  try {
    await enqueueReport(user.id, conv.id);
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    await recoverInterruptedReports(true);
    expect((await reportJobState(user.id, conv.id))?.status).toBe("generating");
    await enqueueReport(user.id, conv.id);
    expect(generate).toHaveBeenCalledTimes(1);
  } finally { finish(); }
  await vi.waitFor(async () => expect((await reportJobState(user.id, conv.id))?.status).toBe("complete"));
});
it("marks abandoned reports as failed without automatically repeating paid work", async () => {
  const { user, conv } = await fixture();
  const generate = vi.spyOn(getClaudeProvider(), "generateReport");
  await prisma.reportJob.create({ data: { conversationId: conv.id, userId: user.id, status: "generating", leaseToken: "dead-process" } });
  await recoverInterruptedReports(true);
  expect((await reportJobState(user.id, conv.id))?.status).toBe("failed");
  expect(generate).not.toHaveBeenCalled();
});

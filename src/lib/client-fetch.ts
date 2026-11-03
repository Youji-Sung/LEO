// 클라이언트 컴포넌트용 API 응답 오류 메시지 추출
export async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    if (data.error?.message) return data.error.message;
  } catch {
    // 본문이 JSON 이 아님
  }
  return `요청이 실패했습니다 (${res.status}).`;
}

export async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

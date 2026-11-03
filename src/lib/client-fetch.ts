export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 응답 본문의 {error:{message,code}} 를 ApiError 로 바꾼다.
export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const data = (await res.json()) as { error?: { message?: string; code?: string } };
    if (data.error?.message)
      return new ApiError(data.error.message, res.status, data.error.code ?? null);
  } catch {
    // 본문이 JSON 이 아님
  }
  return new ApiError(`요청이 실패했습니다 (${res.status}).`, res.status, null);
}

export async function readError(res: Response): Promise<string> {
  return (await toApiError(res)).message;
}

export async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

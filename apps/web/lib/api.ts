const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export { API_BASE, WS_BASE };

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: extraHeaders, body, ...restOptions } = options ?? {};
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    body,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(extraHeaders as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

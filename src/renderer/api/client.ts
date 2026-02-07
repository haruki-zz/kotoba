const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8787/api';

type ApiErrorShape = { message?: string };

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorShape;
      if (body?.message) message = body.message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export { API_BASE };

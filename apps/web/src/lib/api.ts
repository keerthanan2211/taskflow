import { useAuth } from './auth-store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper: adds the JWT, parses JSON, and turns API errors into readable messages. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    useAuth.getState().logout();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
    throw new ApiError(res.status, message ?? 'Something went wrong. Check your connection and try again.');
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

export const json = (data: unknown) => JSON.stringify(data);

import type { Refund } from "./types";
import type { ApiErrorResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4010";

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const err = data as ApiErrorResponse | undefined;
    const message = err?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function listRefunds(params?: { paymentId?: string; orderId?: string }): Promise<Refund[]> {
  const url = new URL("/refunds", API_BASE_URL);
  if (params?.paymentId) url.searchParams.set("paymentId", params.paymentId);
  if (params?.orderId) url.searchParams.set("orderId", params.orderId);

  const res = await fetch(url.toString());
  const data = (await handleResponse<Refund[]>(res)) || [];
  return data;
}


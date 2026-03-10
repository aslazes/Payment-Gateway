import type { Payment, ApiErrorResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4010";

type ApiPaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";

interface ApiPayment {
  paymentId: string;
  orderId: string;
  status: ApiPaymentStatus;
  amount: number;
  currency: string;
  redirectUrl?: string | null;
}

function mapStatus(status: ApiPaymentStatus): Payment["status"] {
  if (status === "SUCCEEDED") return "SUCCESS";
  if (status === "FAILED") return "FAILED";
  return "PENDING";
}

function mapPayment(api: ApiPayment): Payment {
  return {
    paymentId: api.paymentId,
    orderId: api.orderId,
    amount: api.amount,
    currency: api.currency,
    status: mapStatus(api.status),
    // Prism может не отдавать эти поля — для демо можно будет дополнить,
    // но здесь они остаются опциональными.
  };
}

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

export async function listPayments(params?: { orderId?: string; customerId?: string }): Promise<Payment[]> {
  const url = new URL("/payments", API_BASE_URL);
  if (params?.orderId) url.searchParams.set("orderId", params.orderId);
  if (params?.customerId) url.searchParams.set("customerId", params.customerId);

  const res = await fetch(url.toString());
  const data = (await handleResponse<ApiPayment[]>(res)) || [];
  return data.map(mapPayment);
}

export async function getPayment(paymentId: string): Promise<Payment> {
  const res = await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(paymentId)}`);
  const data = await handleResponse<ApiPayment>(res);
  return mapPayment(data);
}


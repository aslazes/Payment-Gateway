import type { Refund, StatusEvent } from "@/api/types";

// История статусов привязана к событиям payment_created / payment_succeeded / payment_failed.
export const mockPaymentHistory: Record<string, StatusEvent[]> = {
  "pay_abc123": [
    {
      status: "CREATED",
      timestamp: "2026-03-10T10:15:25Z",
      details: "Payment initiated by merchant (POST /payments)",
    },
    {
      status: "PENDING",
      timestamp: "2026-03-10T10:15:30Z", // occurredAt payment_created
      details: "Payment sent to external provider (payment_created event)",
    },
    {
      status: "SUCCESS",
      timestamp: "2026-03-10T10:16:40Z", // completedAt payment_succeeded
      details: "Provider confirmed payment (payment_succeeded event)",
    },
  ],
  "pay_def456": [
    {
      status: "CREATED",
      timestamp: "2026-03-10T10:16:05Z",
      details: "Payment initiated by merchant (POST /payments)",
    },
    {
      status: "PENDING",
      timestamp: "2026-03-10T10:16:10Z",
      details: "Payment sent to external provider",
    },
    {
      status: "FAILED",
      timestamp: "2026-03-10T10:16:12Z", // occurredAt payment_failed
      details: "Payment failed: CARD_DECLINED (payment_failed event)",
    },
  ],
};

// Метрики дашборда теперь считаются на основе реальных данных Prism
// (см. логику в компоненте Dashboard). Здесь ничего не экспортируется.

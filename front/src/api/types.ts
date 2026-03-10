export type PaymentStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED";

export type RefundStatus = "REQUESTED" | "PROCESSING" | "REFUNDED" | "FAILED";

// Модель платежа для UI. Некоторые поля могут быть недоступны в Prism и будут undefined.
export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

export interface Refund {
  refundId: string;
  paymentId: string;
  orderId?: string;
  amount: number;
  currency?: string;
  status: RefundStatus;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusEvent {
  status: string;
  timestamp: string;
  details?: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}


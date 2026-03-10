import type { PaymentStatus, RefundStatus } from "@/api/types";

const statusConfig: Record<string, { className: string }> = {
  SUCCESS: { className: "bg-success/15 text-success border-success/30" },
  REFUNDED: { className: "bg-success/15 text-success border-success/30" },
  FAILED: { className: "bg-destructive/15 text-destructive border-destructive/30" },
  PENDING: { className: "bg-warning/15 text-warning border-warning/30" },
  PROCESSING: { className: "bg-warning/15 text-warning border-warning/30" },
  CREATED: { className: "bg-muted text-muted-foreground border-border" },
  REQUESTED: { className: "bg-primary/10 text-primary border-primary/30" },
};

export default function StatusBadge({ status }: { status: PaymentStatus | RefundStatus }) {
  const config = statusConfig[status] || statusConfig.CREATED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium border ${config.className}`}>
      {status}
    </span>
  );
}

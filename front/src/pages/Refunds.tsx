import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { RefundStatus } from "@/api/types";
import { listRefunds } from "@/api/refund-api";
import StatusBadge from "@/components/StatusBadge";

const STATUSES: (RefundStatus | "ALL")[] = ["ALL", "REQUESTED", "PROCESSING", "REFUNDED", "FAILED"];

export default function Refunds() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "ALL">("ALL");

  const { data: refunds = [], isLoading, isError, error } = useQuery({
    queryKey: ["refunds"],
    queryFn: () => listRefunds(),
  });

  const filtered = useMemo(() => {
    return refunds.filter((r) => statusFilter === "ALL" || r.status === statusFilter);
  }, [refunds, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-border">
        <h1 className="text-lg font-mono font-bold">Refunds</h1>
        <span className="text-xs text-muted-foreground font-mono">{filtered.length} results</span>
      </header>

      <div className="px-8 py-4 border-b border-border flex items-center gap-4">
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-mono font-medium border transition-colors ${
                statusFilter === s
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground font-mono">Loading refunds from Prism...</p>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-destructive font-mono">
              Failed to load refunds: {(error as Error).message}
            </p>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground font-mono sticky top-0 bg-background">
              <th className="text-left px-8 py-3 font-medium">Refund ID</th>
              <th className="text-left px-4 py-3 font-medium">Payment ID</th>
              <th className="text-left px-4 py-3 font-medium">Order ID</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Reason</th>
              <th className="text-left px-8 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.refundId} className="border-b border-border hover:bg-accent/50 transition-colors">
                <td className="px-8 py-3.5 text-sm font-mono text-foreground">{r.refundId}</td>
                <td
                  className="px-4 py-3.5 text-sm font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => navigate(`/payments/${r.paymentId}`)}
                >
                  {r.paymentId}
                </td>
                <td className="px-4 py-3.5 text-sm font-mono text-muted-foreground">{r.orderId ?? "—"}</td>
                <td className="px-4 py-3.5 text-sm font-mono text-foreground text-right">€{r.amount.toFixed(2)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{r.reason ?? "—"}</td>
                <td className="px-8 py-3.5 text-xs font-mono text-muted-foreground">
                  {r.createdAt
                    ? `${new Date(r.createdAt).toLocaleDateString("en-GB")} ${new Date(r.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

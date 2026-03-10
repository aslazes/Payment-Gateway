import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PaymentStatus } from "@/api/types";
import { listPayments } from "@/api/payment-api";
import StatusBadge from "@/components/StatusBadge";
import { Search } from "lucide-react";

const STATUSES: (PaymentStatus | "ALL")[] = ["ALL", "CREATED", "PENDING", "SUCCESS", "FAILED"];
const PAGE_SIZE = 5;

export default function Payments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data: payments = [], isLoading, isError, error } = useQuery({
    queryKey: ["payments"],
    queryFn: () => listPayments(),
  });

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        !search ||
        p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
        p.orderId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-border">
        <h1 className="text-lg font-mono font-bold">Payments</h1>
        <span className="text-xs text-muted-foreground font-mono">{filtered.length} results</span>
      </header>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-border flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by paymentId, orderId, customerId..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
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

      {/* Loading / error states */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-mono">Loading payments from Prism...</p>
        </div>
      )}
      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive font-mono">
            Failed to load payments: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground font-mono sticky top-0 bg-background">
              <th className="text-left px-8 py-3 font-medium">Payment ID</th>
              <th className="text-left px-4 py-3 font-medium">Order ID</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-8 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr
                key={p.paymentId}
                className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/payments/${p.paymentId}`)}
              >
                <td className="px-8 py-3.5 text-sm font-mono text-primary">{p.paymentId}</td>
                <td className="px-4 py-3.5 text-sm font-mono text-foreground">{p.orderId}</td>
                {/* customerId и описание не приходят из Prism — пока опциональны */}
                <td className="px-4 py-3.5 text-sm font-mono text-foreground text-right">€{p.amount.toFixed(2)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                  {p.createdAt
                    ? `${new Date(p.createdAt).toLocaleDateString("en-GB")} ${new Date(p.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                    : "—"}
                </td>
                <td className="px-8 py-3.5 text-sm text-muted-foreground truncate max-w-[200px]">
                  {p.description ?? "—"}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-8 py-12 text-center text-muted-foreground text-sm">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-8 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-xs font-mono border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-xs font-mono border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

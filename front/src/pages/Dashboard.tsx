import { useQuery } from "@tanstack/react-query";
import { listPayments } from "@/api/payment-api";
import StatusBadge from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { data: payments = [], isLoading, isError } = useQuery({
    queryKey: ["payments"],
    queryFn: () => listPayments(),
  });

  const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const createdCount = payments.filter((p) => p.status === "CREATED").length;
  const totalCount = payments.length;
  const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;

  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-border">
        <h1 className="text-lg font-mono font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </header>

      {/* Metrics — 3 dominant numbers */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        <div className="grid grid-cols-3 gap-8 mb-16">
          <MetricSlab
            label="Today's Volume (Prism)"
            value={`€${totalVolume.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
          />
          <MetricSlab label="Success Rate" value={`${successRate}%`} bar={successRate} />
          <MetricSlab label="Active Refunds (demo)" value={"—"} accent />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <StatBlock label="Total" value={totalCount} />
          <StatBlock label="Success" value={successCount} color="text-success" />
          <StatBlock label="Failed" value={failedCount} color="text-destructive" />
          <StatBlock label="Pending" value={pendingCount} color="text-warning" />
        </div>

        {/* Recent transactions */}
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-mono font-semibold">Recent Transactions</h2>
            <button
              onClick={() => navigate("/payments")}
              className="text-xs text-primary font-medium hover:underline"
            >
              View All Payments
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground font-mono">
                <th className="text-left px-6 py-3 font-medium">Payment ID</th>
                <th className="text-left px-6 py-3 font-medium">Order</th>
                <th className="text-right px-6 py-3 font-medium">Amount</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-sm text-muted-foreground font-mono">
                    Loading payments from Prism...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-sm text-destructive font-mono">
                    Failed to load payments
                  </td>
                </tr>
              )}
              {!isLoading && !isError && payments.slice(0, 5).map((p) => (
                <tr
                  key={p.paymentId}
                  className="border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/payments/${p.paymentId}`)}
                >
                  <td className="px-6 py-3 text-sm font-mono text-primary">{p.paymentId}</td>
                  <td className="px-6 py-3 text-sm font-mono text-foreground">{p.orderId}</td>
                  <td className="px-6 py-3 text-sm font-mono text-foreground text-right">
                    €{p.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground font-mono">
                    {new Date(p.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricSlab({ label, value, bar, accent }: { label: string; value: string; bar?: number; accent?: boolean }) {
  return (
    <div className="border border-border bg-card px-8 py-10">
      <p className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wider mb-4">{label}</p>
      <p className={`text-5xl font-mono font-bold tracking-tight ${accent ? "text-warning" : "text-foreground"}`}>
        {value}
      </p>
      {bar !== undefined && (
        <div className="mt-4 h-1.5 bg-muted w-full">
          <div className="h-full bg-success transition-all" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="border border-border bg-card px-6 py-5">
      <p className="text-xs text-muted-foreground font-sans font-medium mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPayment } from "@/api/payment-api";
import { listRefunds } from "@/api/refund-api";
import { mockPaymentHistory } from "@/data/mock-data";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft } from "lucide-react";

export default function PaymentDetail() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const {
    data: payment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payment", paymentId],
    enabled: Boolean(paymentId),
    queryFn: () => getPayment(paymentId as string),
  });

  const history = paymentId ? mockPaymentHistory[paymentId] : undefined;

  const {
    data: relatedRefunds = [],
  } = useQuery({
    queryKey: ["refunds", paymentId],
    enabled: Boolean(paymentId),
    queryFn: () => listRefunds({ paymentId: paymentId as string }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground font-mono text-sm">Loading payment from Prism...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive font-mono text-sm">
          Failed to load payment: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground font-mono text-sm">Payment not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 shrink-0 flex items-center gap-4 px-8 border-b border-border">
        <button onClick={() => navigate("/payments")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-mono font-bold">{payment.paymentId}</h1>
        <StatusBadge status={payment.status} />
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Payment info */}
        <div className="border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-mono font-semibold">Payment Details</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            <InfoCell label="Payment ID" value={payment.paymentId} mono />
            <InfoCell label="Order ID" value={payment.orderId} mono />
            <InfoCell label="Customer ID" value={payment.customerId ?? "—"} mono />
            <InfoCell label="Amount" value={`€${payment.amount.toFixed(2)}`} mono />
            <InfoCell label="Currency" value={payment.currency} />
            <InfoCell label="Status" value={payment.status} badge />
            <InfoCell
              label="Created"
              value={payment.createdAt ? new Date(payment.createdAt).toLocaleString("en-GB") : "—"}
            />
            <InfoCell
              label="Updated"
              value={payment.updatedAt ? new Date(payment.updatedAt).toLocaleString("en-GB") : "—"}
            />
            <InfoCell label="Description" value={payment.description ?? "—"} />
          </div>
        </div>

        {/* Status history */}
        <div className="border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-mono font-semibold">Status History</h2>
          </div>
          {history ? (
            <div className="px-6 py-4 space-y-4">
              {history.map((event, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${
                      event.status === "SUCCESS" ? "bg-success" :
                      event.status === "FAILED" ? "bg-destructive" :
                      event.status === "PENDING" ? "bg-warning" : "bg-muted-foreground"
                    }`} />
                    {i < history.length - 1 && <div className="w-px h-8 bg-border mt-1" />}
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">{event.status}</p>
                    <p className="text-xs text-muted-foreground">{event.details}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {new Date(event.timestamp).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-4 text-sm text-muted-foreground">No history available for this payment.</p>
          )}
        </div>

        {/* Related refunds */}
        {relatedRefunds.length > 0 && (
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-mono font-semibold">Related Refunds</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground font-mono">
                  <th className="text-left px-6 py-3 font-medium">Refund ID</th>
                  <th className="text-right px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {relatedRefunds.map((r) => (
                  <tr key={r.refundId} className="border-b border-border last:border-b-0">
                    <td className="px-6 py-3 text-sm font-mono text-primary">{r.refundId}</td>
                    <td className="px-6 py-3 text-sm font-mono text-foreground text-right">€{r.amount.toFixed(2)}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {payment.status === "SUCCESS" && (
            <button className="px-4 py-2 text-sm font-medium border border-primary text-primary hover:bg-primary/10 transition-colors">
              Request Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="bg-card px-6 py-4">
      <p className="text-xs text-muted-foreground font-sans mb-1">{label}</p>
      {badge ? (
        <StatusBadge status={value as any} />
      ) : (
        <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
      )}
    </div>
  );
}

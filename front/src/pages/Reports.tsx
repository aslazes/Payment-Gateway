import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPayments } from "@/api/payment-api";
import { listRefunds } from "@/api/refund-api";
import { Download } from "lucide-react";

type ReportType = "payments" | "refunds";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("payments");
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => listPayments(),
  });
  const { data: refunds = [] } = useQuery({
    queryKey: ["refunds"],
    queryFn: () => listRefunds(),
  });

  const exportCSV = () => {
    let csv = "";
    if (reportType === "payments") {
      csv = "paymentId,orderId,customerId,amount,currency,status,createdAt,description\n";
      csv += payments
        .map((p) => `${p.paymentId},${p.orderId},${p.customerId ?? ""},${p.amount},${p.currency},${p.status},${p.createdAt ?? ""},"${p.description ?? ""}"`)
        .join("\n");
    } else {
      csv = "refundId,paymentId,orderId,amount,currency,status,reason,createdAt\n";
      csv += refunds
        .map((r) => `${r.refundId},${r.paymentId},${r.orderId},${r.amount},${r.currency},${r.status},"${r.reason}",${r.createdAt}`)
        .join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const data = reportType === "payments" ? payments : refunds;

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-border">
        <h1 className="text-lg font-mono font-bold">Reports</h1>
      </header>

      <div className="px-8 py-4 border-b border-border flex items-center justify-between">
        <div className="flex gap-1">
          {(["payments", "refunds"] as ReportType[]).map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-3 py-1.5 text-xs font-mono font-medium border capitalize transition-colors ${
                reportType === t
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-mono font-semibold capitalize">{reportType} Report Preview</h2>
              <p className="text-xs text-muted-foreground mt-1">{data.length} records</p>
            </div>
            <div className="p-6">
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
                {JSON.stringify(data.slice(0, 3), null, 2)}
              </pre>
              {data.length > 3 && (
                <p className="text-xs text-muted-foreground mt-4 font-mono">
                  ... and {data.length - 3} more records. Export CSV for full data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

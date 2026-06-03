import { useGetPortalBalance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default function PortalBalance() {
  const { data: balance, isLoading } = useGetPortalBalance();

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-bold">رصيدي وفواتيري</h2>
        <p className="text-muted-foreground text-sm">ملخص حسابك المالي</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الفواتير", value: balance?.totalInvoiced, color: "text-primary", icon: DollarSign },
          { label: "المدفوع", value: balance?.totalPaid, color: "text-green-400", icon: CheckCircle2 },
          { label: "المستحق", value: balance?.balanceDue, color: Number(balance?.balanceDue ?? 0) > 0 ? "text-destructive" : "text-green-400", icon: AlertCircle },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className={`text-xl font-bold font-mono ${s.color}`}>{Number(s.value ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {balance?.overdueInvoices && balance.overdueInvoices.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">الفواتير غير المدفوعة</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(balance.overdueInvoices as any[]).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="font-mono text-sm font-bold text-primary">{inv.invoiceNumber}</span>
                    <p className="text-xs text-muted-foreground">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-destructive">{Number(inv.balanceDue).toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">غير مدفوع</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useGetInvoices, getGetInvoicesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

const PAY_CONFIG: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  pending: { label: "غير مدفوع", class: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertCircle },
  partial: { label: "جزئي", class: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Clock },
  paid: { label: "مدفوع", class: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle },
};

export default function Invoices() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const params = statusFilter ? { status: statusFilter } : {};
  const { data, isLoading } = useGetInvoices(params, { query: { queryKey: getGetInvoicesQueryKey(params) } });
  const invoices = data?.data ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الفواتير</h2>
          <p className="text-muted-foreground">إدارة الفواتير والمدفوعات ({data?.total ?? 0})</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" data-testid="select-invoice-filter"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الحالات</SelectItem>
            <SelectItem value="pending">غير مدفوع</SelectItem>
            <SelectItem value="partial">جزئي</SelectItem>
            <SelectItem value="paid">مدفوع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا توجد فواتير</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const pc = PAY_CONFIG[inv.paymentStatus ?? "pending"] ?? PAY_CONFIG.pending;
            const PcIcon = pc.icon;
            return (
              <Card key={inv.id} data-testid={`card-invoice-${inv.id}`} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/invoices/${inv.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{inv.invoiceNumber}</span>
                        <Badge className={`${pc.class} border text-xs`}><PcIcon className="h-3 w-3 ml-1" />{pc.label}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-0.5">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground">{inv.vehicleInfo}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold font-mono text-lg">{Number(inv.total).toLocaleString()} <span className="text-sm text-muted-foreground">{inv.currency}</span></p>
                      {Number(inv.balanceDue) > 0 && <p className="text-sm text-destructive">متبقي: {Number(inv.balanceDue).toLocaleString()}</p>}
                      <p className="text-xs text-muted-foreground">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("ar-SA") : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

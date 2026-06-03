import { useParams, useLocation } from "wouter";
import { useGetPortalOrder, usePortalApproveOrder, getGetPortalOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  diagnosing: { label: "قيد الفحص", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  waiting_approval: { label: "انتظار موافقة", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  waiting_parts: { label: "انتظار قطع", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ready: { label: "جاهز للاستلام", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const STAGES = ["received", "diagnosing", "waiting_approval", "in_progress", "waiting_parts", "ready", "delivered"];

export default function PortalOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const orderId = Number(id);

  const { data: order, isLoading } = useGetPortalOrder(orderId, { query: { queryKey: getGetPortalOrderQueryKey(orderId) } });
  const approveMutation = usePortalApproveOrder();

  const handleApproval = (approved: boolean) => {
    approveMutation.mutate({ id: orderId, data: { approved } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetPortalOrderQueryKey(orderId) });
        toast({ title: approved ? "تمت الموافقة على الطلب" : "تم رفض الطلب" });
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!order) return <p className="text-center text-muted-foreground py-20">الطلب غير موجود</p>;

  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.received;
  const currentIdx = STAGES.indexOf(order.status);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/portal/orders")}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            <Badge className={`${st.class} border text-xs`}>{st.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{order.vehicleMake} {order.vehicleModel} — {order.vehiclePlate}</p>
        </div>
      </div>

      {/* Progress stepper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {STAGES.map((s, i) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = order.status === s;
              const isPast = currentIdx > i;
              return (
                <div key={s} className="flex items-center flex-col gap-1 min-w-0 shrink-0">
                  <div className={`h-3 w-3 rounded-full transition-colors ${isActive ? "bg-primary" : isPast ? "bg-muted-foreground" : "bg-muted"}`} />
                  <span className={`text-xs text-center whitespace-nowrap ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{cfg.label}</span>
                  {i < STAGES.length - 1 && <div className="h-0.5 w-4 absolute" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Waiting Approval Action */}
      {order.status === "waiting_approval" && order.customerApproved === null && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <p className="font-medium mb-1">الورشة تنتظر موافقتك</p>
            {order.diagnosisNotes && <p className="text-sm text-muted-foreground mb-3">{order.diagnosisNotes}</p>}
            <div className="flex gap-2">
              <Button onClick={() => handleApproval(true)} disabled={approveMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700" data-testid="button-approve-order">
                <CheckCircle2 className="h-4 w-4 ml-1" />أوافق
              </Button>
              <Button onClick={() => handleApproval(false)} disabled={approveMutation.isPending} variant="destructive" className="flex-1" data-testid="button-reject-order">
                <XCircle className="h-4 w-4 ml-1" />أرفض
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order.customerComplaint && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">شكواك</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.customerComplaint}</p></CardContent>
        </Card>
      )}

      {order.workDescription && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">العمل المنفذ</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.workDescription}</p></CardContent>
        </Card>
      )}

      {(order.services ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">الخدمات</CardTitle></CardHeader>
          <CardContent>
            {(order.services as any[]).map((s: any) => (
              <div key={s.id} className="flex justify-between py-1.5 border-b border-border/50 last:border-0 text-sm">
                <span>{s.serviceNameAr}</span>
                <span className="font-mono">{Number(s.totalPrice).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {order.invoice && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="font-medium mb-2">الفاتورة</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span className="font-mono font-bold">{Number((order.invoice as any).total).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المدفوع</span><span className="font-mono text-green-400">{Number((order.invoice as any).totalPaid).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المتبقي</span><span className={`font-mono ${Number((order.invoice as any).balanceDue) > 0 ? "text-destructive" : "text-green-400"}`}>{Number((order.invoice as any).balanceDue).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

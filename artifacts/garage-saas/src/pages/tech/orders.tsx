import { useLocation } from "wouter";
import { useGetOrders, useUpdateOrderStatus, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Car, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  diagnosing: { label: "قيد الفحص", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  waiting_approval: { label: "انتظار موافقة", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  waiting_parts: { label: "انتظار قطع", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ready: { label: "جاهز", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const NEXT_STATUS: Record<string, string> = {
  received: "diagnosing",
  diagnosing: "waiting_approval",
  waiting_approval: "in_progress",
  in_progress: "ready",
};

const NEXT_LABEL: Record<string, string> = {
  received: "بدء الفحص",
  diagnosing: "إرسال للموافقة",
  waiting_approval: "بدء التنفيذ",
  in_progress: "تم الإصلاح",
};

export default function TechOrders() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = user?.id ? { technicianId: user.id } : {};
  const { data, isLoading } = useGetOrders(params as any, { query: { queryKey: getGetOrdersQueryKey(params as any) } });
  const statusMutation = useUpdateOrderStatus();

  const orders = (data?.data ?? []).filter(o => !["delivered", "cancelled"].includes(o.status));

  const handleAdvance = (id: number, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    statusMutation.mutate({ id, data: { status: next } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetOrdersQueryKey(params as any) }); toast({ title: "تم تحديث الحالة" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-bold">ورشتي</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.fullName}</span>
            <Button variant="ghost" size="sm" onClick={logout}>خروج</Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold">طلباتي النشطة</h2>
          <p className="text-sm text-muted-foreground">{orders.length} طلب</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Car className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">لا توجد طلبات نشطة</p>
            <p className="text-sm text-muted-foreground">ستظهر هنا الطلبات المسندة إليك</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.received;
              const nextAction = NEXT_LABEL[o.status];
              return (
                <Card key={o.id} className="cursor-pointer" onClick={() => setLocation(`/orders/${o.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-primary">{o.orderNumber}</span>
                        <p className="font-medium mt-0.5">{o.customerName}</p>
                        <p className="text-sm text-muted-foreground">{o.vehicleMake} {o.vehicleModel} — {o.vehiclePlate}</p>
                        {o.customerComplaint && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{o.customerComplaint}</p>}
                      </div>
                      <Badge className={`${st.class} border text-xs shrink-0`}>{st.label}</Badge>
                    </div>
                    {nextAction && (
                      <Button size="sm" className="mt-3 w-full" onClick={e => handleAdvance(o.id, o.status, e)} disabled={statusMutation.isPending}>
                        {nextAction}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

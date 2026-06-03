import { useLocation } from "wouter";
import { useGetPortalOrders } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, ChevronLeft } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  diagnosing: { label: "قيد الفحص", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  waiting_approval: { label: "انتظار موافقة", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  waiting_parts: { label: "انتظار قطع", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ready: { label: "جاهز للاستلام", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  cancelled: { label: "ملغي", class: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function PortalOrders() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = useGetPortalOrders();

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-xl font-bold">طلباتي</h2>
        <p className="text-muted-foreground text-sm">جميع طلبات الصيانة</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !orders?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => {
            const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.received;
            return (
              <Card key={o.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setLocation(`/portal/orders/${o.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-primary text-sm">{o.orderNumber}</span>
                    <p className="text-sm text-muted-foreground">{o.vehicleMake} {o.vehicleModel} — {o.vehiclePlate}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.grandTotal && <span className="font-mono text-sm font-medium">{Number(o.grandTotal).toLocaleString()}</span>}
                    <Badge className={`${st.class} border text-xs`}>{st.label}</Badge>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
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

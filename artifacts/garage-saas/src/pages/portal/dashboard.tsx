import { useLocation } from "wouter";
import { useGetPortalMe, useGetPortalOrders, useGetPortalVehicles, useGetPortalBalance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, ClipboardList, DollarSign, ChevronLeft } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  diagnosing: { label: "قيد الفحص", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  waiting_approval: { label: "انتظار موافقة", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  waiting_parts: { label: "انتظار قطع", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ready: { label: "جاهز للاستلام", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const { data: me } = useGetPortalMe();
  const { data: orders, isLoading: ordersLoading } = useGetPortalOrders();
  const { data: vehicles, isLoading: vehiclesLoading } = useGetPortalVehicles();
  const { data: balance } = useGetPortalBalance();

  const activeOrders = (orders ?? []).filter(o => !["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">مرحباً، {me?.fullName ?? "..."}</h2>
        <p className="text-muted-foreground">هذه نظرة عامة على حسابك</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Car className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{vehicles?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">مركبة مسجلة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-indigo-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{activeOrders.length}</p>
              <p className="text-xs text-muted-foreground">طلب نشط</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className={`h-8 w-8 shrink-0 ${Number(balance?.balanceDue ?? 0) > 0 ? "text-destructive" : "text-green-400"}`} />
            <div>
              <p className="text-2xl font-bold font-mono">{Number(balance?.balanceDue ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">مستحق</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">الطلبات النشطة</h3>
          <div className="space-y-2">
            {activeOrders.map(o => {
              const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.received;
              return (
                <Card key={o.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setLocation(`/portal/orders/${o.id}`)} data-testid={`card-portal-order-${o.id}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-primary text-sm">{o.orderNumber}</span>
                      <p className="text-sm text-muted-foreground">{o.vehicleMake} {o.vehicleModel} — {o.vehiclePlate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${st.class} border text-xs`}>{st.label}</Badge>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Vehicles */}
      <div>
        <h3 className="text-base font-semibold mb-3">مركباتي</h3>
        {vehiclesLoading ? <Skeleton className="h-24 w-full rounded-xl" /> : !vehicles?.length ? (
          <p className="text-sm text-muted-foreground">لا توجد مركبات مسجلة</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map(v => (
              <Card key={v.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setLocation(`/portal/vehicles/${v.id}`)} data-testid={`card-portal-vehicle-${v.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-bold font-mono text-primary">{v.plateNumber}</p>
                      <p className="text-sm">{v.make} {v.model} {v.year}</p>
                    </div>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

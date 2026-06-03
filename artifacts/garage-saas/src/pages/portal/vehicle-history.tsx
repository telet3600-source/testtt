import { useParams, useLocation } from "wouter";
import { useGetPortalVehicleHistory, getGetPortalVehicleHistoryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Car, ClipboardList, Gauge } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { received: "مستلم", diagnosing: "قيد الفحص", in_progress: "قيد التنفيذ", ready: "جاهز", delivered: "تم التسليم", cancelled: "ملغي" };

export default function PortalVehicleHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetPortalVehicleHistory(Number(id), { query: { queryKey: getGetPortalVehicleHistoryQueryKey(Number(id)) } });

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!data) return <p className="text-center text-muted-foreground py-20">المركبة غير موجودة</p>;

  const { vehicle, orders } = data;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/portal/vehicles")}><ArrowRight className="h-4 w-4" /></Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold font-mono text-primary">{vehicle.plateNumber}</p>
            <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} {vehicle.year}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "الشركة", value: vehicle.make },
          { label: "الموديل", value: vehicle.model },
          { label: "السنة", value: vehicle.year },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-3"><p className="font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" />تاريخ الصيانة ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          {!orders.length ? <p className="text-sm text-muted-foreground">لا يوجد سجل صيانة</p> : (
            <div className="space-y-2">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="font-mono text-sm font-bold text-primary">{o.orderNumber}</span>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.grandTotal && <span className="font-mono text-sm">{Number(o.grandTotal).toLocaleString()}</span>}
                    <Badge variant="outline" className="text-xs">{STATUS_LABELS[o.status] ?? o.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

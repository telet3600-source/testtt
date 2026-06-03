import { useLocation } from "wouter";
import { useGetPortalVehicles } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, ChevronLeft, Gauge } from "lucide-react";

export default function PortalVehicles() {
  const [, setLocation] = useLocation();
  const { data: vehicles, isLoading } = useGetPortalVehicles();

  const fuelLabel = (f: string) => ({ petrol: "بنزين", diesel: "ديزل", electric: "كهرباء", hybrid: "هجين" }[f] ?? f);

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-xl font-bold">مركباتي</h2>
        <p className="text-muted-foreground text-sm">سياراتك المسجلة في الورشة</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !vehicles?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">لا توجد مركبات</p>
          <p className="text-sm text-muted-foreground">اتصل بالورشة لإضافة مركبتك</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <Card key={v.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setLocation(`/portal/vehicles/${v.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold font-mono text-primary">{v.plateNumber}</p>
                    <p className="text-sm font-medium">{v.make} {v.model} — {v.year}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-xs">{fuelLabel(v.fuelType)}</Badge>
                      {v.currentMileage && <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{Number(v.currentMileage).toLocaleString()} كم</span>}
                    </div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useParams } from "wouter";
import { useTrackOrder, getTrackOrderQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, CheckCircle2, Circle } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  received: "استلام السيارة",
  diagnosing: "فحص وتشخيص",
  waiting_approval: "انتظار موافقة العميل",
  in_progress: "جاري الإصلاح",
  waiting_parts: "انتظار قطع الغيار",
  ready: "جاهزة للاستلام",
  delivered: "تم التسليم",
};

export default function Track() {
  const { token } = useParams<{ token: string }>();
  const { data: tracking, isLoading, error } = useTrackOrder(token, { query: { queryKey: getTrackOrderQueryKey(token) } });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">تتبع السيارة</h1>
          <p className="text-muted-foreground text-sm mt-1">حالة سيارتك في الورشة</p>
        </div>

        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
        ) : error || !tracking ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">الرابط غير صالح أو منتهي الصلاحية</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الطلب</p>
                    <p className="font-mono font-bold text-primary">{tracking.orderNumber}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{tracking.vehicleInfo}</p>
                  </div>
                  <Badge className="text-xs">{STAGE_LABELS[tracking.status] ?? tracking.status}</Badge>
                </div>
                {tracking.estimatedDeliveryAt && (
                  <p className="text-xs text-muted-foreground mt-2">تسليم متوقع: {new Date(tracking.estimatedDeliveryAt).toLocaleDateString("ar-SA")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {(tracking.stages ?? []).map((s: any, i: number) => (
                    <div key={s.stage} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        {s.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : tracking.status === s.stage ? (
                          <div className="h-5 w-5 rounded-full border-2 border-primary animate-pulse" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted" />
                        )}
                        {i < (tracking.stages as any[]).length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 ${s.completed ? "bg-green-400" : "bg-muted"}`} />
                        )}
                      </div>
                      <p className={`text-sm ${s.completed ? "text-foreground" : tracking.status === s.stage ? "text-primary font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

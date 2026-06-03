import { useParams, useLocation } from "wouter";
import { useGetCustomer, useGetCustomerVehicles, useGetCustomerOrders, useGetCustomerBalance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Phone, Mail, MapPin, Car, ClipboardList, DollarSign } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400" },
  ready: { label: "جاهز", class: "bg-green-500/10 text-green-400" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400" },
  cancelled: { label: "ملغي", class: "bg-red-500/10 text-red-400" },
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const cId = Number(id);

  const { data: customer, isLoading } = useGetCustomer(cId);
  const { data: vehicles } = useGetCustomerVehicles(cId);
  const { data: orders } = useGetCustomerOrders(cId);
  const { data: balance } = useGetCustomerBalance(cId);

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;
  if (!customer) return <p className="text-center text-muted-foreground py-20">العميل غير موجود</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/customers")}><ArrowRight className="h-4 w-4" /></Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{customer.fullName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{customer.fullName}</h2>
            <p className="text-muted-foreground text-sm">{customer.phonePrimary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Car className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{vehicles?.length ?? 0}</p><p className="text-sm text-muted-foreground">مركبة</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><ClipboardList className="h-8 w-8 text-indigo-400" /><div><p className="text-2xl font-bold">{orders?.length ?? 0}</p><p className="text-sm text-muted-foreground">طلب</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-400" /><div><p className="text-2xl font-bold font-mono">{Number(balance?.totalPaid ?? 0).toLocaleString()}</p><p className={`text-sm ${Number(balance?.balanceDue ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}>متبقي: {Number(balance?.balanceDue ?? 0).toLocaleString()}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">معلومات الاتصال</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{customer.phonePrimary}</span></div>
            {customer.phoneSecondary && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{customer.phoneSecondary}</span></div>}
            {customer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{customer.email}</span></div>}
            {customer.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{customer.address}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">المركبات</CardTitle></CardHeader>
          <CardContent>
            {!vehicles?.length ? <p className="text-sm text-muted-foreground">لا توجد مركبات</p> : (
              <div className="space-y-2">
                {vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between cursor-pointer hover:text-primary" onClick={() => setLocation(`/vehicles/${v.id}`)}>
                    <span className="text-sm font-medium">{v.make} {v.model} {v.year}</span>
                    <Badge variant="outline" className="font-mono text-xs">{v.plateNumber}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">سجل الطلبات</CardTitle></CardHeader>
        <CardContent>
          {!orders?.length ? <p className="text-sm text-muted-foreground">لا توجد طلبات</p> : (
            <div className="space-y-2">
              {orders.slice(0, 10).map(o => {
                const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.received;
                return (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer hover:text-primary" onClick={() => setLocation(`/orders/${o.id}`)}>
                    <div>
                      <span className="font-mono text-sm font-bold text-primary">{o.orderNumber}</span>
                      <span className="text-sm text-muted-foreground mr-2">{o.vehicleMake} {o.vehicleModel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {o.grandTotal && <span className="font-mono text-sm">{Number(o.grandTotal).toLocaleString()}</span>}
                      <Badge className={`${st.class} border text-xs`}>{st.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

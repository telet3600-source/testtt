import { useState } from "react";
import { useLocation } from "wouter";
import { useGetOrders, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Car, Calendar, User, AlertTriangle, Star } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  received: { label: "مستلم", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  diagnosing: { label: "قيد الفحص", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  waiting_approval: { label: "انتظار موافقة", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "قيد التنفيذ", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  waiting_parts: { label: "انتظار قطع", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ready: { label: "جاهز", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  delivered: { label: "تم التسليم", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  cancelled: { label: "ملغي", class: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const PRIORITY_CONFIG: Record<string, { label: string; class: string; icon?: typeof AlertTriangle }> = {
  normal: { label: "عادي", class: "text-muted-foreground" },
  urgent: { label: "عاجل", class: "text-orange-400", icon: AlertTriangle },
  vip: { label: "VIP", class: "text-yellow-400", icon: Star },
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};
  const { data, isLoading } = useGetOrders(params, { query: { queryKey: getGetOrdersQueryKey(params) } });
  const orders = data?.data ?? [];
  const filtered = search ? orders.filter(o => o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()) || o.vehiclePlate?.includes(search)) : orders;

  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("ar-SA") : "—";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الطلبات</h2>
          <p className="text-muted-foreground">متابعة أوامر الصيانة ({data?.total ?? 0})</p>
        </div>
        <Button onClick={() => setLocation("/orders/new")} data-testid="button-new-order">
          <Plus className="h-4 w-4 ml-2" />طلب جديد
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث برقم الطلب أو العميل أو اللوحة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" data-testid="input-search-orders" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الحالات</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const st = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.received;
            const pr = PRIORITY_CONFIG[o.priority ?? "normal"] ?? PRIORITY_CONFIG.normal;
            const PrIcon = pr.icon;
            return (
              <Card key={o.id} data-testid={`card-order-${o.id}`} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/orders/${o.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary">{o.orderNumber}</span>
                          {PrIcon && <PrIcon className={`h-3.5 w-3.5 ${pr.class}`} />}
                        </div>
                        <p className="font-medium truncate">{o.customerName}</p>
                        <p className="text-sm text-muted-foreground">{o.vehicleMake} {o.vehicleModel} — {o.vehiclePlate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right text-sm text-muted-foreground hidden md:block">
                        <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /><span>{formatDate(o.receivedAt)}</span></div>
                        {o.assignedTechnicianName && <div className="flex items-center gap-1 mt-0.5"><User className="h-3.5 w-3.5" /><span>{o.assignedTechnicianName}</span></div>}
                      </div>
                      {o.grandTotal && <span className="font-semibold text-primary">{Number(o.grandTotal).toLocaleString()} ر.س</span>}
                      <Badge className={`${st.class} border`}>{st.label}</Badge>
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

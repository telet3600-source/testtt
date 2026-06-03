import { useGetDashboardStats, useGetOrdersPipeline } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  DollarSign, 
  Car, 
  Star, 
  AlertCircle, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: pipeline, isLoading: pipelineLoading } = useGetOrdersPipeline();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "diagnosing": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "waiting_approval": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "in_progress": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "waiting_parts": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "ready": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "received": return "مستلمة";
      case "diagnosing": return "قيد الفحص";
      case "waiting_approval": return "بانتظار الموافقة";
      case "in_progress": return "قيد العمل";
      case "waiting_parts": return "بانتظار قطع غيار";
      case "ready": return "جاهزة";
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">الرئيسية</h2>
        <p className="text-muted-foreground mt-2">نظرة عامة على أداء ورشتك اليوم.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات اليوم</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.ordersToday || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات اليوم</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{stats?.revenueToday?.toLocaleString() || 0} د.إ</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">سيارات في الجراج</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.carsInGarage || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">التقييم العام</CardTitle>
            <Star className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">بانتظار الموافقة</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-orange-500">{stats?.pendingApprovals || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-500">جاهزة للتسليم</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-green-500">{stats?.readyForDelivery || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kanban Pipeline */}
      <div>
        <h3 className="text-xl font-bold mb-4">مسار الطلبات</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {pipelineLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="min-w-[300px] w-[300px] shrink-0 bg-muted/30 rounded-lg p-4 snap-start">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))
          ) : (
            [
              { id: "received", title: "مستلمة", items: pipeline?.received || [] },
              { id: "diagnosing", title: "قيد الفحص", items: pipeline?.diagnosing || [] },
              { id: "waitingApproval", title: "بانتظار الموافقة", items: pipeline?.waitingApproval || [] },
              { id: "inProgress", title: "قيد العمل", items: pipeline?.inProgress || [] },
              { id: "waitingParts", title: "بانتظار قطع غيار", items: pipeline?.waitingParts || [] },
              { id: "ready", title: "جاهزة", items: pipeline?.ready || [] }
            ].map(column => (
              <div key={column.id} className="min-w-[300px] w-[300px] shrink-0 bg-muted/20 border border-border rounded-lg flex flex-col max-h-[600px] snap-start">
                <div className="p-3 font-semibold flex justify-between items-center border-b border-border bg-muted/40 rounded-t-lg">
                  <span>{column.title}</span>
                  <Badge variant="secondary" className="rounded-full">{column.items.length}</Badge>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {column.items.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8 border border-dashed border-border rounded-lg">
                      لا يوجد طلبات
                    </div>
                  ) : (
                    column.items.map(order => (
                      <Card key={order.id} className="bg-card hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-primary text-sm">{order.orderNumber}</span>
                            {order.priority === "urgent" && <Badge variant="destructive" className="text-[10px] px-1 h-4">عاجل</Badge>}
                            {order.priority === "vip" && <Badge className="bg-purple-500 hover:bg-purple-600 text-[10px] px-1 h-4">VIP</Badge>}
                          </div>
                          <div className="font-medium text-sm mb-1">{order.vehicleMake} {order.vehicleModel}</div>
                          <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                            <span>{order.vehiclePlate}</span>
                            <span>{order.customerName}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                            <div className="text-xs flex items-center text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1 ml-1" />
                              <span>{new Date(order.receivedAt || "").toLocaleDateString('ar-AE')}</span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{order.assignedTechnicianName || 'غير معين'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

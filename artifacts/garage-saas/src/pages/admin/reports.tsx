import { useGetFinancialReport, useGetTechPerformanceReport, useGetDebtReport, useGetReviewStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign, TrendingUp, AlertTriangle, Star, Users } from "lucide-react";

export default function Reports() {
  const { data: financial, isLoading: finLoading } = useGetFinancialReport({});
  const { data: techPerf, isLoading: techLoading } = useGetTechPerformanceReport({});
  const { data: debts, isLoading: debtLoading } = useGetDebtReport();
  const { data: reviewStats } = useGetReviewStats();

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">التقارير</h2>
        <p className="text-muted-foreground">تحليلات الأداء والمالية</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {finLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />) : [
          { label: "إجمالي الإيرادات", value: financial?.totalRevenue, icon: DollarSign, color: "text-green-400" },
          { label: "إجمالي الفواتير", value: financial?.totalInvoiced, icon: TrendingUp, color: "text-primary" },
          { label: "المحصّل", value: financial?.totalCollected, icon: DollarSign, color: "text-blue-400" },
          { label: "غير المحصّل", value: financial?.totalOutstanding, icon: AlertTriangle, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><s.icon className={`h-4 w-4 ${s.color}`} />{s.label}</CardTitle></CardHeader>
            <CardContent><p className={`text-xl font-bold font-mono ${s.color}`}>{Number(s.value ?? 0).toLocaleString()}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      {financial?.byPeriod && financial.byPeriod.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">الإيرادات الشهرية</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financial.byPeriod}>
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tech Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />أداء الفنيين</CardTitle>
          </CardHeader>
          <CardContent>
            {techLoading ? <Skeleton className="h-40 w-full" /> : !techPerf?.length ? <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات</p> : (
              <div className="space-y-3">
                {techPerf.map(t => (
                  <div key={t.technicianId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{t.fullName}</p>
                      <p className="text-xs text-muted-foreground">{t.completedOrders} طلب مكتمل</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.averageRating > 0 && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />{t.averageRating}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />المديونيات ({Number(debts?.totalOutstanding ?? 0).toLocaleString()})</CardTitle>
          </CardHeader>
          <CardContent>
            {debtLoading ? <Skeleton className="h-40 w-full" /> : !debts?.debtors?.length ? <p className="text-sm text-muted-foreground text-center py-6">لا توجد مديونيات</p> : (
              <div className="space-y-2">
                {debts.debtors.slice(0, 8).map((d: any) => (
                  <div key={d.customerId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{d.customerName}</p>
                      <p className="text-xs text-muted-foreground">{d.phone} • {d.oldestInvoiceDays} يوم</p>
                    </div>
                    <p className="font-mono font-bold text-destructive">{Number(d.totalDebt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Stats */}
      {reviewStats && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400" />إحصائيات التقييمات ({reviewStats.totalReviews} تقييم)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "التقييم العام", value: reviewStats.averageOverall },
              { label: "السرعة", value: reviewStats.averageSpeed },
              { label: "الجودة", value: reviewStats.averageQuality },
              { label: "التواصل", value: reviewStats.averageCommunication },
              { label: "النظافة", value: reviewStats.averageCleanliness },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

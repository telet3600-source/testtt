import { useLocation } from "wouter";
import { useGetSuperAdminStats, useGetTenants, useCreateTenant, getGetTenantsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, CheckCircle2, XCircle } from "lucide-react";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", nameAr: "", nameEn: "", country: "SA", currency: "SAR", plan: "full", adminEmail: "", adminPassword: "", adminName: "" });

  const { data: stats, isLoading: statsLoading } = useGetSuperAdminStats();
  const { data: tenants, isLoading: tenantsLoading } = useGetTenants({ query: { queryKey: getGetTenantsQueryKey() } });
  const createMutation = useCreateTenant();

  const handleCreate = () => {
    if (!form.slug || !form.nameAr || !form.nameEn) { toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" }); return; }
    createMutation.mutate({ data: form }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetTenantsQueryKey() });
        setOpen(false);
        toast({ title: "تم إنشاء الورشة" });
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم العليا</h1>
          <p className="text-muted-foreground">إدارة جميع الورش</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />ورشة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إضافة ورشة جديدة</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>معرف الورشة (slug) *</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} dir="ltr" placeholder="al-nakheel" /></div>
              <div className="space-y-1.5"><Label>الخطة</Label>
                <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">كامل</SelectItem>
                    <SelectItem value="basic">أساسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>الاسم (عربي) *</Label><Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>الاسم (إنجليزي) *</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} dir="ltr" /></div>
              <div className="space-y-1.5 col-span-2 border-t pt-2"><Label className="font-semibold">حساب المدير</Label></div>
              <div className="space-y-1.5"><Label>الاسم</Label><Input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>البريد</Label><Input value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} dir="ltr" /></div>
              <div className="space-y-1.5 col-span-2"><Label>كلمة المرور</Label><Input type="password" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} dir="ltr" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="col-span-2">إنشاء الورشة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statsLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />) : [
          { label: "إجمالي الورش", value: stats?.totalTenants },
          { label: "نشطة", value: stats?.activeTenants },
          { label: "طلبات اليوم", value: stats?.totalOrdersToday },
          { label: "اشتراكات تنتهي", value: stats?.expiringSubscriptions },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-2xl font-bold">{s.value ?? 0}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Tenants */}
      <div>
        <h3 className="font-semibold mb-3">الورش المسجلة</h3>
        {tenantsLoading ? <Skeleton className="h-40 rounded-xl" /> : !tenants?.length ? <p className="text-muted-foreground text-sm">لا توجد ورش</p> : (
          <div className="space-y-2">
            {tenants.map(t => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t.nameAr}</p>
                      <p className="text-sm text-muted-foreground">{t.slug} • {t.country} • {t.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.plan}</Badge>
                    {t.isActive ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

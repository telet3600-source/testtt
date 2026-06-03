import { useState } from "react";
import { useLocation } from "wouter";
import { useGetTechnicians, useCreateTechnician, getGetTechniciansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Star, Wrench, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Technicians() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", shift: "morning" });

  const { data: technicians, isLoading } = useGetTechnicians({ query: { queryKey: getGetTechniciansQueryKey() } });
  const createMutation = useCreateTechnician();

  const handleCreate = () => {
    if (!form.fullName || !form.email || !form.password) { toast({ title: "الاسم والإيميل وكلمة المرور مطلوبة", variant: "destructive" }); return; }
    createMutation.mutate({ data: { fullName: form.fullName, email: form.email, password: form.password, phone: form.phone, shift: form.shift } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetTechniciansQueryKey() });
        setOpen(false);
        setForm({ fullName: "", email: "", password: "", phone: "", shift: "morning" });
        toast({ title: "تم إضافة الفني بنجاح" });
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const shiftLabel = (s: string) => ({ morning: "صباحي", evening: "مسائي", night: "ليلي" }[s] ?? s);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الفنيون</h2>
          <p className="text-muted-foreground">إدارة فريق العمل</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-technician"><Plus className="h-4 w-4 ml-2" />إضافة فني</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إضافة فني جديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>الاسم *</Label><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} data-testid="input-tech-name" /></div>
                <div className="space-y-1.5"><Label>البريد *</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>كلمة المرور *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
                <div className="space-y-1.5 col-span-2">
                  <Label>الوردية</Label>
                  <Select value={form.shift} onValueChange={v => setForm(f => ({ ...f, shift: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">صباحي</SelectItem>
                      <SelectItem value="evening">مسائي</SelectItem>
                      <SelectItem value="night">ليلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : !technicians?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا يوجد فنيون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicians.map(t => (
            <Card key={t.id} data-testid={`card-tech-${t.id}`} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/technicians/${t.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary text-lg">{t.fullName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{t.fullName}</p>
                      <p className="text-sm text-muted-foreground">{t.email}</p>
                    </div>
                  </div>
                  {t.isAvailable ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 ml-1" />{shiftLabel(t.shift)}</Badge>
                  {t.ratingAverage && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />{t.ratingAverage}</Badge>}
                  <Badge variant="outline" className="text-xs">{t.totalOrdersCompleted} طلب</Badge>
                  {t.activeOrdersCount > 0 && <Badge className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{t.activeOrdersCount} نشط</Badge>}
                </div>
                {t.specialization?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.specialization.slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrder, useGetCustomers, useGetVehicles, useGetTechnicians, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ customerId: "", vehicleId: "", customerComplaint: "", priority: "normal", mileageAtReception: "", fuelLevel: "", estimatedCostMin: "", estimatedCostMax: "", estimatedDeliveryAt: "", assignedTechnicianId: "", internalNotes: "" });

  const createMutation = useCreateOrder();
  const { data: customersData } = useGetCustomers({});
  const customers = customersData?.data ?? [];
  const { data: vehicles } = useGetVehicles(form.customerId ? { customerId: Number(form.customerId) } : {});
  const { data: technicians } = useGetTechnicians();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.vehicleId || !form.customerComplaint) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        customerId: Number(form.customerId),
        vehicleId: Number(form.vehicleId),
        customerComplaint: form.customerComplaint,
        priority: form.priority,
        mileageAtReception: form.mileageAtReception ? Number(form.mileageAtReception) : undefined,
        fuelLevel: form.fuelLevel || undefined,
        estimatedCostMin: form.estimatedCostMin ? Number(form.estimatedCostMin) : undefined,
        estimatedCostMax: form.estimatedCostMax ? Number(form.estimatedCostMax) : undefined,
        estimatedDeliveryAt: form.estimatedDeliveryAt || undefined,
        assignedTechnicianId: form.assignedTechnicianId ? Number(form.assignedTechnicianId) : undefined,
        internalNotes: form.internalNotes || undefined,
      }
    }, {
      onSuccess: (order) => {
        qc.invalidateQueries({ queryKey: getGetOrdersQueryKey({}) });
        toast({ title: "تم إنشاء الطلب بنجاح" });
        setLocation(`/orders/${order.id}`);
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/orders")}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-2xl font-bold">طلب صيانة جديد</h2>
          <p className="text-muted-foreground text-sm">أدخل تفاصيل طلب الصيانة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">معلومات العميل والمركبة</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>العميل *</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v, vehicleId: "" }))}>
                <SelectTrigger data-testid="select-customer"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} — {c.phonePrimary}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المركبة *</Label>
              <Select value={form.vehicleId} onValueChange={v => setForm(f => ({ ...f, vehicleId: v }))} disabled={!form.customerId}>
                <SelectTrigger data-testid="select-vehicle"><SelectValue placeholder="اختر المركبة" /></SelectTrigger>
                <SelectContent>{(vehicles ?? []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.make} {v.model} — {v.plateNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الفني المسؤول</Label>
              <Select value={form.assignedTechnicianId} onValueChange={v => setForm(f => ({ ...f, assignedTechnicianId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
                <SelectContent>{(technicians ?? []).map(t => <SelectItem key={t.id} value={String(t.userId)}>{t.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">تفاصيل الاستلام</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>العداد عند الاستلام (كم)</Label>
              <Input type="number" value={form.mileageAtReception} onChange={e => setForm(f => ({ ...f, mileageAtReception: e.target.value }))} dir="ltr" data-testid="input-mileage" />
            </div>
            <div className="space-y-1.5">
              <Label>مستوى الوقود</Label>
              <Select value={form.fuelLevel} onValueChange={v => setForm(f => ({ ...f, fuelLevel: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {["Empty", "1/4", "1/2", "3/4", "Full"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>التكلفة التقديرية (من)</Label>
              <Input type="number" value={form.estimatedCostMin} onChange={e => setForm(f => ({ ...f, estimatedCostMin: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>التكلفة التقديرية (إلى)</Label>
              <Input type="number" value={form.estimatedCostMax} onChange={e => setForm(f => ({ ...f, estimatedCostMax: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>تاريخ التسليم المتوقع</Label>
              <Input type="datetime-local" value={form.estimatedDeliveryAt} onChange={e => setForm(f => ({ ...f, estimatedDeliveryAt: e.target.value }))} dir="ltr" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">شكوى العميل والملاحظات</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>شكوى العميل *</Label>
              <Textarea rows={3} value={form.customerComplaint} onChange={e => setForm(f => ({ ...f, customerComplaint: e.target.value }))} placeholder="وصف المشكلة بكلمات العميل..." data-testid="textarea-complaint" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات داخلية</Label>
              <Textarea rows={2} value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} placeholder="ملاحظات للفريق فقط..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => setLocation("/orders")}>إلغاء</Button>
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-order">
            {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
          </Button>
        </div>
      </form>
    </div>
  );
}

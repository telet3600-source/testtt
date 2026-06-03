import { useState } from "react";
import { useLocation } from "wouter";
import { useGetVehicles, useCreateVehicle, useGetCustomers, getGetVehiclesQueryKey } from "@workspace/api-client-react";
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
import { Search, Plus, Car, Gauge } from "lucide-react";

export default function Vehicles() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", plateNumber: "", make: "", model: "", year: new Date().getFullYear().toString(), color: "", bodyType: "sedan", fuelType: "petrol", transmission: "automatic", currentMileage: "" });

  const params = search ? { search } : {};
  const { data: vehicles, isLoading } = useGetVehicles(params, { query: { queryKey: getGetVehiclesQueryKey(params) } });
  const { data: customersData } = useGetCustomers({});
  const customers = customersData?.data ?? [];
  const createMutation = useCreateVehicle();

  const handleCreate = () => {
    if (!form.customerId || !form.plateNumber || !form.make || !form.model) { toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" }); return; }
    createMutation.mutate({ data: { customerId: Number(form.customerId), plateNumber: form.plateNumber, make: form.make, model: form.model, year: Number(form.year), color: form.color, bodyType: form.bodyType, fuelType: form.fuelType, transmission: form.transmission, currentMileage: form.currentMileage ? Number(form.currentMileage) : undefined } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetVehiclesQueryKey({}) });
        setOpen(false);
        setForm({ customerId: "", plateNumber: "", make: "", model: "", year: new Date().getFullYear().toString(), color: "", bodyType: "sedan", fuelType: "petrol", transmission: "automatic", currentMileage: "" });
        toast({ title: "تم إضافة المركبة" });
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const fuelLabel = (f: string) => ({ petrol: "بنزين", diesel: "ديزل", electric: "كهرباء", hybrid: "هجين" }[f] ?? f);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">المركبات</h2>
          <p className="text-muted-foreground">إدارة سجلات المركبات</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vehicle"><Plus className="h-4 w-4 ml-2" />إضافة مركبة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إضافة مركبة جديدة</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger data-testid="select-vehicle-customer"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} — {c.phonePrimary}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>رقم اللوحة *</Label><Input value={form.plateNumber} onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))} placeholder="أ ب ج 1234" data-testid="input-plate" /></div>
                <div className="space-y-1.5"><Label>اللون</Label><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>الشركة المصنعة *</Label><Input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="تويوتا" /></div>
                <div className="space-y-1.5"><Label>الموديل *</Label><Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="كامري" /></div>
                <div className="space-y-1.5"><Label>السنة *</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>العداد الحالي</Label><Input type="number" value={form.currentMileage} onChange={e => setForm(f => ({ ...f, currentMileage: e.target.value }))} dir="ltr" /></div>
                <div className="space-y-1.5">
                  <Label>نوع الوقود</Label>
                  <Select value={form.fuelType} onValueChange={v => setForm(f => ({ ...f, fuelType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">بنزين</SelectItem>
                      <SelectItem value="diesel">ديزل</SelectItem>
                      <SelectItem value="electric">كهرباء</SelectItem>
                      <SelectItem value="hybrid">هجين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>ناقل الحركة</Label>
                  <Select value={form.transmission} onValueChange={v => setForm(f => ({ ...f, transmission: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">أوتوماتيك</SelectItem>
                      <SelectItem value="manual">يدوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث باللوحة أو الشركة أو الموديل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" data-testid="input-search-vehicles" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !vehicles?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا توجد مركبات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vehicles.map(v => (
            <Card key={v.id} data-testid={`card-vehicle-${v.id}`} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/vehicles/${v.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold font-mono text-primary">{v.plateNumber}</p>
                      <p className="font-medium text-sm">{v.make} {v.model} — {v.year}</p>
                      <p className="text-xs text-muted-foreground">{v.customerName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">{fuelLabel(v.fuelType)}</Badge>
                    {v.currentMileage && <span className="text-xs text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" />{Number(v.currentMileage).toLocaleString()} كم</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

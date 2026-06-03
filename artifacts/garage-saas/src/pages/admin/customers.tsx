import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetCustomers, useCreateCustomer, useDeleteCustomer,
  getGetCustomersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Users, Phone, Mail, Car, ShoppingBag, Trash2, Eye } from "lucide-react";

export default function Customers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", phonePrimary: "", phoneSecondary: "", email: "", address: "", gender: "", ownerType: "individual", notes: "" });

  const { data, isLoading } = useGetCustomers(search ? { search } : {}, { query: { queryKey: getGetCustomersQueryKey({ search }) } });
  const createMutation = useCreateCustomer();
  const deleteMutation = useDeleteCustomer();

  const customers = data?.data ?? [];

  const handleCreate = () => {
    if (!form.fullName || !form.phonePrimary) { toast({ title: "الاسم والهاتف مطلوبان", variant: "destructive" }); return; }
    createMutation.mutate({ data: form }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCustomersQueryKey({}) });
        setOpen(false);
        setForm({ fullName: "", phonePrimary: "", phoneSecondary: "", email: "", address: "", gender: "", ownerType: "individual", notes: "" });
        toast({ title: "تم إضافة العميل بنجاح" });
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const ownerTypeLabel = (t: string) => ({ individual: "فرد", private_company: "شركة خاصة", government: "حكومي", other: "أخرى" }[t] ?? t);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">العملاء</h2>
          <p className="text-muted-foreground">إدارة قاعدة بيانات العملاء</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer"><Plus className="h-4 w-4 ml-2" />إضافة عميل</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم الكامل *</Label>
                  <Input data-testid="input-customer-name" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="محمد أحمد" />
                </div>
                <div className="space-y-1.5">
                  <Label>الهاتف الرئيسي *</Label>
                  <Input data-testid="input-customer-phone" value={form.phonePrimary} onChange={e => setForm(f => ({ ...f, phonePrimary: e.target.value }))} placeholder="05xxxxxxxx" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>هاتف إضافي</Label>
                  <Input value={form.phoneSecondary} onChange={e => setForm(f => ({ ...f, phoneSecondary: e.target.value }))} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>نوع العميل</Label>
                  <Select value={form.ownerType} onValueChange={v => setForm(f => ({ ...f, ownerType: v }))}>
                    <SelectTrigger data-testid="select-owner-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد</SelectItem>
                      <SelectItem value="private_company">شركة خاصة</SelectItem>
                      <SelectItem value="government">حكومي</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>الجنس</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>العنوان</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="المدينة، الحي" />
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-customer">
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-customers"
          placeholder="بحث بالاسم أو الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا يوجد عملاء</p>
          <p className="text-muted-foreground text-sm">ابدأ بإضافة أول عميل</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {customers.map(c => (
            <Card key={c.id} data-testid={`card-customer-${c.id}`} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/customers/${c.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{c.fullName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{c.fullName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phonePrimary}</span>
                        {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{ownerTypeLabel(c.ownerType)}</Badge>
                    <div className="text-center text-sm">
                      <div className="flex gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1"><Car className="h-3 w-3" />{c.vehiclesCount ?? 0}</span>
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{c.totalOrders ?? 0}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" data-testid={`button-view-customer-${c.id}`} onClick={e => { e.stopPropagation(); setLocation(`/customers/${c.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
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

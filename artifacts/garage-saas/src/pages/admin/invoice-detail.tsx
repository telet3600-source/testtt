import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetInvoice, useGetInvoicePayments, useAddPayment, getGetInvoiceQueryKey, getGetInvoicePaymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const invId = Number(id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", paymentMethod: "cash", paymentReference: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });

  const { data: inv, isLoading } = useGetInvoice(invId, { query: { queryKey: getGetInvoiceQueryKey(invId) } });
  const { data: payments } = useGetInvoicePayments(invId, { query: { queryKey: getGetInvoicePaymentsQueryKey(invId) } });
  const addPaymentMutation = useAddPayment();

  const handleAddPayment = () => {
    if (!form.amount || !form.paymentDate) { toast({ title: "يرجى تعبئة المبلغ والتاريخ", variant: "destructive" }); return; }
    addPaymentMutation.mutate({ id: invId, data: { amount: Number(form.amount), paymentMethod: form.paymentMethod, paymentReference: form.paymentReference, paymentDate: form.paymentDate, notes: form.notes } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invId) });
        qc.invalidateQueries({ queryKey: getGetInvoicePaymentsQueryKey(invId) });
        setOpen(false);
        setForm({ amount: "", paymentMethod: "cash", paymentReference: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
        toast({ title: "تم تسجيل الدفعة" });
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>;
  if (!inv) return <p className="text-center text-muted-foreground py-20">الفاتورة غير موجودة</p>;

  const payStatusConfig = { pending: { label: "غير مدفوع", icon: AlertCircle, cls: "text-red-400" }, partial: { label: "جزئي", icon: Clock, cls: "text-orange-400" }, paid: { label: "مدفوع", icon: CheckCircle, cls: "text-green-400" } };
  const ps = payStatusConfig[inv.paymentStatus as keyof typeof payStatusConfig] ?? payStatusConfig.pending;
  const PsIcon = ps.icon;

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}><ArrowRight className="h-4 w-4" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-mono">{inv.invoiceNumber}</h2>
            <span className={`flex items-center gap-1 text-sm font-medium ${ps.cls}`}><PsIcon className="h-4 w-4" />{ps.label}</span>
          </div>
          <p className="text-muted-foreground text-sm">{inv.customerName} — {inv.vehicleInfo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">تفاصيل الفاتورة</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-mono">{Number(inv.subtotal).toLocaleString()}</span></div>
            {Number(inv.discountAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">الخصم</span><span className="font-mono text-green-400">— {Number(inv.discountAmount).toLocaleString()}</span></div>}
            {Number(inv.taxAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">الضريبة</span><span className="font-mono">{Number(inv.taxAmount).toLocaleString()}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>الإجمالي</span><span className="font-mono text-primary">{Number(inv.total).toLocaleString()} {inv.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المدفوع</span><span className="font-mono text-green-400">{Number(inv.totalPaid).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المتبقي</span><span className={`font-mono ${Number(inv.balanceDue) > 0 ? "text-destructive" : "text-green-400"}`}>{Number(inv.balanceDue).toLocaleString()}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">المدفوعات</CardTitle>
              {inv.paymentStatus !== "paid" && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-add-payment"><Plus className="h-3.5 w-3.5 ml-1" />إضافة</Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>تسجيل دفعة</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5"><Label>المبلغ *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder={`المتبقي: ${Number(inv.balanceDue).toLocaleString()}`} dir="ltr" data-testid="input-payment-amount" /></div>
                      <div className="space-y-1.5">
                        <Label>طريقة الدفع</Label>
                        <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="card">بطاقة</SelectItem>
                            <SelectItem value="transfer">تحويل بنكي</SelectItem>
                            <SelectItem value="wallet">محفظة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>رقم المرجع</Label><Input value={form.paymentReference} onChange={e => setForm(f => ({ ...f, paymentReference: e.target.value }))} dir="ltr" /></div>
                      <div className="space-y-1.5"><Label>التاريخ *</Label><Input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} dir="ltr" /></div>
                      <Button onClick={handleAddPayment} disabled={addPaymentMutation.isPending} className="w-full">تسجيل الدفعة</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!payments?.length ? <p className="text-sm text-muted-foreground">لا توجد مدفوعات</p> : (
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                    <div>
                      <p className="font-mono font-medium">{Number(p.amount).toLocaleString()} {inv.currency}</p>
                      <p className="text-muted-foreground text-xs">{{ cash: "نقدي", card: "بطاقة", transfer: "تحويل", wallet: "محفظة" }[p.paymentMethod] ?? p.paymentMethod}</p>
                    </div>
                    <p className="text-muted-foreground text-xs">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetOrder, useUpdateOrderStatus, useAddOrderService, useAddOrderPart, useIssueInvoice, useGetOrderTrackingLink,
  getGetOrderQueryKey
} from "@workspace/api-client-react";
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
import { ArrowRight, Car, User, Wrench, Package, Clock, DollarSign, Link2, FileText, Plus } from "lucide-react";

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

const STATUS_FLOW = ["received", "diagnosing", "waiting_approval", "in_progress", "waiting_parts", "ready", "delivered"];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const orderId = Number(id);

  const [serviceOpen, setServiceOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ serviceNameAr: "", quantity: "1", unitPrice: "" });
  const [partForm, setPartForm] = useState({ partNameAr: "", brand: "", quantity: "1", unitCost: "", unitPrice: "" });

  const { data: order, isLoading } = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId) } });
  const statusMutation = useUpdateOrderStatus();
  const addServiceMutation = useAddOrderService();
  const addPartMutation = useAddOrderPart();
  const invoiceMutation = useIssueInvoice();
  const { data: trackingData } = useGetOrderTrackingLink(orderId, { query: { queryKey: getGetOrderQueryKey(orderId) } });

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });

  const handleStatusChange = (status: string) => {
    statusMutation.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => { invalidate(); toast({ title: "تم تحديث الحالة" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const handleAddService = () => {
    addServiceMutation.mutate({ id: orderId, data: { serviceNameAr: serviceForm.serviceNameAr, quantity: Number(serviceForm.quantity), unitPrice: Number(serviceForm.unitPrice) } }, {
      onSuccess: () => { invalidate(); setServiceOpen(false); setServiceForm({ serviceNameAr: "", quantity: "1", unitPrice: "" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const handleAddPart = () => {
    addPartMutation.mutate({ id: orderId, data: { partNameAr: partForm.partNameAr, brand: partForm.brand, quantity: Number(partForm.quantity), unitCost: Number(partForm.unitCost), unitPrice: Number(partForm.unitPrice) } }, {
      onSuccess: () => { invalidate(); setPartOpen(false); setPartForm({ partNameAr: "", brand: "", quantity: "1", unitCost: "", unitPrice: "" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const handleIssueInvoice = () => {
    invoiceMutation.mutate({ id: orderId }, {
      onSuccess: () => { invalidate(); toast({ title: "تم إصدار الفاتورة بنجاح" }); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>;
  if (!order) return <div className="text-center py-20"><p className="text-muted-foreground">الطلب غير موجود</p></div>;

  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.received;
  const totalServices = (order.services ?? []).reduce((s: number, x: any) => s + parseFloat(x.totalPrice || "0"), 0);
  const totalParts = (order.parts ?? []).reduce((s: number, x: any) => s + parseFloat(x.totalPrice || "0"), 0);
  const grandTotal = totalServices + totalParts;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/orders")}><ArrowRight className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-mono">{order.orderNumber}</h2>
              <Badge className={`${st.class} border`}>{st.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{order.customerName} — {order.vehicleMake} {order.vehicleModel} {order.vehiclePlate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {trackingData && (
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.origin + trackingData.url).then(() => toast({ title: "تم نسخ رابط التتبع" }))}>
              <Link2 className="h-4 w-4 ml-1" />رابط التتبع
            </Button>
          )}
          {!order.invoice && (
            <Button variant="outline" size="sm" onClick={handleIssueInvoice} disabled={invoiceMutation.isPending}>
              <FileText className="h-4 w-4 ml-1" />{invoiceMutation.isPending ? "..." : "إصدار فاتورة"}
            </Button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = order.status === s;
              const isPast = STATUS_FLOW.indexOf(order.status) > i;
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => handleStatusChange(s)}
                    className={`flex flex-col items-center gap-1 px-2 rounded-lg py-1 transition-colors ${isActive ? "opacity-100" : isPast ? "opacity-60" : "opacity-30 hover:opacity-60"}`}
                    data-testid={`button-status-${s}`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-primary" : isPast ? "bg-muted-foreground" : "bg-muted"}`} />
                    <span className="text-xs">{cfg.label}</span>
                  </button>
                  {i < STATUS_FLOW.length - 1 && <div className={`h-0.5 w-6 mx-1 ${isPast ? "bg-muted-foreground" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column — services & parts */}
        <div className="col-span-2 space-y-4">
          {/* Services */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" />الخدمات</CardTitle>
                <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-add-service"><Plus className="h-3.5 w-3.5 ml-1" />إضافة</Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>إضافة خدمة</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5"><Label>اسم الخدمة</Label><Input value={serviceForm.serviceNameAr} onChange={e => setServiceForm(f => ({ ...f, serviceNameAr: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label>الكمية</Label><Input type="number" value={serviceForm.quantity} onChange={e => setServiceForm(f => ({ ...f, quantity: e.target.value }))} dir="ltr" /></div>
                        <div className="space-y-1.5"><Label>السعر</Label><Input type="number" value={serviceForm.unitPrice} onChange={e => setServiceForm(f => ({ ...f, unitPrice: e.target.value }))} dir="ltr" /></div>
                      </div>
                      <Button onClick={handleAddService} disabled={addServiceMutation.isPending} className="w-full">حفظ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {(order.services ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-2">لا توجد خدمات مضافة</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-right pb-2">الخدمة</th><th className="text-center pb-2">الكمية</th><th className="text-left pb-2">السعر</th></tr></thead>
                  <tbody>
                    {(order.services as any[]).map((s: any) => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-2">{s.serviceNameAr}</td>
                        <td className="text-center py-2">{s.quantity}</td>
                        <td className="text-left py-2 font-mono">{Number(s.totalPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Parts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />قطع الغيار</CardTitle>
                <Dialog open={partOpen} onOpenChange={setPartOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-add-part"><Plus className="h-3.5 w-3.5 ml-1" />إضافة</Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>إضافة قطعة غيار</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5"><Label>اسم القطعة</Label><Input value={partForm.partNameAr} onChange={e => setPartForm(f => ({ ...f, partNameAr: e.target.value }))} /></div>
                      <div className="space-y-1.5"><Label>الماركة</Label><Input value={partForm.brand} onChange={e => setPartForm(f => ({ ...f, brand: e.target.value }))} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label>الكمية</Label><Input type="number" value={partForm.quantity} onChange={e => setPartForm(f => ({ ...f, quantity: e.target.value }))} dir="ltr" /></div>
                        <div className="space-y-1.5"><Label>التكلفة</Label><Input type="number" value={partForm.unitCost} onChange={e => setPartForm(f => ({ ...f, unitCost: e.target.value }))} dir="ltr" /></div>
                        <div className="space-y-1.5"><Label>السعر</Label><Input type="number" value={partForm.unitPrice} onChange={e => setPartForm(f => ({ ...f, unitPrice: e.target.value }))} dir="ltr" /></div>
                      </div>
                      <Button onClick={handleAddPart} disabled={addPartMutation.isPending} className="w-full">حفظ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {(order.parts ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-2">لا توجد قطع مضافة</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-right pb-2">القطعة</th><th className="text-center pb-2">الكمية</th><th className="text-left pb-2">السعر</th></tr></thead>
                  <tbody>
                    {(order.parts as any[]).map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2">{p.partNameAr} {p.brand && <span className="text-muted-foreground">— {p.brand}</span>}</td>
                        <td className="text-center py-2">{p.quantity}</td>
                        <td className="text-left py-2 font-mono">{Number(p.totalPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />سجل الحالات</CardTitle></CardHeader>
            <CardContent>
              {(order.statusHistory ?? []).length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد سجل</p> : (
                <div className="space-y-2">
                  {(order.statusHistory as any[]).map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 text-sm">
                      <Badge className={`${STATUS_CONFIG[h.newStatus]?.class ?? ""} border text-xs`}>{STATUS_CONFIG[h.newStatus]?.label ?? h.newStatus}</Badge>
                      <span className="text-muted-foreground">{h.changedByName}</span>
                      {h.note && <span className="text-muted-foreground">— {h.note}</span>}
                      <span className="text-muted-foreground mr-auto text-xs">{new Date(h.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">ملخص الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">العميل</span><span className="font-medium">{order.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المركبة</span><span className="font-medium">{order.vehicleMake} {order.vehicleModel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">اللوحة</span><span className="font-medium font-mono">{order.vehiclePlate}</span></div>
              {order.assignedTechnicianName && <div className="flex justify-between"><span className="text-muted-foreground">الفني</span><span className="font-medium">{order.assignedTechnicianName}</span></div>}
              {order.mileageAtReception && <div className="flex justify-between"><span className="text-muted-foreground">العداد</span><span className="font-mono">{Number(order.mileageAtReception).toLocaleString()} كم</span></div>}
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">الخدمات</span><span className="font-mono">{totalServices.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">قطع الغيار</span><span className="font-mono">{totalParts.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>الإجمالي</span><span className="font-mono text-primary">{grandTotal.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          {order.customerComplaint && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">شكوى العميل</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{order.customerComplaint}</p></CardContent>
            </Card>
          )}

          {order.diagnosisNotes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ملاحظات الفحص</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{order.diagnosisNotes}</p></CardContent>
            </Card>
          )}

          {order.invoice && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">الفاتورة {(order.invoice as any).invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المدفوع</span>
                  <span className="font-mono">{Number((order.invoice as any).totalPaid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المتبقي</span>
                  <span className={`font-mono ${Number((order.invoice as any).balanceDue) > 0 ? "text-destructive" : "text-green-400"}`}>{Number((order.invoice as any).balanceDue).toLocaleString()}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setLocation(`/invoices/${(order.invoice as any).id}`)}>عرض الفاتورة</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

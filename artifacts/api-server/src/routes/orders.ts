import { Router } from "express";
import { db } from "../lib/db";
import { workOrdersTable, orderServicesTable, orderPartsTable, orderPhotosTable, orderStatusHistoryTable, invoicesTable, vehiclesTable, customersTable, usersTable, techniciansTable } from "@workspace/db";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import { requireStaff } from "../lib/auth";
import { nanoid } from "nanoid";

const router = Router();

function orderNumber(tenantId: number): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `GR-${y}${m}-${rand}`;
}

async function enrichOrder(o: typeof workOrdersTable.$inferSelect) {
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, o.vehicleId)).limit(1);
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, o.customerId)).limit(1);
  let techName: string | null = null;
  if (o.assignedTechnicianId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, o.assignedTechnicianId)).limit(1);
    techName = u?.fullName ?? null;
  }
  return {
    ...o,
    customerName: customer?.fullName ?? "",
    vehiclePlate: vehicle?.plateNumber ?? "",
    vehicleMake: vehicle?.make ?? "",
    vehicleModel: vehicle?.model ?? "",
    vehicleYear: vehicle?.year ?? 0,
    assignedTechnicianName: techName,
  };
}

router.get("/orders", requireStaff, async (req, res) => {
  const { status, technicianId, priority, page: pg } = req.query;
  const page = Math.max(1, Number(pg) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = db.select().from(workOrdersTable).orderBy(desc(workOrdersTable.createdAt)).$dynamic();
  if (status) query = query.where(eq(workOrdersTable.status, status as string));
  if (technicianId) query = query.where(eq(workOrdersTable.assignedTechnicianId, Number(technicianId)));
  if (priority) query = query.where(eq(workOrdersTable.priority, priority as string));

  const all = await query;
  const data = all.slice(offset, offset + limit);
  const enriched = await Promise.all(data.map(enrichOrder));
  res.json({ data: enriched, total: all.length, page });
});

router.post("/orders", requireStaff, async (req, res) => {
  const { vehicleId, customerId, customerComplaint, priority, mileageAtReception, fuelLevel, estimatedDurationHours, estimatedCostMin, estimatedCostMax, estimatedDeliveryAt, assignedTechnicianId, internalNotes } = req.body;
  const [order] = await db.insert(workOrdersTable).values({
    tenantId: req.session.tenantId,
    orderNumber: orderNumber(req.session.tenantId ?? 1),
    vehicleId, customerId, customerComplaint, priority: priority || "normal",
    mileageAtReception, fuelLevel,
    estimatedDurationHours: estimatedDurationHours?.toString(),
    estimatedCostMin: estimatedCostMin?.toString(), estimatedCostMax: estimatedCostMax?.toString(),
    estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : undefined,
    assignedTechnicianId, internalNotes, createdBy: req.session.userId,
    trackingToken: nanoid(16),
    trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).returning();
  await db.insert(orderStatusHistoryTable).values({ orderId: order.id, oldStatus: "none", newStatus: "received", changedBy: req.session.userId });
  res.status(201).json(await enrichOrder(order));
});

router.get("/orders/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const services = await db.select().from(orderServicesTable).where(eq(orderServicesTable.orderId, id));
  const parts = await db.select().from(orderPartsTable).where(eq(orderPartsTable.orderId, id));
  const photos = await db.select().from(orderPhotosTable).where(eq(orderPhotosTable.orderId, id));
  const statusHistory = await db.select().from(orderStatusHistoryTable).where(eq(orderStatusHistoryTable.orderId, id)).orderBy(desc(orderStatusHistoryTable.createdAt));
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.orderId, id)).limit(1);
  const enriched = await enrichOrder(order);
  const historyWithNames = await Promise.all(statusHistory.map(async h => {
    const [u] = h.changedBy ? await db.select().from(usersTable).where(eq(usersTable.id, h.changedBy)).limit(1) : [null];
    return { ...h, changedByName: u?.fullName ?? "System" };
  }));
  res.json({ ...enriched, services, parts, photos, statusHistory: historyWithNames, invoice: invoice ?? null });
});

router.put("/orders/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { customerComplaint, priority, diagnosisNotes, workDescription, internalNotes, estimatedCostMin, estimatedCostMax, estimatedDeliveryAt, assignedTechnicianId, discountAmount, discountReason, taxRate } = req.body;
  const [order] = await db.update(workOrdersTable).set({ customerComplaint, priority, diagnosisNotes, workDescription, internalNotes, estimatedCostMin: estimatedCostMin?.toString(), estimatedCostMax: estimatedCostMax?.toString(), estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : undefined, assignedTechnicianId, discountAmount: discountAmount?.toString(), discountReason, taxRate: taxRate?.toString() }).where(eq(workOrdersTable.id, id)).returning();
  res.json(await enrichOrder(order));
});

router.patch("/orders/:id/status", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body;
  const [current] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id)).limit(1);
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(workOrdersTable).set({ status, ...(status === "delivered" ? { actualDeliveryAt: new Date() } : {}) }).where(eq(workOrdersTable.id, id));
  await db.insert(orderStatusHistoryTable).values({ orderId: id, oldStatus: current.status, newStatus: status, changedBy: req.session.userId, note });
  res.json({ ok: true });
});

router.post("/orders/:id/services", requireStaff, async (req, res) => {
  const orderId = Number(req.params.id);
  const { serviceNameAr, serviceNameEn, descriptionAr, quantity, unitPrice, warrantyDays } = req.body;
  const total = parseFloat(quantity) * parseFloat(unitPrice);
  const [s] = await db.insert(orderServicesTable).values({ orderId, serviceNameAr, serviceNameEn, descriptionAr, quantity: quantity.toString(), unitPrice: unitPrice.toString(), totalPrice: total.toString(), warrantyDays }).returning();
  // recalculate
  const allServices = await db.select().from(orderServicesTable).where(eq(orderServicesTable.orderId, orderId));
  const laborTotal = allServices.reduce((sum, s) => sum + parseFloat(s.totalPrice), 0);
  await db.update(workOrdersTable).set({ totalLaborCost: laborTotal.toString() }).where(eq(workOrdersTable.id, orderId));
  res.status(201).json(s);
});

router.delete("/orders/:id/services/:serviceId", requireStaff, async (req, res) => {
  await db.delete(orderServicesTable).where(eq(orderServicesTable.id, Number(req.params.serviceId)));
  res.json({ ok: true });
});

router.post("/orders/:id/parts", requireStaff, async (req, res) => {
  const orderId = Number(req.params.id);
  const { partNameAr, partNameEn, partNumber, brand, quantity, unitCost, unitPrice, warrantyDays } = req.body;
  const totalCost = parseFloat(quantity) * parseFloat(unitCost);
  const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
  const [p] = await db.insert(orderPartsTable).values({ orderId, partNameAr, partNameEn, partNumber, brand, quantity: quantity.toString(), unitCost: unitCost.toString(), unitPrice: unitPrice.toString(), totalCost: totalCost.toString(), totalPrice: totalPrice.toString(), warrantyDays }).returning();
  const allParts = await db.select().from(orderPartsTable).where(eq(orderPartsTable.orderId, orderId));
  const partsTotal = allParts.reduce((sum, p) => sum + parseFloat(p.totalPrice), 0);
  await db.update(workOrdersTable).set({ totalPartsCost: partsTotal.toString() }).where(eq(workOrdersTable.id, orderId));
  res.status(201).json(p);
});

router.delete("/orders/:id/parts/:partId", requireStaff, async (req, res) => {
  await db.delete(orderPartsTable).where(eq(orderPartsTable.id, Number(req.params.partId)));
  res.json({ ok: true });
});

router.post("/orders/:id/invoice", requireStaff, async (req, res) => {
  const orderId = Number(req.params.id);
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, orderId)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const services = await db.select().from(orderServicesTable).where(eq(orderServicesTable.orderId, orderId));
  const parts = await db.select().from(orderPartsTable).where(eq(orderPartsTable.orderId, orderId));
  const laborTotal = services.reduce((s, x) => s + parseFloat(x.totalPrice), 0);
  const partsTotal = parts.reduce((s, x) => s + parseFloat(x.totalPrice), 0);
  const subtotal = laborTotal + partsTotal;
  const discount = parseFloat(order.discountAmount ?? "0");
  const taxRate = parseFloat(order.taxRate ?? "0");
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;
  const invNum = `INV-${Date.now().toString().slice(-8)}`;
  const [invoice] = await db.insert(invoicesTable).values({
    tenantId: order.tenantId, invoiceNumber: invNum, orderId, customerId: order.customerId,
    subtotal: subtotal.toString(), discountAmount: discount.toString(), taxRate: taxRate.toString(),
    taxAmount: taxAmount.toString(), total: total.toString(), totalPaid: "0", balanceDue: total.toString(),
    currency: "IQD", status: "issued", paymentStatus: "pending", issuedAt: new Date(), createdBy: req.session.userId,
  }).returning();
  await db.update(workOrdersTable).set({ grandTotal: total.toString(), paymentStatus: "pending" }).where(eq(workOrdersTable.id, orderId));
  res.status(201).json(invoice);
});

router.get("/orders/:id/tracking-link", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const token = order.trackingToken ?? nanoid(16);
  if (!order.trackingToken) {
    await db.update(workOrdersTable).set({ trackingToken: token, trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }).where(eq(workOrdersTable.id, id));
  }
  const url = `/track/${token}`;
  res.json({ token, url, expiresAt: (order.trackingTokenExpiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString() });
});

router.get("/track/:token", async (req, res) => {
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.trackingToken, req.params.token)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, order.vehicleId)).limit(1);
  const stages = ["received", "diagnosing", "waiting_approval", "in_progress", "waiting_parts", "ready", "delivered"];
  const currentIdx = stages.indexOf(order.status);
  const stageLabels: Record<string, string> = { received: "استلام", diagnosing: "تشخيص", waiting_approval: "انتظار موافقة", in_progress: "قيد التنفيذ", waiting_parts: "انتظار قطع", ready: "جاهز", delivered: "تم التسليم" };
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : "",
    customerComplaint: order.customerComplaint,
    estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString() ?? null,
    stages: stages.map((s, i) => ({ stage: s, completed: i <= currentIdx, label: stageLabels[s] ?? s })),
  });
});

export default router;

import { Router } from "express";
import { db } from "../lib/db";
import { invoicesTable, paymentsTable, customersTable, vehiclesTable, workOrdersTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.get("/invoices", requireStaff, async (req, res) => {
  const { status, page: pg } = req.query;
  const page = Math.max(1, Number(pg) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).$dynamic();
  if (status) query = query.where(eq(invoicesTable.paymentStatus, status as string));
  const all = await query;
  const data = all.slice(offset, offset + limit);

  const enriched = await Promise.all(data.map(async (inv) => {
    const [c] = await db.select().from(customersTable).where(eq(customersTable.id, inv.customerId)).limit(1);
    const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, inv.orderId)).limit(1);
    const [vehicle] = order ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, order.vehicleId)).limit(1) : [null];
    return { ...inv, customerName: c?.fullName ?? "", vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.plateNumber}` : "" };
  }));

  res.json({ data: enriched, total: all.length, page });
});

router.get("/invoices/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, inv.customerId)).limit(1);
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, inv.orderId)).limit(1);
  const [vehicle] = order ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, order.vehicleId)).limit(1) : [null];
  res.json({ ...inv, customerName: c?.fullName ?? "", vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.plateNumber}` : "" });
});

router.get("/invoices/:id/payments", requireStaff, async (req, res) => {
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.invoiceId, Number(req.params.id))).orderBy(desc(paymentsTable.createdAt));
  const enriched = await Promise.all(payments.map(async (p) => {
    const [u] = p.receivedBy ? await db.select().from(usersTable).where(eq(usersTable.id, p.receivedBy)).limit(1) : [null];
    return { ...p, receivedByName: u?.fullName ?? null, paymentDate: p.paymentDate.toISOString() };
  }));
  res.json(enriched);
});

router.post("/invoices/:id/payments", requireStaff, async (req, res) => {
  const invoiceId = Number(req.params.id);
  const { amount, paymentMethod, paymentReference, paymentDate, notes } = req.body;
  const [payment] = await db.insert(paymentsTable).values({
    invoiceId, tenantId: req.session.tenantId,
    amount: amount.toString(), paymentMethod, paymentReference,
    paymentDate: new Date(paymentDate),
    receivedBy: req.session.userId, notes,
  }).returning();

  // Update invoice
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId)).limit(1);
  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.invoiceId, invoiceId));
  const totalPaid = allPayments.filter(p => !p.isRefund).reduce((s, p) => s + parseFloat(p.amount), 0);
  const balanceDue = parseFloat(inv.total) - totalPaid;
  const paymentStatus = balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : "pending";
  const paidAt = paymentStatus === "paid" ? new Date() : inv.paidAt;
  await db.update(invoicesTable).set({ totalPaid: totalPaid.toString(), balanceDue: balanceDue.toString(), paymentStatus, paidAt }).where(eq(invoicesTable.id, invoiceId));
  // Also update the order payment status
  if (paymentStatus === "paid") {
    await db.update(workOrdersTable).set({ paymentStatus: "paid" }).where(eq(workOrdersTable.id, inv.orderId));
  }
  res.status(201).json({ ...payment, receivedByName: null, paymentDate: payment.paymentDate.toISOString() });
});

export default router;

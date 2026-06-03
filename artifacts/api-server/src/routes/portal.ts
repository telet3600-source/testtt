import { Router } from "express";
import { db } from "../lib/db";
import { customersTable, usersTable, workOrdersTable, vehiclesTable, invoicesTable, orderServicesTable, orderPartsTable, orderStatusHistoryTable, reviewsTable, paymentsTable } from "@workspace/db";
import { eq, and, desc, sum } from "drizzle-orm";
import { verifyPassword, hashPassword, requirePortal } from "../lib/auth";

const router = Router();

router.post("/portal/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) { res.status(400).json({ error: "Phone and password required" }); return; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.phonePrimary, phone)).limit(1);
  if (!customer) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const user = customer.userId ? (await db.select().from(usersTable).where(eq(usersTable.id, customer.userId)).limit(1))[0] : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) { res.status(401).json({ error: "Invalid credentials" }); return; }
  req.session.customerId = customer.id;
  req.session.tenantId = customer.tenantId ?? 1;
  const isFirstLogin = user.isFirstLogin;
  res.json({ customer: { id: customer.id, fullName: customer.fullName, phonePrimary: customer.phonePrimary, isFirstLogin, vehiclesCount: 0 }, isFirstLogin });
});

router.post("/portal/logout", (req, res) => { req.session.destroy(() => {}); res.json({ ok: true }); });

router.get("/portal/me", requirePortal, async (req, res) => {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, req.session.customerId!)).limit(1);
  if (!customer) { res.status(404).json({ error: "Not found" }); return; }
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.customerId, customer.id));
  res.json({ id: customer.id, fullName: customer.fullName, phonePrimary: customer.phonePrimary, isFirstLogin: false, vehiclesCount: vehicles.length });
});

router.post("/portal/change-password", requirePortal, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, req.session.customerId!)).limit(1);
  if (!customer?.userId) { res.status(404).json({ error: "Not found" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, customer.userId)).limit(1);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) { res.status(400).json({ error: "Wrong current password" }); return; }
  await db.update(usersTable).set({ passwordHash: await hashPassword(newPassword), isFirstLogin: false }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

router.get("/portal/orders", requirePortal, async (req, res) => {
  const orders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.customerId, req.session.customerId!)).orderBy(desc(workOrdersTable.createdAt));
  res.json(orders.map(o => ({ ...o, customerName: "", vehiclePlate: "", vehicleMake: "", vehicleModel: "", vehicleYear: 0, assignedTechnicianName: null })));
});

router.get("/portal/orders/:id", requirePortal, async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(workOrdersTable).where(and(eq(workOrdersTable.id, id), eq(workOrdersTable.customerId, req.session.customerId!))).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, order.vehicleId)).limit(1);
  const services = await db.select().from(orderServicesTable).where(eq(orderServicesTable.orderId, id));
  const parts = await db.select().from(orderPartsTable).where(eq(orderPartsTable.orderId, id));
  const statusHistory = await db.select().from(orderStatusHistoryTable).where(eq(orderStatusHistoryTable.orderId, id)).orderBy(desc(orderStatusHistoryTable.createdAt));
  res.json({ ...order, vehicle, services, parts, photos: [], statusHistory, invoice: null });
});

router.post("/portal/orders/:id/approve", requirePortal, async (req, res) => {
  const id = Number(req.params.id);
  const { approved, notes } = req.body;
  await db.update(workOrdersTable).set({ customerApproved: approved, customerApprovalNotes: notes, customerApprovedAt: new Date() }).where(and(eq(workOrdersTable.id, id), eq(workOrdersTable.customerId, req.session.customerId!)));
  res.json({ ok: true });
});

router.get("/portal/vehicles", requirePortal, async (req, res) => {
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.customerId, req.session.customerId!));
  res.json(vehicles.map(v => ({ ...v, customerName: "" })));
});

router.get("/portal/vehicles/:id/history", requirePortal, async (req, res) => {
  const id = Number(req.params.id);
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, id), eq(vehiclesTable.customerId, req.session.customerId!))).limit(1);
  if (!vehicle) { res.status(404).json({ error: "Not found" }); return; }
  const orders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.vehicleId, id)).orderBy(desc(workOrdersTable.createdAt));
  res.json({ vehicle: { ...vehicle, customerName: "" }, orders: orders.map(o => ({ ...o, customerName: "", vehiclePlate: vehicle.plateNumber, vehicleMake: vehicle.make, vehicleModel: vehicle.model, vehicleYear: vehicle.year, assignedTechnicianName: null })), oilRecords: [] });
});

router.get("/portal/balance", requirePortal, async (req, res) => {
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, req.session.customerId!));
  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.total), 0);
  const totalPaid = invoices.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
  const overdue = invoices.filter(i => i.paymentStatus !== "paid");
  res.json({ totalInvoiced, totalPaid, balanceDue: totalInvoiced - totalPaid, overdueInvoices: overdue });
});

router.post("/portal/reviews", requirePortal, async (req, res) => {
  const { orderId, overallRating, speedRating, qualityRating, communicationRating, cleanlinessRating, commentAr } = req.body;
  const [review] = await db.insert(reviewsTable).values({ orderId, customerId: req.session.customerId!, overallRating, speedRating, qualityRating, communicationRating, cleanlinessRating, commentAr, tenantId: req.session.tenantId }).returning();
  res.status(201).json(review);
});

export default router;

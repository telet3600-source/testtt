import { Router } from "express";
import { db } from "../lib/db";
import { customersTable, vehiclesTable, workOrdersTable, invoicesTable } from "@workspace/db";
import { eq, like, desc, count, or, ilike } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.get("/customers", requireStaff, async (req, res) => {
  const search = req.query.search as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  let query = db.select().from(customersTable).orderBy(desc(customersTable.createdAt)).$dynamic();
  if (search) {
    query = query.where(
      or(
        ilike(customersTable.fullName, `%${search}%`),
        ilike(customersTable.phonePrimary, `%${search}%`)
      )
    );
  }
  const all = await query;
  const data = all.slice(offset, offset + limit);

  const enriched = await Promise.all(data.map(async (c) => {
    const vehicles = await db.select({ count: count() }).from(vehiclesTable).where(eq(vehiclesTable.customerId, c.id));
    const orders = await db.select({ count: count() }).from(workOrdersTable).where(eq(workOrdersTable.customerId, c.id));
    const invs = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, c.id));
    const totalSpent = invs.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
    return { ...c, vehiclesCount: vehicles[0]?.count ?? 0, totalOrders: orders[0]?.count ?? 0, totalSpent };
  }));

  res.json({ data: enriched, total: all.length, page });
});

router.post("/customers", requireStaff, async (req, res) => {
  const { fullName, phonePrimary, phoneSecondary, email, address, gender, ownerType, notes } = req.body;
  const [customer] = await db.insert(customersTable).values({ fullName, phonePrimary, phoneSecondary, email, address, gender, ownerType: ownerType || "individual", notes, tenantId: req.session.tenantId, createdBy: req.session.userId }).returning();
  res.status(201).json({ ...customer, vehiclesCount: 0, totalOrders: 0, totalSpent: 0 });
});

router.get("/customers/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  const vehicles = await db.select({ count: count() }).from(vehiclesTable).where(eq(vehiclesTable.customerId, id));
  const orders = await db.select({ count: count() }).from(workOrdersTable).where(eq(workOrdersTable.customerId, id));
  const invs = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, id));
  const totalSpent = invs.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
  res.json({ ...c, vehiclesCount: vehicles[0]?.count ?? 0, totalOrders: orders[0]?.count ?? 0, totalSpent });
});

router.put("/customers/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { fullName, phonePrimary, phoneSecondary, email, address, notes } = req.body;
  const [c] = await db.update(customersTable).set({ fullName, phonePrimary, phoneSecondary, email, address, notes }).where(eq(customersTable.id, id)).returning();
  res.json({ ...c, vehiclesCount: 0, totalOrders: 0, totalSpent: 0 });
});

router.delete("/customers/:id", requireStaff, async (req, res) => {
  await db.update(customersTable).set({ isActive: false, deletedAt: new Date() }).where(eq(customersTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.get("/customers/:id/vehicles", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [c] = await db.select({ fullName: customersTable.fullName }).from(customersTable).where(eq(customersTable.id, id)).limit(1);
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.customerId, id));
  res.json(vehicles.map(v => ({ ...v, customerName: c?.fullName ?? "" })));
});

router.get("/customers/:id/orders", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const orders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.customerId, id)).orderBy(desc(workOrdersTable.createdAt));
  res.json(orders.map(o => ({ ...o, customerName: "", vehiclePlate: "", vehicleMake: "", vehicleModel: "", vehicleYear: 0, assignedTechnicianName: null })));
});

router.get("/customers/:id/balance", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const invs = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, id));
  const totalInvoiced = invs.reduce((s, i) => s + parseFloat(i.total), 0);
  const totalPaid = invs.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
  const overdue = invs.filter(i => i.paymentStatus !== "paid");
  res.json({ totalInvoiced, totalPaid, balanceDue: totalInvoiced - totalPaid, overdueInvoices: overdue });
});

export default router;

import { Router } from "express";
import { db } from "../lib/db";
import { techniciansTable, usersTable, workOrdersTable, reviewsTable } from "@workspace/db";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { requireStaff } from "../lib/auth";
import { hashPassword } from "../lib/auth";

const router = Router();

router.get("/technicians", requireStaff, async (req, res) => {
  const rows = await db.select({ t: techniciansTable, u: usersTable }).from(techniciansTable).leftJoin(usersTable, eq(techniciansTable.userId, usersTable.id)).where(eq(usersTable.isActive, true));
  const enriched = await Promise.all(rows.map(async ({ t, u }) => {
    const active = await db.select({ count: count() }).from(workOrdersTable).where(and(eq(workOrdersTable.assignedTechnicianId, u!.id), eq(workOrdersTable.status, "in_progress")));
    return {
      id: t.id, userId: t.userId, fullName: u?.fullName ?? "", email: u?.email ?? "", phone: u?.phone ?? null,
      specialization: t.specialization, shift: t.shift, isAvailable: t.isAvailable,
      ratingAverage: t.ratingAverage ? parseFloat(t.ratingAverage) : null,
      totalOrdersCompleted: t.totalOrdersCompleted, activeOrdersCount: active[0]?.count ?? 0,
    };
  }));
  res.json(enriched);
});

router.post("/technicians", requireStaff, async (req, res) => {
  const { fullName, email, password, phone, specialization, shift } = req.body;
  const [user] = await db.insert(usersTable).values({ fullName, email, passwordHash: await hashPassword(password), role: "technician", phone, tenantId: req.session.tenantId, isActive: true }).returning();
  const [tech] = await db.insert(techniciansTable).values({ userId: user.id, specialization: specialization || [], shift: shift || "morning", tenantId: req.session.tenantId }).returning();
  res.status(201).json({ id: tech.id, userId: tech.userId, fullName, email, phone: phone ?? null, specialization: tech.specialization, shift: tech.shift, isAvailable: tech.isAvailable, ratingAverage: null, totalOrdersCompleted: 0, activeOrdersCount: 0 });
});

router.get("/technicians/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select({ t: techniciansTable, u: usersTable }).from(techniciansTable).leftJoin(usersTable, eq(techniciansTable.userId, usersTable.id)).where(eq(techniciansTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const active = await db.select({ count: count() }).from(workOrdersTable).where(and(eq(workOrdersTable.assignedTechnicianId, row.u!.id), eq(workOrdersTable.status, "in_progress")));
  res.json({ id: row.t.id, userId: row.t.userId, fullName: row.u?.fullName ?? "", email: row.u?.email ?? "", phone: row.u?.phone ?? null, specialization: row.t.specialization, shift: row.t.shift, isAvailable: row.t.isAvailable, ratingAverage: row.t.ratingAverage ? parseFloat(row.t.ratingAverage) : null, totalOrdersCompleted: row.t.totalOrdersCompleted, activeOrdersCount: active[0]?.count ?? 0 });
});

router.put("/technicians/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { fullName, phone, specialization, shift, isAvailable } = req.body;
  const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
  if (!tech) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(usersTable).set({ fullName, phone }).where(eq(usersTable.id, tech.userId));
  const [t] = await db.update(techniciansTable).set({ specialization, shift, isAvailable }).where(eq(techniciansTable.id, id)).returning();
  res.json({ id: t.id, userId: t.userId, fullName, phone, specialization: t.specialization, shift: t.shift, isAvailable: t.isAvailable, ratingAverage: t.ratingAverage ? parseFloat(t.ratingAverage) : null, totalOrdersCompleted: t.totalOrdersCompleted, activeOrdersCount: 0 });
});

router.get("/technicians/:id/orders", requireStaff, async (req, res) => {
  const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, Number(req.params.id))).limit(1);
  if (!tech) { res.status(404).json({ error: "Not found" }); return; }
  const orders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.assignedTechnicianId, tech.userId)).orderBy(desc(workOrdersTable.createdAt)).limit(20);
  res.json(orders.map(o => ({ ...o, customerName: "", vehiclePlate: "", vehicleMake: "", vehicleModel: "", vehicleYear: 0, assignedTechnicianName: null })));
});

router.get("/technicians/:id/stats", requireStaff, async (req, res) => {
  const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, Number(req.params.id))).limit(1);
  if (!tech) { res.status(404).json({ error: "Not found" }); return; }
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.technicianId, tech.id));
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length : 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = await db.select({ count: count() }).from(workOrdersTable).where(and(eq(workOrdersTable.assignedTechnicianId, tech.userId), eq(workOrdersTable.status, "delivered")));
  res.json({ totalCompleted: tech.totalOrdersCompleted, averageRating: Math.round(avgRating * 10) / 10, totalRevenue: 0, ordersThisMonth: monthOrders[0]?.count ?? 0 });
});

export default router;

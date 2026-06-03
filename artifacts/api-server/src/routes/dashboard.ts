import { Router } from "express";
import { db } from "../lib/db";
import { workOrdersTable, invoicesTable, reviewsTable, vehiclesTable, customersTable, usersTable, auditLogsTable } from "@workspace/db";
import { eq, and, gte, count, desc } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.get("/dashboard/stats", requireStaff, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const allOrders = await db.select().from(workOrdersTable);
  const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= today).length;
  const ordersThisMonth = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth).length;

  const carsInGarage = allOrders.filter(o => !["delivered", "cancelled"].includes(o.status)).length;
  const pendingApprovals = allOrders.filter(o => o.status === "waiting_approval").length;
  const readyForDelivery = allOrders.filter(o => o.status === "ready").length;

  const invToday = await db.select().from(invoicesTable).where(gte(invoicesTable.createdAt, today));
  const revenueToday = invToday.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
  const invMonth = await db.select().from(invoicesTable).where(gte(invoicesTable.createdAt, startOfMonth));
  const revenueThisMonth = invMonth.reduce((s, i) => s + parseFloat(i.totalPaid), 0);

  const reviews = await db.select().from(reviewsTable);
  const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length : 0;

  res.json({ ordersToday, revenueToday, carsInGarage, averageRating: Math.round(averageRating * 10) / 10, pendingApprovals, readyForDelivery, revenueThisMonth, ordersThisMonth });
});

router.get("/dashboard/orders-pipeline", requireStaff, async (req, res) => {
  const allOrders = await db.select().from(workOrdersTable).where(
    and(
      // exclude terminal statuses from pipeline
    )
  ).orderBy(desc(workOrdersTable.createdAt)).limit(100);

  async function enrich(o: typeof workOrdersTable.$inferSelect) {
    const [v] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, o.vehicleId)).limit(1);
    const [c] = await db.select().from(customersTable).where(eq(customersTable.id, o.customerId)).limit(1);
    return { ...o, customerName: c?.fullName ?? "", vehiclePlate: v?.plateNumber ?? "", vehicleMake: v?.make ?? "", vehicleModel: v?.model ?? "", vehicleYear: v?.year ?? 0, assignedTechnicianName: null };
  }

  const received = await Promise.all(allOrders.filter(o => o.status === "received").slice(0, 10).map(enrich));
  const diagnosing = await Promise.all(allOrders.filter(o => o.status === "diagnosing").slice(0, 10).map(enrich));
  const waitingApproval = await Promise.all(allOrders.filter(o => o.status === "waiting_approval").slice(0, 10).map(enrich));
  const inProgress = await Promise.all(allOrders.filter(o => o.status === "in_progress").slice(0, 10).map(enrich));
  const waitingParts = await Promise.all(allOrders.filter(o => o.status === "waiting_parts").slice(0, 10).map(enrich));
  const ready = await Promise.all(allOrders.filter(o => o.status === "ready").slice(0, 10).map(enrich));

  res.json({ received, diagnosing, waitingApproval, inProgress, waitingParts, ready });
});

router.get("/dashboard/recent-activity", requireStaff, async (req, res) => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(20);
  res.json(logs.map(l => ({
    id: l.id, type: l.action, description: l.description ?? "", actorName: "Staff",
    orderId: l.entityType === "order" ? l.entityId : null,
    orderNumber: null, createdAt: l.createdAt.toISOString(),
  })));
});

router.get("/dashboard/upcoming-deliveries", requireStaff, async (req, res) => {
  const orders = await db.select().from(workOrdersTable).where(eq(workOrdersTable.status, "ready")).orderBy(workOrdersTable.estimatedDeliveryAt).limit(10);
  const enriched = await Promise.all(orders.map(async (o) => {
    const [v] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, o.vehicleId)).limit(1);
    const [c] = await db.select().from(customersTable).where(eq(customersTable.id, o.customerId)).limit(1);
    return { ...o, customerName: c?.fullName ?? "", vehiclePlate: v?.plateNumber ?? "", vehicleMake: v?.make ?? "", vehicleModel: v?.model ?? "", vehicleYear: v?.year ?? 0, assignedTechnicianName: null };
  }));
  res.json(enriched);
});

export default router;

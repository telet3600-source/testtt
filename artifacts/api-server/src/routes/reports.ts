import { Router } from "express";
import { db } from "../lib/db";
import { invoicesTable, workOrdersTable, techniciansTable, usersTable, customersTable, reviewsTable } from "@workspace/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.get("/reports/financial", requireStaff, async (req, res) => {
  const allInvoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
  const totalInvoiced = allInvoices.reduce((s, i) => s + parseFloat(i.total), 0);
  const totalCollected = allInvoices.reduce((s, i) => s + parseFloat(i.totalPaid), 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const totalOrders = await db.select().from(workOrdersTable);

  // group by month
  const byMonthMap = new Map<string, { revenue: number; orders: number }>();
  for (const inv of allInvoices) {
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = byMonthMap.get(key) ?? { revenue: 0, orders: 0 };
    existing.revenue += parseFloat(inv.totalPaid);
    existing.orders += 1;
    byMonthMap.set(key, existing);
  }
  const byPeriod = Array.from(byMonthMap.entries()).map(([period, v]) => ({ period, ...v })).sort((a, b) => a.period.localeCompare(b.period));

  res.json({ totalRevenue: totalCollected, totalOrders: totalOrders.length, totalInvoiced, totalCollected, totalOutstanding, byPeriod });
});

router.get("/reports/technicians-performance", requireStaff, async (req, res) => {
  const techs = await db.select({ t: techniciansTable, u: usersTable }).from(techniciansTable).leftJoin(usersTable, eq(techniciansTable.userId, usersTable.id));
  const result = await Promise.all(techs.map(async ({ t, u }) => {
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.technicianId, t.id));
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length : 0;
    return { technicianId: t.id, fullName: u?.fullName ?? "", completedOrders: t.totalOrdersCompleted, averageRating: Math.round(avgRating * 10) / 10, totalRevenue: 0 };
  }));
  res.json(result);
});

router.get("/reports/debts", requireStaff, async (req, res) => {
  const customers = await db.select().from(customersTable).where(eq(customersTable.isActive, true));
  const debtors = [];
  for (const c of customers) {
    const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, c.id));
    const totalDebt = invoices.filter(i => i.paymentStatus !== "paid").reduce((s, i) => s + parseFloat(i.balanceDue), 0);
    if (totalDebt > 0) {
      const oldestOverdue = invoices.filter(i => i.paymentStatus !== "paid").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      const daysDiff = oldestOverdue ? Math.floor((Date.now() - new Date(oldestOverdue.createdAt).getTime()) / 86400000) : 0;
      debtors.push({ customerId: c.id, customerName: c.fullName, phone: c.phonePrimary, totalDebt, oldestInvoiceDays: daysDiff });
    }
  }
  const totalOutstanding = debtors.reduce((s, d) => s + d.totalDebt, 0);
  res.json({ totalOutstanding, debtors: debtors.sort((a, b) => b.totalDebt - a.totalDebt) });
});

export default router;

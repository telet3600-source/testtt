import { Router } from "express";
import { db } from "../lib/db";
import { superAdminsTable, tenantsTable, usersTable, workOrdersTable } from "@workspace/db";
import { eq, and, desc, gte, count } from "drizzle-orm";
import { verifyPassword, hashPassword, requireSuperAdmin } from "../lib/auth";

const router = Router();

router.post("/superadmin/login", async (req, res) => {
  const { email, password } = req.body;
  const [admin] = await db.select().from(superAdminsTable).where(eq(superAdminsTable.email, email)).limit(1);
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  req.session.isSuperAdmin = true;
  req.session.userId = admin.id;
  await db.update(superAdminsTable).set({ lastLoginAt: new Date() }).where(eq(superAdminsTable.id, admin.id));
  res.json({ success: true, redirect: "/superadmin/dashboard" });
});

router.get("/superadmin/tenants", requireSuperAdmin, async (req, res) => {
  const tenants = await db.select().from(tenantsTable).orderBy(desc(tenantsTable.createdAt));
  res.json(tenants);
});

router.post("/superadmin/tenants", requireSuperAdmin, async (req, res) => {
  const { slug, nameAr, nameEn, taglineAr, taglineEn, country, currency, plan, maxUsers, maxOrdersPerMonth, subscriptionEnd, adminEmail, adminPassword, adminName, phone, addressAr } = req.body;
  const [tenant] = await db.insert(tenantsTable).values({ slug, nameAr, nameEn, taglineAr, taglineEn, country: country || "IQ", currency: currency || "IQD", plan: plan || "full", maxUsers: maxUsers || 10, maxOrdersPerMonth: maxOrdersPerMonth || 500, subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : undefined, phone, addressAr }).returning();
  if (adminEmail && adminPassword && adminName) {
    await db.insert(usersTable).values({ tenantId: tenant.id, email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "admin", fullName: adminName, isActive: true });
  }
  res.status(201).json(tenant);
});

router.get("/superadmin/tenants/:id", requireSuperAdmin, async (req, res) => {
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, Number(req.params.id))).limit(1);
  if (!tenant) { res.status(404).json({ error: "Not found" }); return; }
  res.json(tenant);
});

router.put("/superadmin/tenants/:id", requireSuperAdmin, async (req, res) => {
  const { nameAr, nameEn, taglineAr, primaryColor, accentColor, plan, maxUsers, maxOrdersPerMonth, subscriptionEnd, isActive, phone, addressAr } = req.body;
  const [tenant] = await db.update(tenantsTable).set({ nameAr, nameEn, taglineAr, primaryColor, accentColor, plan, maxUsers, maxOrdersPerMonth, subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : undefined, isActive, phone, addressAr }).where(eq(tenantsTable.id, Number(req.params.id))).returning();
  res.json(tenant);
});

router.get("/superadmin/stats", requireSuperAdmin, async (req, res) => {
  const tenants = await db.select().from(tenantsTable);
  const activeTenants = tenants.filter(t => t.isActive).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = await db.select({ count: count() }).from(workOrdersTable).where(gte(workOrdersTable.createdAt, today));
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const expiring = tenants.filter(t => t.subscriptionEnd && new Date(t.subscriptionEnd) <= soon && t.isActive).length;
  res.json({ totalTenants: tenants.length, activeTenants, totalOrdersToday: todayOrders[0]?.count ?? 0, expiringSubscriptions: expiring });
});

export default router;

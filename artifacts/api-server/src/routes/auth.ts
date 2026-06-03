import { Router } from "express";
import { db } from "../lib/db";
import { usersTable } from "@workspace/db";
import { verifyPassword } from "../lib/auth";
import { eq, and } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const tenantId = req.session.tenantId ?? 1;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, email), eq(usersTable.isActive, true)))
    .limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.tenantId = user.tenantId ?? 1;
  req.session.garageId = user.tenantId ?? 1;
  const redirect = user.role === "technician" ? "/tech/orders" : "/dashboard";
  res.json({
    user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName, avatarUrl: user.avatarUrl ?? null, garageId: user.tenantId ?? null },
    redirect,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", requireStaff, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) { res.status(401).json({ error: "Not found" }); return; }
  res.json({ id: user.id, email: user.email, role: user.role, fullName: user.fullName, avatarUrl: user.avatarUrl ?? null, garageId: user.tenantId ?? null });
});

export default router;

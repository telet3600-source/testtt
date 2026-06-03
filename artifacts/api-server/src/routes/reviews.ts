import { Router } from "express";
import { db } from "../lib/db";
import { reviewsTable, customersTable, workOrdersTable, vehiclesTable, usersTable } from "@workspace/db";
import { eq, avg, count, desc } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

async function enrichReview(r: typeof reviewsTable.$inferSelect) {
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, r.customerId)).limit(1);
  const [order] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, r.orderId)).limit(1);
  const [vehicle] = order ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, order.vehicleId)).limit(1) : [null];
  return {
    ...r,
    customerName: c?.fullName ?? "",
    vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model}` : "",
    repliedAt: r.repliedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reviews", requireStaff, async (req, res) => {
  const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  res.json(await Promise.all(reviews.map(enrichReview)));
});

router.get("/reviews/stats", requireStaff, async (req, res) => {
  const reviews = await db.select().from(reviewsTable);
  if (!reviews.length) {
    res.json({ averageOverall: 0, averageSpeed: 0, averageQuality: 0, averageCommunication: 0, averageCleanliness: 0, totalReviews: 0 });
    return;
  }
  const avg = (key: keyof typeof reviews[0]) => reviews.filter(r => r[key] !== null).reduce((s, r) => s + Number(r[key]), 0) / reviews.length;
  res.json({
    averageOverall: Math.round(avg("overallRating") * 10) / 10,
    averageSpeed: Math.round(avg("speedRating") * 10) / 10,
    averageQuality: Math.round(avg("qualityRating") * 10) / 10,
    averageCommunication: Math.round(avg("communicationRating") * 10) / 10,
    averageCleanliness: Math.round(avg("cleanlinessRating") * 10) / 10,
    totalReviews: reviews.length,
  });
});

router.post("/reviews/:id/reply", requireStaff, async (req, res) => {
  const { replyText } = req.body;
  await db.update(reviewsTable).set({ replyText, repliedAt: new Date(), repliedBy: req.session.userId }).where(eq(reviewsTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;

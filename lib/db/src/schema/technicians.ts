import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tenantsTable } from "./tenants";

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  specialization: text("specialization").array().notNull().default([]),
  shift: text("shift").notNull().default("morning"),
  isAvailable: boolean("is_available").notNull().default(true),
  ratingAverage: numeric("rating_average").default("0"),
  totalOrdersCompleted: integer("total_orders_completed").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  technicianId: integer("technician_id"),
  overallRating: integer("overall_rating").notNull(),
  speedRating: integer("speed_rating"),
  qualityRating: integer("quality_rating"),
  communicationRating: integer("communication_rating"),
  cleanlinessRating: integer("cleanliness_rating"),
  commentAr: text("comment_ar"),
  commentEn: text("comment_en"),
  replyText: text("reply_text"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  repliedBy: integer("replied_by").references(() => usersTable.id),
  isPublic: boolean("is_public").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

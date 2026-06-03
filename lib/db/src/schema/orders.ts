import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { customersTable } from "./customers";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const workOrdersTable = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  orderNumber: text("order_number").notNull(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  status: text("status").notNull().default("received"),
  priority: text("priority").notNull().default("normal"),
  assignedTechnicianId: integer("assigned_technician_id").references(() => usersTable.id),
  mileageAtReception: integer("mileage_at_reception"),
  fuelLevel: text("fuel_level"),
  customerComplaint: text("customer_complaint"),
  diagnosisNotes: text("diagnosis_notes"),
  workDescription: text("work_description"),
  internalNotes: text("internal_notes"),
  estimatedDurationHours: numeric("estimated_duration_hours"),
  actualDurationHours: numeric("actual_duration_hours"),
  estimatedCostMin: numeric("estimated_cost_min"),
  estimatedCostMax: numeric("estimated_cost_max"),
  totalPartsCost: numeric("total_parts_cost").default("0"),
  totalLaborCost: numeric("total_labor_cost").default("0"),
  discountAmount: numeric("discount_amount").default("0"),
  discountReason: text("discount_reason"),
  taxRate: numeric("tax_rate").default("0"),
  grandTotal: numeric("grand_total").default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  customerApproved: boolean("customer_approved"),
  customerApprovedAt: timestamp("customer_approved_at", { withTimezone: true }),
  customerApprovalNotes: text("customer_approval_notes"),
  trackingToken: text("tracking_token"),
  trackingTokenExpiresAt: timestamp("tracking_token_expires_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true }),
  actualDeliveryAt: timestamp("actual_delivery_at", { withTimezone: true }),
  createdBy: integer("created_by").references(() => usersTable.id),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderStatusHistoryTable = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => workOrdersTable.id),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").references(() => usersTable.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderServicesTable = pgTable("order_services", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => workOrdersTable.id),
  serviceNameAr: text("service_name_ar").notNull(),
  serviceNameEn: text("service_name_en"),
  descriptionAr: text("description_ar"),
  quantity: numeric("quantity").notNull().default("1"),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  warrantyDays: integer("warranty_days"),
  technicianId: integer("technician_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderPartsTable = pgTable("order_parts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => workOrdersTable.id),
  partNameAr: text("part_name_ar").notNull(),
  partNameEn: text("part_name_en"),
  partNumber: text("part_number"),
  brand: text("brand"),
  quantity: numeric("quantity").notNull().default("1"),
  unitCost: numeric("unit_cost").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  totalCost: numeric("total_cost").notNull(),
  totalPrice: numeric("total_price").notNull(),
  warrantyDays: integer("warranty_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderPhotosTable = pgTable("order_photos", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => workOrdersTable.id),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull().default("inspection"), // inspection, during, final
  captionAr: text("caption_ar"),
  captionEn: text("caption_en"),
  visibleToCustomer: boolean("visible_to_customer").notNull().default(true),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrdersTable.$inferSelect;

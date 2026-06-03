import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { vehiclesTable } from "./vehicles";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const oilRecordsTable = pgTable("oil_records", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  type: text("type").notNull().default("synthetic"),
  brand: text("brand").notNull(),
  viscosity: text("viscosity"),
  quantityLiters: numeric("quantity_liters"),
  mileageAtChange: integer("mileage_at_change").notNull(),
  nextChangeMileage: integer("next_change_mileage"),
  nextChangeDate: timestamp("next_change_date", { withTimezone: true }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  description: text("description"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en"),
  bodyAr: text("body_ar").notNull(),
  bodyEn: text("body_en"),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  relatedEntity: text("related_entity"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  fullName: text("full_name").notNull(),
  phonePrimary: text("phone_primary").notNull(),
  phoneSecondary: text("phone_secondary"),
  email: text("email"),
  address: text("address"),
  gender: text("gender"), // male, female
  ownerType: text("owner_type").notNull().default("individual"), // individual, private_company, government, other
  ownerTypeCustomLabel: text("owner_type_custom_label"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => usersTable.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;

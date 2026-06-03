import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workOrdersTable } from "./orders";
import { customersTable } from "./customers";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  invoiceNumber: text("invoice_number").notNull(),
  orderId: integer("order_id").notNull().references(() => workOrdersTable.id),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  subtotal: numeric("subtotal").notNull().default("0"),
  discountAmount: numeric("discount_amount").notNull().default("0"),
  taxRate: numeric("tax_rate").notNull().default("0"),
  taxAmount: numeric("tax_amount").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
  totalPaid: numeric("total_paid").notNull().default("0"),
  balanceDue: numeric("balance_due").notNull().default("0"),
  currency: text("currency").notNull().default("IQD"),
  status: text("status").notNull().default("draft"), // draft, issued, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, partial, paid
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notesAr: text("notes_ar"),
  notesEn: text("notes_en"),
  createdBy: integer("created_by").references(() => usersTable.id),
  isVoid: boolean("is_void").notNull().default(false),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id),
  amount: numeric("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, card, transfer, wallet
  paymentReference: text("payment_reference"),
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
  receivedBy: integer("received_by").references(() => usersTable.id),
  notes: text("notes"),
  isRefund: boolean("is_refund").notNull().default(false),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerCreditTable = pgTable("customer_credit", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  balanceAmount: numeric("balance_amount").notNull().default("0"),
  currency: text("currency").notNull().default("IQD"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;

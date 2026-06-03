import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  taglineAr: text("tagline_ar"),
  taglineEn: text("tagline_en"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default("#1A1A2E"),
  accentColor: text("accent_color").notNull().default("#F59E0B"),
  country: text("country").notNull().default("IQ"),
  currency: text("currency").notNull().default("IQD"),
  languageDefault: text("language_default").notNull().default("ar"),
  invoicePrefix: text("invoice_prefix").notNull().default("GR-"),
  taxRateDefault: text("tax_rate_default").notNull().default("0"),
  taxLabelAr: text("tax_label_ar").notNull().default("ضريبة القيمة المضافة"),
  taxLabelEn: text("tax_label_en").notNull().default("VAT"),
  phone: text("phone"),
  addressAr: text("address_ar"),
  addressEn: text("address_en"),
  whatsappNumber: text("whatsapp_number"),
  website: text("website"),
  commercialRegister: text("commercial_register"),
  taxNumber: text("tax_number"),
  invoiceTermsAr: text("invoice_terms_ar"),
  invoiceTermsEn: text("invoice_terms_en"),
  invoiceFooterAr: text("invoice_footer_ar"),
  invoiceFooterEn: text("invoice_footer_en"),
  plan: text("plan").notNull().default("full"),
  maxUsers: integer("max_users").notNull().default(10),
  maxOrdersPerMonth: integer("max_orders_per_month").notNull().default(500),
  subscriptionStart: timestamp("subscription_start", { withTimezone: true }),
  subscriptionEnd: timestamp("subscription_end", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  displayScreenToken: text("display_screen_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;

import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  gameCode: text("game_code").notNull(),
  gameName: text("game_name").notNull(),
  productCode: text("product_code").notNull(),
  productName: text("product_name").notNull(),
  gameUserId: text("game_user_id").notNull(),
  gameServerId: text("game_server_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  digiflazzStatus: text("digiflazz_status").notNull().default("pending"),
  midtransOrderId: text("midtrans_order_id"),
  paymentUrl: text("payment_url"),
  snapToken: text("snap_token"),
  digiflazzRefId: text("digiflazz_ref_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

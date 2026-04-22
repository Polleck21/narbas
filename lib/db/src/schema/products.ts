import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull().unique(),
  gameName: text("game_name").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const denominationsTable = pgTable("denominations", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull(),
  productCode: text("product_code").notNull().unique(),
  productName: text("product_name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDenominationSchema = createInsertSchema(denominationsTable).omit({ id: true, createdAt: true });
export type InsertDenomination = z.infer<typeof insertDenominationSchema>;
export type Denomination = typeof denominationsTable.$inferSelect;

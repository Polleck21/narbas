import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, denominationsTable } from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import crypto from "crypto";
import { CreateOrderBody, GetOrderParams, CheckOrderByReferenceParams } from "@workspace/api-zod";
import { createSnapTransaction, coreApi } from "../lib/midtrans.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { gameCode, productCode, gameUserId, gameServerId, customerName, customerEmail, customerPhone } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.gameCode, gameCode)).limit(1);
  if (!product) {
    res.status(400).json({ error: "Game not found" });
    return;
  }

  const [denom] = await db.select().from(denominationsTable).where(eq(denominationsTable.productCode, productCode)).limit(1);
  if (!denom) {
    res.status(400).json({ error: "Product denomination not found" });
    return;
  }

  const orderId = `TOPUP-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  let snapToken: string | null = null;
  let paymentUrl: string | null = null;

  try {
    const txn = await createSnapTransaction({
      orderId,
      grossAmount: Number(denom.sellingPrice),
      customerName,
      customerEmail,
      customerPhone,
      itemName: `${product.gameName} - ${denom.productName}`,
      itemId: productCode,
    });
    snapToken = txn.token;
    paymentUrl = txn.redirect_url;
  } catch (err) {
    req.log.error({ err }, "Failed to create Midtrans transaction");
    res.status(500).json({ error: "Payment gateway error" });
    return;
  }

  const [order] = await db.insert(ordersTable).values({
    orderId,
    gameCode,
    gameName: product.gameName,
    productCode,
    productName: denom.productName,

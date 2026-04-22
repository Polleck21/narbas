import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, denominationsTable } from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import crypto from "crypto";
import { CreateOrderBody, GetOrderParams, CheckOrderByReferenceParams } from "@workspace/api-zod";
import { createSnapTransaction, coreApi } from "../lib/midtrans";
import { logger } from "../lib/logger";

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
    gameUserId,
    gameServerId: gameServerId ?? null,
    customerName,
    customerEmail,
    customerPhone,
    amount: denom.sellingPrice,
    paymentStatus: "pending",
    digiflazzStatus: "pending",
    midtransOrderId: orderId,
    snapToken,
    paymentUrl,
  }).returning();

  res.status(201).json({
    order: formatOrder(order),
    snapToken,
    paymentUrl,
  });
});

router.get("/orders/check/:referenceId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.referenceId) ? req.params.referenceId[0] : req.params.referenceId;
  const params = CheckOrderByReferenceParams.safeParse({ referenceId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderId, params.data.referenceId)).limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const params = GetOrderParams.safeParse({ orderId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderId, params.data.orderId)).limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

router.post("/payment/notification", async (req, res): Promise<void> => {
  try {
    const notification = await coreApi.transaction.notification(req.body);
    const { order_id, transaction_status, fraud_status } = notification;

    req.log.info({ order_id, transaction_status, fraud_status }, "Midtrans notification received");

    let paymentStatus = "pending";
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) {
        paymentStatus = "paid";
      }
    } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
      paymentStatus = "failed";
    }

    await db
      .update(ordersTable)
      .set({ paymentStatus })
      .where(eq(ordersTable.midtransOrderId, order_id));

    if (paymentStatus === "paid") {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.midtransOrderId, order_id)).limit(1);
      if (order && order.digiflazzStatus === "pending") {
        try {
          const { topUp } = await import("../lib/digiflazz");
          const result = await topUp({
            buyerSkuCode: order.productCode,
            customerNo: order.gameServerId ? `${order.gameUserId}(${order.gameServerId})` : order.gameUserId,
            refId: order.orderId,
          });
          await db.update(ordersTable).set({
            digiflazzStatus: result.status ?? "process",
            digiflazzRefId: result.ref_id,
          }).where(eq(ordersTable.id, order.id));
        } catch (err) {
          logger.error({ err, orderId: order.orderId }, "Digiflazz top-up failed after payment");
        }
      }
    }

    res.json({ success: true, message: "Notification processed" });
  } catch (err) {
    req.log.error({ err }, "Payment notification error");
    res.status(400).json({ success: false, message: "Invalid notification" });
  }
});

router.get("/transactions/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalOrders: count(ordersTable.id),
      totalRevenue: sum(ordersTable.amount),
    })
    .from(ordersTable);

  const [successCount] = await db
    .select({ count: count(ordersTable.id) })
    .from(ordersTable)
    .where(eq(ordersTable.paymentStatus, "paid"));

  const [pendingCount] = await db
    .select({ count: count(ordersTable.id) })
    .from(ordersTable)
    .where(eq(ordersTable.paymentStatus, "pending"));

  const popularGames = await db
    .select({
      gameCode: ordersTable.gameCode,
      gameName: ordersTable.gameName,
      orderCount: count(ordersTable.id),
    })
    .from(ordersTable)
    .groupBy(ordersTable.gameCode, ordersTable.gameName)
    .orderBy(desc(count(ordersTable.id)))
    .limit(5);

  res.json({
    totalOrders: Number(stats?.totalOrders ?? 0),
    successOrders: Number(successCount?.count ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    popularGames,
  });
});

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    amount: Number(order.amount),
  };
}

export default router;

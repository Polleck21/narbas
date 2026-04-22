import { Router, type IRouter } from "express";
import { db, productsTable, denominationsTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getPriceList, topUp, type DigiflazzProduct } from "../lib/digiflazz.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const MARKUP_PERCENT = Number(process.env.PRICE_MARKUP_PERCENT ?? "5");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickCategory(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("mobile legend") || b.includes("dota") || b.includes("aov") || b.includes("league")) return "MOBA";
  if (b.includes("free fire") || b.includes("pubg") || b.includes("call of duty") || b.includes("apex")) return "Battle Royale";
  if (b.includes("genshin") || b.includes("honkai") || b.includes("zenless")) return "RPG";
  if (b.includes("valorant") || b.includes("cs") || b.includes("counter")) return "FPS";
  return "Games";
}

router.post("/admin/sync-digiflazz", async (req, res): Promise<void> => {
  // Simple bearer-token auth. Set ADMIN_TOKEN env var to protect this endpoint.
  if (!ADMIN_TOKEN) {
    res.status(500).json({ error: "ADMIN_TOKEN env var is not configured" });
    return;
  }
  const auth = req.header("authorization") ?? "";
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let priceList: DigiflazzProduct[];
  try {
    priceList = await getPriceList();
  } catch (e: any) {
    logger.error({ err: e?.message }, "Failed to fetch Digiflazz price list");
    res.status(502).json({ error: "Failed to fetch Digiflazz price list", detail: e?.message });
    return;
  }

  // Only games
  const gameItems = priceList.filter((p) => (p.category ?? "").toLowerCase() === "games");

  // Group by brand
  const brands = new Map<string, DigiflazzProduct[]>();
  for (const item of gameItems) {
    const brand = item.brand?.trim();
    if (!brand) continue;
    if (!brands.has(brand)) brands.set(brand, []);
    brands.get(brand)!.push(item);
  }

  let productsUpserted = 0;
  let denomsUpserted = 0;

  function titleCase(s: string): string {
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  for (const [brand, items] of brands) {
    const gameCode = slugify(brand);
    const category = pickCategory(brand);
    const gameName = titleCase(brand);

    await db
      .insert(productsTable)
      .values({
        gameCode,
        gameName,
        category,
        imageUrl: null,
        description: `Top up ${brand} resmi, cepat, dan aman.`,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: productsTable.gameCode,
        set: { gameName: brand, category },
      });
    productsUpserted++;

    let sortIdx = 0;
    for (const item of items) {
      const productCode = item.buyer_sku_code;
      if (!productCode) continue;
      const basePrice = Number(item.price) || 0;
      const sellingPrice = Math.ceil(basePrice * (1 + MARKUP_PERCENT / 100));
      const isActive = !!(item.buyer_product_status && item.seller_product_status);

      await db
        .insert(denominationsTable)
        .values({
          gameCode,
          productCode,
          productName: item.product_name,
          price: String(basePrice),
          originalPrice: String(basePrice),
          sellingPrice: String(sellingPrice),
          isActive,
          sortOrder: sortIdx++,
        })
        .onConflictDoUpdate({
          target: denominationsTable.productCode,
          set: {
            gameCode,
            productName: item.product_name,
            price: String(basePrice),
            originalPrice: String(basePrice),
            sellingPrice: String(sellingPrice),
            isActive,
            sortOrder: sql`${denominationsTable.sortOrder}`,
          },
        });
      denomsUpserted++;
    }
  }

  logger.info({ productsUpserted, denomsUpserted }, "Digiflazz sync completed");
  res.json({
    ok: true,
    brands: brands.size,
    productsUpserted,
    denomsUpserted,
    markupPercent: MARKUP_PERCENT,
  });
});

// Manual override: set order payment status (and optionally trigger Digiflazz top-up)
// Body: { status: "paid" | "pending" | "failed" | "settlement" | "expire", triggerTopup?: boolean }
router.post("/admin/orders/:orderId/status", async (req, res): Promise<void> => {
  if (!ADMIN_TOKEN) {
    res.status(500).json({ error: "ADMIN_TOKEN env var is not configured" });
    return;
  }
  const auth = req.header("authorization") ?? "";
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const orderId = req.params.orderId;
  const status = String(req.body?.status ?? "").toLowerCase();
  const triggerTopup = req.body?.triggerTopup !== false; // default true

  const allowed = ["pending", "paid", "settlement", "failed", "expire", "cancel", "deny"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderId, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ paymentStatus: status })
    .where(eq(ordersTable.orderId, orderId));

  let topupResult: any = null;
  const isPaid = status === "paid" || status === "settlement";
  if (isPaid && triggerTopup && order.digiflazzStatus === "pending") {
    try {
      const result = await topUp({
        buyerSkuCode: order.productCode,
        customerNo: order.gameServerId
          ? `${order.gameUserId}(${order.gameServerId})`
          : order.gameUserId,
        refId: order.orderId,
      });
      await db
        .update(ordersTable)
        .set({
          digiflazzStatus: result.status ?? "process",
          digiflazzRefId: result.ref_id,
        })
        .where(eq(ordersTable.id, order.id));
      topupResult = { status: result.status, refId: result.ref_id, message: result.message };
    } catch (err: any) {
      logger.error({ err: err?.message, orderId }, "Manual top-up failed");
      topupResult = { error: err?.message ?? "top-up failed" };
    }
  }

  res.json({ ok: true, orderId, paymentStatus: status, topup: topupResult });
});

export default router;

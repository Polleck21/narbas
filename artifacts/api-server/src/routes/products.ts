import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable, denominationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetDenominationsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isActive, true));
  res.json(products);
});

router.get("/products/:gameCode/denominations", async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.gameCode) ? req.params.gameCode[0] : req.params.gameCode;
  const params = GetDenominationsParams.safeParse({ gameCode: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.gameCode, params.data.gameCode))
    .limit(1);

  if (!product.length) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const denoms = await db
    .select()
    .from(denominationsTable)
    .where(
      and(
        eq(denominationsTable.gameCode, params.data.gameCode),
        eq(denominationsTable.isActive, true)
      )
    );

  res.json(denoms.map((d) => ({
    ...d,
    price: Number(d.price),
    originalPrice: Number(d.originalPrice),
    sellingPrice: Number(d.sellingPrice),
  })));
});

export default router;

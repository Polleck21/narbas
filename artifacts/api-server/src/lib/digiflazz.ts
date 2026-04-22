import crypto from "crypto";
import axios from "axios";
import { logger } from "./logger";

const DIGIFLAZZ_BASE_URL = "https://api.digiflazz.com/v1";
const username = process.env.DIGIFLAZZ_USERNAME ?? "";
const apiKey = process.env.DIGIFLAZZ_API_KEY ?? "";

function createSignature(type: "topup" | "pricelist"): string {
  const raw = `${username}${apiKey}${type === "topup" ? "top-up" : "pricelist"}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export async function getPriceList(): Promise<DigiflazzProduct[]> {
  const sign = createSignature("pricelist");
  const res = await axios.post(`${DIGIFLAZZ_BASE_URL}/price-list`, {
    cmd: "prepaid",
    username,
    sign,
  });
  const data = res.data?.data;
  if (!Array.isArray(data)) {
    logger.error({ response: res.data }, "Digiflazz price-list returned non-array");
    throw new Error(
      `Digiflazz price-list error: ${JSON.stringify(res.data).slice(0, 300)}`
    );
  }
  return data as DigiflazzProduct[];
}

export interface DigiflazzProduct {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

export interface TopUpResult {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: string;
  rc: string;
  sn: string;
  buyer_last_saldo: number;
  price: number;
}

export async function topUp(params: {
  buyerSkuCode: string;
  customerNo: string;
  refId: string;
  testing?: boolean;
}): Promise<TopUpResult> {
  const sign = createSignature("topup");
  const res = await axios.post(`${DIGIFLAZZ_BASE_URL}/transaction`, {
    username,
    buyer_sku_code: params.buyerSkuCode,
    customer_no: params.customerNo,
    ref_id: params.refId,
    sign,
    testing: params.testing ?? false,
  });

  if (res.data.data) {
    return res.data.data as TopUpResult;
  }

  logger.error({ response: res.data }, "Digiflazz top-up failed");
  throw new Error("Digiflazz top-up failed");
}

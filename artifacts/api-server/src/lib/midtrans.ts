// @ts-expect-error - midtrans-client doesn't have type definitions
import midtransClient from "midtrans-client";

// Use server key prefix to auto-detect environment.
// SB-Mid-server-* = Sandbox; Mid-server-* = Production.
// Can be overridden by setting MIDTRANS_IS_PRODUCTION=true|false explicitly.
const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
const explicit = process.env.MIDTRANS_IS_PRODUCTION;
const isProduction =
  explicit === "true"
    ? true
    : explicit === "false"
      ? false
      : !serverKey.startsWith("SB-");

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
});

export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
});

export interface SnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  itemId: string;
}

export async function createSnapTransaction(params: SnapTransactionParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: [
      {
        id: params.itemId,
        price: Math.round(params.grossAmount),
        quantity: 1,
        name: params.itemName,
      },
    ],
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction as { token: string; redirect_url: string };
}

import { createHmac, timingSafeEqual } from "node:crypto";
import * as LemonSqueezy from "@lemonsqueezy/lemonsqueezy.js";

const lemonModule = LemonSqueezy as Record<string, unknown>;

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      status?: string;
      custom_data?: Record<string, unknown>;
      first_order_item?: {
        product_name?: string;
      };
    };
  };
};

export function setupLemonSqueezy(): void {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const setup = lemonModule.lemonSqueezySetup;
  if (!apiKey || typeof setup !== "function") {
    return;
  }

  setup({ apiKey });
}

export function verifyLemonSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(signatureHeader, "utf8");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(digestBuffer, signatureBuffer);
}

export function buildCheckoutUrl(input: {
  toolId: string;
  email?: string;
  successUrl?: string;
}): string | null {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    return null;
  }

  const url = new URL(`https://checkout.lemonsqueezy.com/buy/${productId}`);
  url.searchParams.set("embed", "1");
  url.searchParams.set("checkout[custom][tool_id]", input.toolId);

  if (input.email) {
    url.searchParams.set("checkout[email]", input.email);
  }

  if (input.successUrl) {
    url.searchParams.set("checkout[success_url]", input.successUrl);
  }

  return url.toString();
}

export function parseWebhookPurchase(payload: LemonWebhookPayload): {
  eventName: string;
  orderId: string | null;
  email: string | null;
  toolId: string | null;
  status: string | null;
} {
  const eventName = payload.meta?.event_name ?? "";
  const orderId = payload.data?.id ?? null;
  const email = payload.data?.attributes?.user_email?.toLowerCase() ?? null;
  const status = payload.data?.attributes?.status ?? null;

  const customMeta = payload.meta?.custom_data;
  const customData = payload.data?.attributes?.custom_data;

  const maybeToolIdFromMeta =
    typeof customMeta?.tool_id === "string" ? customMeta.tool_id : null;
  const maybeToolIdFromData =
    typeof customData?.tool_id === "string" ? customData.tool_id : null;

  return {
    eventName,
    orderId,
    email,
    toolId: maybeToolIdFromData ?? maybeToolIdFromMeta,
    status
  };
}

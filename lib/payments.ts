import crypto from "node:crypto";

import { z } from "zod";

import { addOrUpdatePurchase, hasPurchase } from "@/lib/data-store";

const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z
    .object({
      object: z
        .object({
          customer_email: z.string().email().optional(),
          customer_details: z.object({ email: z.string().email().optional() }).optional()
        })
        .passthrough()
    })
    .optional()
});

export function getStripePaymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

export function verifyWebhookSecret(providedSecret: string | null): boolean {
  const expectedSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return true;
  }

  if (!providedSecret) {
    return false;
  }

  const expected = Buffer.from(expectedSecret);
  const provided = Buffer.from(providedSecret);

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
}

export async function processStripeWebhook(payload: unknown): Promise<{ handled: boolean; message: string }> {
  const parsed = stripeWebhookSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      handled: false,
      message: "Invalid webhook payload shape."
    };
  }

  if (parsed.data.type !== "checkout.session.completed") {
    return {
      handled: true,
      message: `Ignoring event type ${parsed.data.type}.`
    };
  }

  const email =
    parsed.data.data?.object.customer_email ?? parsed.data.data?.object.customer_details?.email ?? null;

  if (!email) {
    return {
      handled: false,
      message: "No customer email found in completed checkout event."
    };
  }

  await addOrUpdatePurchase(email, "stripe");

  return {
    handled: true,
    message: "Purchase recorded and access can now be granted by email."
  };
}

export async function canUnlockAccess(email: string): Promise<boolean> {
  return hasPurchase(email);
}

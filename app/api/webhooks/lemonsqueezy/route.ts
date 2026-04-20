import { NextRequest, NextResponse } from "next/server";
import { grantPaidAccess, revokePaidAccess } from "@/lib/database";
import { parseWebhookPurchase, verifyLemonSignature, type LemonWebhookPayload } from "@/lib/payments";

export const runtime = "nodejs";

const GRANT_EVENTS = new Set([
  "order_created",
  "subscription_created",
  "subscription_payment_success"
]);

const REVOKE_EVENTS = new Set(["subscription_payment_failed", "subscription_cancelled", "subscription_expired"]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  const validSignature = verifyLemonSignature(rawBody, signature);
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const { email, eventName, orderId, toolId } = parseWebhookPurchase(payload);

  if (!toolId || !email) {
    return NextResponse.json({ ignored: true, reason: "Missing tool_id or user_email." });
  }

  if (GRANT_EVENTS.has(eventName)) {
    await grantPaidAccess({
      toolId,
      email,
      source: "lemonsqueezy",
      orderId
    });

    return NextResponse.json({ ok: true, event: eventName });
  }

  if (REVOKE_EVENTS.has(eventName)) {
    await revokePaidAccess({ toolId, email });
    return NextResponse.json({ ok: true, event: eventName });
  }

  return NextResponse.json({ ignored: true, event: eventName });
}

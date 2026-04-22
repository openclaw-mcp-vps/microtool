import { NextResponse } from "next/server";

import { processStripeWebhook, verifyWebhookSecret } from "@/lib/payments";

export async function POST(request: Request) {
  const providedSecret =
    request.headers.get("x-webhook-secret") ?? request.headers.get("x-microtool-webhook-secret");

  if (!verifyWebhookSecret(providedSecret)) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await processStripeWebhook(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        handled: false,
        message: error instanceof Error ? error.message : "Unable to process webhook."
      },
      { status: 400 }
    );
  }
}

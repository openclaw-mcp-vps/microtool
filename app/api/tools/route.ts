import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createTool,
  getTotalPaidUsers,
  hasPaidAccess,
  listToolsByOwner,
  recordToolRun
} from "@/lib/database";
import { addPaidToolCookie, getSessionFromRequest, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const inputSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9_]+$/),
  label: z.string().min(1),
  type: z.enum(["number", "text"]),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional()
});

const configSchema = z.object({
  headline: z.string().min(3),
  description: z.string().min(10),
  formula: z.string().min(3),
  outputLabel: z.string().min(2),
  outputFormat: z.enum(["currency", "number", "percentage", "text"]).optional(),
  inputs: z.array(inputSchema).min(1)
});

const createToolSchema = z.object({
  action: z.literal("create"),
  name: z.string().min(3),
  description: z.string().min(10),
  subdomain: z.string().min(2),
  config: configSchema
});

const createSessionSchema = z.object({
  action: z.literal("session"),
  email: z.string().email()
});

const claimAccessSchema = z.object({
  action: z.literal("claim_access"),
  toolId: z.string().uuid(),
  email: z.string().email().optional()
});

const trackRunSchema = z.object({
  action: z.literal("track_run"),
  toolId: z.string().uuid()
});

const postSchema = z.union([
  createSessionSchema,
  createToolSchema,
  claimAccessSchema,
  trackRunSchema
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        error: "No active session. Set your email in the builder to load your tools."
      },
      { status: 401 }
    );
  }

  const tools = await listToolsByOwner(session.email);
  const enrichedTools = await Promise.all(
    tools.map(async (tool) => ({
      ...tool,
      paidUsers: await getTotalPaidUsers(tool.id)
    }))
  );

  return NextResponse.json({
    email: session.email,
    tools: enrichedTools
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedBody = postSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  }

  const payload = parsedBody.data;

  if (payload.action === "session") {
    const response = NextResponse.json({ ok: true, email: payload.email.toLowerCase() });
    await setSessionCookie(response, payload.email);
    return response;
  }

  if (payload.action === "create") {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Set your account email first so we can attach ownership." },
        { status: 401 }
      );
    }

    try {
      const tool = await createTool({
        ownerEmail: session.email,
        name: payload.name,
        description: payload.description,
        subdomain: payload.subdomain,
        config: payload.config,
        monthlyPriceUsd: 15
      });

      return NextResponse.json({ tool }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create tool.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (payload.action === "claim_access") {
    const session = await getSessionFromRequest(req);
    const email = session?.email ?? payload.email;

    if (!email) {
      return NextResponse.json(
        { error: "Provide the purchase email to claim access." },
        { status: 400 }
      );
    }

    const paid = await hasPaidAccess({ toolId: payload.toolId, email });
    if (!paid) {
      return NextResponse.json(
        {
          error:
            "No paid subscription found for that email yet. If checkout just completed, wait a few seconds and try again."
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true });
    await addPaidToolCookie(response, req, payload.toolId);

    if (!session) {
      await setSessionCookie(response, email);
    }

    return response;
  }

  await recordToolRun(payload.toolId);
  return NextResponse.json({ ok: true });
}

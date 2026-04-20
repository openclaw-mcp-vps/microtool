import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { deployTool } from "@/lib/database";

export const runtime = "nodejs";

const deploySchema = z.object({
  toolId: z.string().uuid()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "You must set an account email before deploying." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedBody = deploySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues.map((issue) => issue.message).join("; ")
      },
      { status: 400 }
    );
  }

  try {
    const baseHost =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? undefined;
    const protocol =
      req.headers.get("x-forwarded-proto") ??
      (baseHost?.includes("localhost") ? "http" : "https");

    const deployedTool = await deployTool({
      toolId: parsedBody.data.toolId,
      ownerEmail: session.email,
      baseHost,
      protocol
    });

    return NextResponse.json({ tool: deployedTool });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deployment failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { createDraftTool } from "@/lib/deployment";
import { listTools } from "@/lib/data-store";

export async function GET() {
  const tools = await listTools();
  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { config?: unknown; ownerEmail?: string };

    if (!body.config) {
      return NextResponse.json({ error: "config is required." }, { status: 400 });
    }

    const tool = await createDraftTool({
      config: body.config,
      ownerEmail: body.ownerEmail
    });

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create tool."
      },
      { status: 400 }
    );
  }
}

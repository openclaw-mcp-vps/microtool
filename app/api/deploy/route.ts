import { NextResponse } from "next/server";

import { deployTool } from "@/lib/deployment";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      toolId?: string;
      config?: unknown;
      ownerEmail?: string;
    };

    if (!body.toolId && !body.config) {
      return NextResponse.json(
        { error: "Pass either toolId or config in the request body." },
        { status: 400 }
      );
    }

    const tool = await deployTool({
      toolId: body.toolId,
      config: body.config,
      ownerEmail: body.ownerEmail
    });

    return NextResponse.json({ tool });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to deploy tool."
      },
      { status: 400 }
    );
  }
}

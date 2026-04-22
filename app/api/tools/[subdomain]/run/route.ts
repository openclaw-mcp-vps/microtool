import { NextResponse } from "next/server";

import { incrementToolRun } from "@/lib/data-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  await incrementToolRun(subdomain);
  return NextResponse.json({ tracked: true });
}

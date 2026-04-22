import crypto from "node:crypto";

import { parseToolConfig } from "@/lib/config-parser";
import { getToolBySubdomain, getToolById, saveTool, type StoredTool } from "@/lib/data-store";

function sanitizeSubdomain(slug: string): string {
  return slug.replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

async function ensureUniqueSubdomain(base: string): Promise<string> {
  let candidate = sanitizeSubdomain(base);
  if (!candidate) {
    candidate = `tool-${crypto.randomUUID().slice(0, 8)}`;
  }

  let suffix = 1;
  while (await getToolBySubdomain(candidate)) {
    candidate = `${sanitizeSubdomain(base)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function createDraftTool(input: {
  config: unknown;
  ownerEmail?: string;
}): Promise<StoredTool> {
  const config = parseToolConfig(input.config);
  const subdomain = await ensureUniqueSubdomain(config.slug);
  const now = new Date().toISOString();

  return saveTool({
    ...config,
    id: crypto.randomUUID(),
    ownerEmail: input.ownerEmail,
    subdomain,
    deploymentUrl: `https://${subdomain}.microtool.app`,
    deployStatus: "draft",
    visits: 0,
    runs: 0,
    createdAt: now,
    updatedAt: now
  });
}

export async function deployTool(input: {
  toolId?: string;
  config?: unknown;
  ownerEmail?: string;
}): Promise<StoredTool> {
  let tool: StoredTool | null = null;

  if (input.toolId) {
    tool = await getToolById(input.toolId);
  }

  if (!tool) {
    if (!input.config) {
      throw new Error("Either toolId or config is required to deploy a tool.");
    }

    tool = await createDraftTool({
      config: input.config,
      ownerEmail: input.ownerEmail
    });
  }

  const deployed: StoredTool = {
    ...tool,
    deployStatus: "deployed",
    updatedAt: new Date().toISOString()
  };

  await saveTool(deployed);
  return deployed;
}

import { promises as fs } from "node:fs";
import path from "node:path";

import type { ToolConfig } from "@/lib/config-parser";

const DATA_DIR = path.join(process.cwd(), "data");
const TOOLS_FILE = path.join(DATA_DIR, "tools.json");
const PURCHASES_FILE = path.join(DATA_DIR, "purchases.json");

export type StoredTool = ToolConfig & {
  id: string;
  ownerEmail?: string;
  subdomain: string;
  deploymentUrl: string;
  deployStatus: "draft" | "deployed";
  visits: number;
  runs: number;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseRecord = {
  email: string;
  purchasedAt: string;
  source: "stripe" | "manual";
};

async function ensureFile(filePath: string, fallback: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, fallback, "utf8");
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureFile(filePath, JSON.stringify(fallback, null, 2));

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T): Promise<void> {
  await ensureFile(filePath, JSON.stringify(value, null, 2));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function listTools(): Promise<StoredTool[]> {
  return readJson<StoredTool[]>(TOOLS_FILE, []);
}

export async function getToolBySubdomain(subdomain: string): Promise<StoredTool | null> {
  const tools = await listTools();
  return tools.find((tool) => tool.subdomain === subdomain) ?? null;
}

export async function getToolById(id: string): Promise<StoredTool | null> {
  const tools = await listTools();
  return tools.find((tool) => tool.id === id) ?? null;
}

export async function saveTool(tool: StoredTool): Promise<StoredTool> {
  const tools = await listTools();
  const index = tools.findIndex((existing) => existing.id === tool.id);

  if (index >= 0) {
    tools[index] = tool;
  } else {
    tools.push(tool);
  }

  await writeJson(TOOLS_FILE, tools);
  return tool;
}

export async function incrementToolVisit(subdomain: string): Promise<void> {
  const tools = await listTools();
  const next = tools.map((tool) => {
    if (tool.subdomain !== subdomain) {
      return tool;
    }

    return {
      ...tool,
      visits: tool.visits + 1,
      updatedAt: new Date().toISOString()
    };
  });

  await writeJson(TOOLS_FILE, next);
}

export async function incrementToolRun(subdomain: string): Promise<void> {
  const tools = await listTools();
  const next = tools.map((tool) => {
    if (tool.subdomain !== subdomain) {
      return tool;
    }

    return {
      ...tool,
      runs: tool.runs + 1,
      updatedAt: new Date().toISOString()
    };
  });

  await writeJson(TOOLS_FILE, next);
}

export async function listPurchases(): Promise<PurchaseRecord[]> {
  return readJson<PurchaseRecord[]>(PURCHASES_FILE, []);
}

export async function addOrUpdatePurchase(email: string, source: PurchaseRecord["source"]): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const purchases = await listPurchases();
  const existing = purchases.find((record) => record.email === normalizedEmail);

  if (existing) {
    existing.purchasedAt = new Date().toISOString();
    existing.source = source;
  } else {
    purchases.push({
      email: normalizedEmail,
      purchasedAt: new Date().toISOString(),
      source
    });
  }

  await writeJson(PURCHASES_FILE, purchases);
}

export async function hasPurchase(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const purchases = await listPurchases();
  return purchases.some((record) => record.email === normalizedEmail);
}

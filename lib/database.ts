import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type ToolInput = {
  id: string;
  label: string;
  type: "number" | "text";
  helperText?: string;
  required?: boolean;
  defaultValue?: string;
};

export type ToolConfig = {
  headline: string;
  description: string;
  inputs: ToolInput[];
  formula: string;
  outputLabel: string;
  outputFormat?: "currency" | "number" | "percentage" | "text";
};

export type ToolRecord = {
  id: string;
  ownerEmail: string;
  name: string;
  slug: string;
  subdomain: string;
  description: string;
  status: "draft" | "deployed";
  deploymentUrl: string;
  createdAt: string;
  updatedAt: string;
  deployedAt: string | null;
  monthlyPriceUsd: number;
  config: ToolConfig;
  analytics: {
    views: number;
    runs: number;
    lastRunAt: string | null;
  };
};

export type PurchaseRecord = {
  id: string;
  toolId: string;
  email: string;
  status: "paid" | "refunded";
  source: "lemonsqueezy" | "manual";
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
};

type DatabaseShape = {
  tools: ToolRecord[];
  purchases: PurchaseRecord[];
};

const DB_PATH = path.join(process.cwd(), ".data", "microtool-db.json");

const EMPTY_DB: DatabaseShape = {
  tools: [],
  purchases: []
};

let writeLock: Promise<void> = Promise.resolve();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeSubdomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultDeploymentUrl(subdomain: string): string {
  return `https://${subdomain}.microtool.dev`;
}

async function ensureDatabaseFile(): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

async function readDatabase(): Promise<DatabaseShape> {
  await ensureDatabaseFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as DatabaseShape;
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : []
    };
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
    return EMPTY_DB;
  }
}

async function writeDatabase(nextDb: DatabaseShape): Promise<void> {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(nextDb, null, 2), "utf8");
  await fs.rename(tempPath, DB_PATH);
}

async function mutateDatabase<T>(mutator: (db: DatabaseShape) => T | Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previousLock = writeLock;
  writeLock = nextLock;

  await previousLock;

  try {
    const db = await readDatabase();
    const value = await mutator(db);
    await writeDatabase(db);
    return value;
  } finally {
    release!();
  }
}

export async function createTool(input: {
  ownerEmail: string;
  name: string;
  description: string;
  subdomain: string;
  config: ToolConfig;
  monthlyPriceUsd?: number;
}): Promise<ToolRecord> {
  return mutateDatabase((db) => {
    const subdomain = sanitizeSubdomain(input.subdomain);
    if (!subdomain) {
      throw new Error("A valid subdomain is required.");
    }

    const existing = db.tools.find((tool) => tool.subdomain === subdomain);
    if (existing) {
      throw new Error(`Subdomain ${subdomain} is already taken.`);
    }

    const now = new Date().toISOString();
    const tool: ToolRecord = {
      id: randomUUID(),
      ownerEmail: normalizeEmail(input.ownerEmail),
      name: input.name.trim(),
      slug: subdomain,
      subdomain,
      description: input.description.trim(),
      status: "draft",
      deploymentUrl: defaultDeploymentUrl(subdomain),
      createdAt: now,
      updatedAt: now,
      deployedAt: null,
      monthlyPriceUsd: input.monthlyPriceUsd ?? 15,
      config: input.config,
      analytics: {
        views: 0,
        runs: 0,
        lastRunAt: null
      }
    };

    db.tools.unshift(tool);
    return tool;
  });
}

export async function listToolsByOwner(ownerEmail: string): Promise<ToolRecord[]> {
  const db = await readDatabase();
  const email = normalizeEmail(ownerEmail);
  return db.tools
    .filter((tool) => normalizeEmail(tool.ownerEmail) === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getToolBySubdomain(subdomainOrSlug: string): Promise<ToolRecord | null> {
  const key = sanitizeSubdomain(subdomainOrSlug);
  const db = await readDatabase();
  return db.tools.find((tool) => tool.subdomain === key || tool.slug === key) ?? null;
}

export async function getToolById(toolId: string): Promise<ToolRecord | null> {
  const db = await readDatabase();
  return db.tools.find((tool) => tool.id === toolId) ?? null;
}

export async function deployTool(input: {
  toolId: string;
  ownerEmail: string;
  baseHost?: string;
  protocol?: string;
}): Promise<ToolRecord> {
  return mutateDatabase((db) => {
    const tool = db.tools.find((entry) => entry.id === input.toolId);
    if (!tool) {
      throw new Error("Tool not found.");
    }

    if (normalizeEmail(tool.ownerEmail) !== normalizeEmail(input.ownerEmail)) {
      throw new Error("You can only deploy your own tools.");
    }

    const now = new Date().toISOString();
    tool.status = "deployed";
    tool.deployedAt = now;
    tool.updatedAt = now;

    if (input.baseHost) {
      const protocol = input.protocol ?? (input.baseHost.includes("localhost") ? "http" : "https");
      const hostWithoutPort = input.baseHost.split(":")[0];

      if (hostWithoutPort.includes("localhost")) {
        tool.deploymentUrl = `${protocol}://${input.baseHost}/${tool.subdomain}`;
      } else {
        const hostParts = hostWithoutPort.split(".");
        const rootDomain =
          hostParts.length >= 2 ? hostParts.slice(-2).join(".") : hostWithoutPort;
        tool.deploymentUrl = `${protocol}://${tool.subdomain}.${rootDomain}`;
      }
    }

    return tool;
  });
}

export async function recordToolView(toolId: string): Promise<void> {
  await mutateDatabase((db) => {
    const tool = db.tools.find((entry) => entry.id === toolId);
    if (!tool) {
      return;
    }

    tool.analytics.views += 1;
    tool.updatedAt = new Date().toISOString();
  });
}

export async function recordToolRun(toolId: string): Promise<void> {
  await mutateDatabase((db) => {
    const tool = db.tools.find((entry) => entry.id === toolId);
    if (!tool) {
      return;
    }

    const now = new Date().toISOString();
    tool.analytics.runs += 1;
    tool.analytics.lastRunAt = now;
    tool.updatedAt = now;
  });
}

export async function grantPaidAccess(input: {
  toolId: string;
  email: string;
  source?: "lemonsqueezy" | "manual";
  orderId?: string | null;
}): Promise<PurchaseRecord> {
  return mutateDatabase((db) => {
    const email = normalizeEmail(input.email);
    const now = new Date().toISOString();
    const existing = db.purchases.find(
      (purchase) =>
        purchase.toolId === input.toolId && normalizeEmail(purchase.email) === email
    );

    if (existing) {
      existing.status = "paid";
      existing.updatedAt = now;
      existing.orderId = input.orderId ?? existing.orderId;
      return existing;
    }

    const purchase: PurchaseRecord = {
      id: randomUUID(),
      toolId: input.toolId,
      email,
      status: "paid",
      source: input.source ?? "manual",
      orderId: input.orderId ?? null,
      createdAt: now,
      updatedAt: now
    };

    db.purchases.unshift(purchase);
    return purchase;
  });
}

export async function revokePaidAccess(input: {
  toolId: string;
  email: string;
}): Promise<void> {
  await mutateDatabase((db) => {
    const email = normalizeEmail(input.email);
    const purchase = db.purchases.find(
      (entry) => entry.toolId === input.toolId && normalizeEmail(entry.email) === email
    );

    if (purchase) {
      purchase.status = "refunded";
      purchase.updatedAt = new Date().toISOString();
    }
  });
}

export async function hasPaidAccess(input: {
  toolId: string;
  email: string;
}): Promise<boolean> {
  const db = await readDatabase();
  const email = normalizeEmail(input.email);
  return db.purchases.some(
    (entry) =>
      entry.toolId === input.toolId &&
      normalizeEmail(entry.email) === email &&
      entry.status === "paid"
  );
}

export async function getTotalPaidUsers(toolId: string): Promise<number> {
  const db = await readDatabase();
  return db.purchases.filter(
    (entry) => entry.toolId === toolId && entry.status === "paid"
  ).length;
}

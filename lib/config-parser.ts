import { z } from "zod";

const toolFieldSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: "Field IDs must start with a letter and contain letters, numbers, or underscores."
      }),
    label: z.string().min(1).max(80),
    type: z.enum(["number", "text", "select"]),
    description: z.string().max(160).optional(),
    required: z.boolean().optional().default(false),
    placeholder: z.string().max(120).optional(),
    defaultValue: z.union([z.string(), z.number()]).optional(),
    options: z.array(z.string().min(1).max(80)).optional()
  })
  .refine((field) => (field.type === "select" ? Boolean(field.options?.length) : true), {
    message: "Select fields must include at least one option.",
    path: ["options"]
  });

const toolResultSchema = z.object({
  label: z.string().min(1).max(100),
  format: z.enum(["number", "currency", "percent", "text"]).default("number"),
  decimals: z.number().int().min(0).max(6).default(2),
  prefix: z.string().max(16).optional(),
  suffix: z.string().max(16).optional()
});

const toolFormulaSchema = z.object({
  expression: z
    .string()
    .min(1)
    .max(240)
    .regex(/^[0-9a-zA-Z_+\-*/().\s]*$/, {
      message:
        "Formula can only use numbers, field IDs, spaces, and operators (+, -, *, /, parentheses)."
    })
});

export const toolConfigSchema = z.object({
  name: z.string().min(3).max(80),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tagline: z.string().min(12).max(160),
  description: z.string().min(40).max(1000),
  fields: z.array(toolFieldSchema).min(1).max(10),
  formula: toolFormulaSchema,
  result: toolResultSchema,
  cta: z
    .object({
      title: z.string().min(3).max(80),
      description: z.string().min(10).max(160)
    })
    .optional()
});

export type ToolConfig = z.infer<typeof toolConfigSchema>;

export function parseToolConfig(input: unknown): ToolConfig {
  return toolConfigSchema.parse(input);
}

function toNumericValue(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function safeEvaluateExpression(
  expression: string,
  values: Record<string, string | number>
): number {
  const safeValues: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      safeValues[key] = toNumericValue(value);
    }
  }

  const evaluator = new Function(
    "values",
    `"use strict"; const { ${Object.keys(safeValues).join(",") || "_"} } = values; return (${expression});`
  ) as (arg: Record<string, number>) => number;

  const result = evaluator(safeValues);
  if (!Number.isFinite(result)) {
    throw new Error("Formula returned a non-finite number.");
  }

  return result;
}

export function formatToolResult(value: number, config: ToolConfig["result"]): string {
  if (config.format === "text") {
    return `${config.prefix ?? ""}${value}${config.suffix ?? ""}`;
  }

  if (config.format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(value);
  }

  if (config.format === "percent") {
    return `${(value * 100).toFixed(config.decimals)}%`;
  }

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  });

  return `${config.prefix ?? ""}${formatted}${config.suffix ?? ""}`;
}

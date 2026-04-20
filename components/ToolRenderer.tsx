"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ToolConfig } from "@/lib/database";

type ToolRendererProps = {
  toolId: string;
  toolName: string;
  config: ToolConfig;
};

type ToolFormValues = Record<string, string>;

function isFormulaSafe(formula: string): boolean {
  return /^[a-zA-Z0-9_\s+\-*/().,%]*$/.test(formula);
}

function formatResult(result: unknown, outputFormat: ToolConfig["outputFormat"]): string {
  if (typeof result !== "number" || Number.isNaN(result)) {
    return String(result);
  }

  if (outputFormat === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(result);
  }

  if (outputFormat === "percentage") {
    return `${(result * 100).toFixed(2)}%`;
  }

  if (outputFormat === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4
    }).format(result);
  }

  return String(result);
}

export default function ToolRenderer({ toolId, toolName, config }: ToolRendererProps) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  const defaultValues = useMemo(() => {
    const entries = config.inputs.map((input) => [input.id, input.defaultValue ?? ""]);
    return Object.fromEntries(entries);
  }, [config.inputs]);

  const { register, handleSubmit } = useForm<ToolFormValues>({
    defaultValues
  });

  async function onSubmit(values: ToolFormValues): Promise<void> {
    setIsCalculating(true);
    setError("");

    try {
      if (!isFormulaSafe(config.formula)) {
        throw new Error("Formula contains unsupported characters.");
      }

      const keys = config.inputs.map((input) => input.id);
      const normalizedValues = config.inputs.map((input) => {
        const rawValue = values[input.id] ?? "";
        if (input.type === "number") {
          const numeric = Number(rawValue);
          if (Number.isNaN(numeric)) {
            throw new Error(`Input \"${input.label}\" must be numeric.`);
          }

          return numeric;
        }

        return rawValue;
      });

      const evaluator = new Function(...keys, `"use strict"; return (${config.formula});`) as (
        ...args: Array<string | number>
      ) => unknown;

      const output = evaluator(...normalizedValues);
      const formatted = formatResult(output, config.outputFormat);
      setResult(formatted);

      await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "track_run",
          toolId
        })
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Tool execution failed unexpectedly.";
      setError(message);
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="surface mx-auto w-full max-w-3xl p-6 sm:p-8">
      <p className="eyebrow">{toolName}</p>
      <h2 className="mt-2 text-2xl font-semibold">{config.headline}</h2>
      <p className="mt-2 text-sm text-[var(--text-soft)]">{config.description}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        {config.inputs.map((input) => (
          <label key={input.id} className="grid gap-1.5 text-sm">
            {input.label}
            <input
              {...register(input.id, {
                required: input.required ? `${input.label} is required` : false
              })}
              type={input.type === "number" ? "number" : "text"}
              step={input.type === "number" ? "any" : undefined}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {input.helperText ? (
              <span className="text-xs text-[var(--text-soft)]">{input.helperText}</span>
            ) : null}
          </label>
        ))}

        <button
          type="submit"
          disabled={isCalculating}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-[#04150f] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Run Tool
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8be3bc]">{config.outputLabel}</p>
          <p className="mt-2 text-2xl font-semibold text-[#d6ffe9]">{result}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-[var(--danger)]/80 bg-[#2a1316] p-4 text-sm text-[#ffb3b3]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

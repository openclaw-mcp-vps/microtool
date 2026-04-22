"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Calculator, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { formatToolResult, safeEvaluateExpression, type ToolConfig } from "@/lib/config-parser";

type FormValues = Record<string, string | number>;

function fieldDefaultValue(field: ToolConfig["fields"][number]): string | number {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === "number") {
    return 0;
  }

  if (field.type === "select") {
    return field.options?.[0] ?? "";
  }

  return "";
}

export default function ToolRenderer({
  tool,
  trackingSubdomain
}: {
  tool: ToolConfig;
  trackingSubdomain?: string;
}) {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const defaultValues: FormValues = useMemo(() => {
    const entries = tool.fields.map((field) => [field.id, fieldDefaultValue(field)]);
    return Object.fromEntries(entries);
  }, [tool.fields]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues });

  const liveValues = watch();

  const liveEstimate = useMemo(() => {
    try {
      const raw = safeEvaluateExpression(tool.formula.expression, liveValues);
      return formatToolResult(raw, tool.result);
    } catch {
      return "Fill in all required numeric fields to preview a result.";
    }
  }, [liveValues, tool.formula.expression, tool.result]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const raw = safeEvaluateExpression(tool.formula.expression, values);
      setResult(formatToolResult(raw, tool.result));
      setError("");

      if (trackingSubdomain) {
        await fetch(`/api/tools/${trackingSubdomain}/run`, { method: "POST" });
      }
    } catch (runError) {
      setResult("");
      setError(runError instanceof Error ? runError.message : "Unable to compute result.");
    }
  });

  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-blue-400" />
        <h2 className="text-xl font-semibold">{tool.name}</h2>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-slate-300">{tool.tagline}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        {tool.fields.map((field) => (
          <label key={field.id} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-200">{field.label}</span>
            {field.description ? <p className="mb-2 text-xs text-slate-400">{field.description}</p> : null}

            {field.type === "select" ? (
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                {...register(field.id, { required: field.required })}
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                {...register(field.id, {
                  required: field.required,
                  valueAsNumber: field.type === "number"
                })}
              />
            )}

            {errors[field.id] ? (
              <span className="mt-1 block text-xs text-red-400">This field is required.</span>
            ) : null}
          </label>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Calculate
          </button>
          <div className="text-xs text-slate-400">Live estimate: {liveEstimate}</div>
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>
      ) : null}

      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4"
        >
          <p className="mb-1 text-xs uppercase tracking-wide text-emerald-300">{tool.result.label}</p>
          <p className="text-2xl font-semibold text-emerald-100">{result}</p>
          {tool.cta ? (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-slate-950/50 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <Sparkles className="h-4 w-4" />
                {tool.cta.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">{tool.cta.description}</p>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </section>
  );
}

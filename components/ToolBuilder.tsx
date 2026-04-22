"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, Rocket, Upload } from "lucide-react";
import { motion } from "framer-motion";

import ToolRenderer from "@/components/ToolRenderer";
import { parseToolConfig, type ToolConfig } from "@/lib/config-parser";

const defaultTemplate = {
  name: "Freelance Retainer Estimator",
  slug: "freelance-retainer-estimator",
  tagline: "Turn scope and support load into a defensible monthly retainer.",
  description:
    "Use this estimator to quote monthly retainers consistently. It combines monthly delivery hours, support demand, and risk multiplier into one transparent price recommendation.",
  fields: [
    {
      id: "delivery_hours",
      label: "Monthly Delivery Hours",
      type: "number",
      required: true,
      defaultValue: 20,
      description: "Expected implementation/design/development hours per month."
    },
    {
      id: "hourly_rate",
      label: "Base Hourly Rate (USD)",
      type: "number",
      required: true,
      defaultValue: 120,
      description: "Your standard rate before retainer discounts or premiums."
    },
    {
      id: "support_hours",
      label: "Support Hours",
      type: "number",
      required: true,
      defaultValue: 6,
      description: "Time allocated for async support, QA, and client requests."
    },
    {
      id: "risk_multiplier",
      label: "Risk Multiplier",
      type: "number",
      required: true,
      defaultValue: 1.15,
      description: "1.0 for stable scope, 1.2+ for changing requirements."
    }
  ],
  formula: {
    expression: "((delivery_hours + support_hours) * hourly_rate) * risk_multiplier"
  },
  result: {
    label: "Recommended Monthly Retainer",
    format: "currency",
    decimals: 0
  },
  cta: {
    title: "Use This in Your Proposal",
    description:
      "Present this estimate alongside deliverables and response times so clients understand the tradeoffs."
  }
};

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function ToolBuilder() {
  const [rawConfig, setRawConfig] = useState<string>(toPrettyJson(defaultTemplate));
  const [parsedConfig, setParsedConfig] = useState<ToolConfig | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [deployMessage, setDeployMessage] = useState<string>("");
  const [deployedPath, setDeployedPath] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const sampleGuide = useMemo(
    () => [
      "Use only field IDs with letters, numbers, and underscores.",
      "Formula can reference those IDs directly: (field_a + field_b) * field_c.",
      "Set result.format to currency, number, percent, or text based on output."
    ],
    []
  );

  const validate = () => {
    try {
      const parsedJson = JSON.parse(rawConfig);
      const validated = parseToolConfig(parsedJson);
      setParsedConfig(validated);
      setValidationMessage("Config is valid and ready to deploy.");
      setDeployMessage("");
    } catch (error) {
      setParsedConfig(null);
      setValidationMessage(error instanceof Error ? error.message : "Config validation failed.");
    }
  };

  const deploy = () => {
    startTransition(async () => {
      try {
        const parsedJson = JSON.parse(rawConfig);
        const validated = parseToolConfig(parsedJson);

        const response = await fetch("/api/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: validated })
        });

        const payload = (await response.json()) as {
          tool?: { subdomain: string; deploymentUrl: string };
          error?: string;
        };

        if (!response.ok || !payload.tool) {
          throw new Error(payload.error ?? "Unable to deploy tool.");
        }

        setParsedConfig(validated);
        setDeployMessage(
          `Tool deployed. Local preview path: /${payload.tool.subdomain}. Production subdomain: ${payload.tool.deploymentUrl}`
        );
        setDeployedPath(`/${payload.tool.subdomain}`);
      } catch (error) {
        setDeployMessage(error instanceof Error ? error.message : "Deployment failed.");
      }
    });
  };

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileText = await file.text();
    setRawConfig(fileText);
    setValidationMessage("Loaded config file. Validate to continue.");
    setParsedConfig(null);
    setDeployMessage("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface rounded-2xl p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Build Your Tool Config</h2>
        <p className="mt-2 text-sm text-slate-300">
          Upload JSON or edit directly. The tool will be validated, previewed, and deployed as a hosted
          micro-tool.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500">
            <Upload className="h-4 w-4" />
            Upload JSON
            <input type="file" accept="application/json" className="hidden" onChange={onFileUpload} />
          </label>

          <button
            type="button"
            onClick={() => setRawConfig(toPrettyJson(defaultTemplate))}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Reset to Example
          </button>
        </div>

        <textarea
          value={rawConfig}
          onChange={(event) => setRawConfig(event.target.value)}
          className="mt-4 h-[340px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 font-mono text-xs text-slate-100"
          spellCheck={false}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={validate}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Validate Config
          </button>

          <button
            type="button"
            onClick={deploy}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {isPending ? "Deploying..." : "Deploy Tool"}
          </button>
        </div>

        {validationMessage ? (
          <p
            className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              parsedConfig
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                : "border-red-500/40 bg-red-950/30 text-red-200"
            }`}
          >
            {parsedConfig ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
            <span>{validationMessage}</span>
          </p>
        ) : null}

        {deployMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3 text-sm text-blue-100"
          >
            <p>{deployMessage}</p>
            {deployedPath ? (
              <a href={deployedPath} className="mt-2 inline-block font-semibold text-blue-300 underline">
                Open deployed tool preview
              </a>
            ) : null}
          </motion.div>
        ) : null}

        <ul className="mt-5 space-y-2 text-xs text-slate-400">
          {sampleGuide.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </section>

      <section>
        {parsedConfig ? (
          <ToolRenderer tool={parsedConfig} />
        ) : (
          <div className="surface flex min-h-[420px] items-center justify-center rounded-2xl p-6 text-center text-sm text-slate-400">
            Validate a config to preview your live tool here.
          </div>
        )}
      </section>
    </div>
  );
}

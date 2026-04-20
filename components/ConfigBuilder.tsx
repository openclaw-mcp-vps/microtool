"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert, CircleCheck, Loader2, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import YAML from "yaml";
import { z } from "zod";

type BuilderFormValues = {
  accountEmail: string;
  name: string;
  subdomain: string;
  description: string;
  headline: string;
  toolDescription: string;
  formula: string;
  outputLabel: string;
  outputFormat: "currency" | "number" | "percentage" | "text";
  inputs: Array<{
    id: string;
    label: string;
    type: "number" | "text";
    helperText: string;
    required: boolean;
    defaultValue: string;
  }>;
};

type ToolResponse = {
  id: string;
  name: string;
  subdomain: string;
  status: "draft" | "deployed";
  deploymentUrl: string;
};

const importSchema = z.object({
  name: z.string().optional(),
  subdomain: z.string().optional(),
  description: z.string().optional(),
  config: z
    .object({
      headline: z.string(),
      description: z.string(),
      formula: z.string(),
      outputLabel: z.string(),
      outputFormat: z.enum(["currency", "number", "percentage", "text"]).optional(),
      inputs: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(["number", "text"]),
          helperText: z.string().optional(),
          required: z.boolean().optional(),
          defaultValue: z.string().optional()
        })
      )
    })
    .optional(),
  headline: z.string().optional(),
  toolDescription: z.string().optional(),
  formula: z.string().optional(),
  outputLabel: z.string().optional(),
  outputFormat: z.enum(["currency", "number", "percentage", "text"]).optional(),
  inputs: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["number", "text"]),
        helperText: z.string().optional(),
        required: z.boolean().optional(),
        defaultValue: z.string().optional()
      })
    )
    .optional()
});

const formSchema = z.object({
  accountEmail: z.string().email("Use a valid email address"),
  name: z.string().min(3, "Tool name must be at least 3 characters"),
  subdomain: z
    .string()
    .min(2, "Choose a subdomain")
    .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers, and hyphens only"),
  description: z.string().min(12, "Describe the value in at least 12 characters"),
  headline: z.string().min(3, "Headline is required"),
  toolDescription: z.string().min(12, "Tool description is required"),
  formula: z.string().min(3, "Formula is required"),
  outputLabel: z.string().min(2, "Result label is required"),
  outputFormat: z.enum(["currency", "number", "percentage", "text"]),
  inputs: z
    .array(
      z.object({
        id: z
          .string()
          .min(1)
          .regex(/^[a-zA-Z0-9_]+$/, "Input IDs must use letters, numbers, and underscores"),
        label: z.string().min(1, "Label is required"),
        type: z.enum(["number", "text"]),
        helperText: z.string(),
        required: z.boolean(),
        defaultValue: z.string()
      })
    )
    .min(1, "At least one input is required")
});

const defaultValues: BuilderFormValues = {
  accountEmail: "",
  name: "Freelance Rate Calculator",
  subdomain: "freelance-rate",
  description:
    "Helps freelancers calculate a sustainable hourly rate based on revenue goals and workload.",
  headline: "Calculate your minimum profitable hourly rate",
  toolDescription:
    "Estimate the hourly rate you need to hit your yearly income goal after covering expenses and non-billable time.",
  formula: "(target_income + yearly_expenses) / billable_hours",
  outputLabel: "Recommended hourly rate",
  outputFormat: "currency",
  inputs: [
    {
      id: "target_income",
      label: "Target yearly income",
      type: "number",
      helperText: "Total income you want to take home this year.",
      required: true,
      defaultValue: "120000"
    },
    {
      id: "yearly_expenses",
      label: "Yearly business expenses",
      type: "number",
      helperText: "Software, taxes, contractors, and operating costs.",
      required: true,
      defaultValue: "30000"
    },
    {
      id: "billable_hours",
      label: "Billable hours per year",
      type: "number",
      helperText: "Total client-facing hours you can realistically sell.",
      required: true,
      defaultValue: "1200"
    }
  ]
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCheckoutUrl(toolId: string, email: string): string | null {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  if (!productId) {
    return null;
  }

  const url = new URL(`https://checkout.lemonsqueezy.com/buy/${productId}`);
  url.searchParams.set("embed", "1");
  url.searchParams.set("checkout[email]", email);
  url.searchParams.set("checkout[custom][tool_id]", toolId);

  if (typeof window !== "undefined") {
    url.searchParams.set(
      "checkout[success_url]",
      `${window.location.origin}/dashboard?checkout=success&tool=${toolId}`
    );
  }

  return url.toString();
}

function parseConfigContent(content: string, extension: string): unknown {
  if (extension === "yaml" || extension === "yml") {
    return YAML.parse(content);
  }

  return JSON.parse(content) as unknown;
}

export default function ConfigBuilder() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [createdTool, setCreatedTool] = useState<ToolResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BuilderFormValues>({
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "inputs"
  });

  const watchFormula = watch("formula");
  const watchEmail = watch("accountEmail");

  const checkoutUrl = useMemo(() => {
    if (!createdTool || !watchEmail) {
      return null;
    }

    return buildCheckoutUrl(createdTool.id, watchEmail);
  }, [createdTool, watchEmail]);

  async function setSession(email: string): Promise<void> {
    const response = await fetch("/api/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "session",
        email
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Failed to set account session.");
    }
  }

  async function onSubmit(values: BuilderFormValues): Promise<void> {
    setError("");
    setStatus("");

    const validation = formSchema.safeParse(values);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Please review the form and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      setStatus("Saving account session...");
      await setSession(values.accountEmail);

      setStatus("Creating your micro-tool...");
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "create",
          name: values.name,
          description: values.description,
          subdomain: slugify(values.subdomain),
          config: {
            headline: values.headline,
            description: values.toolDescription,
            formula: values.formula,
            outputLabel: values.outputLabel,
            outputFormat: values.outputFormat,
            inputs: values.inputs.map((input) => ({
              ...input,
              helperText: input.helperText || undefined,
              defaultValue: input.defaultValue || undefined
            }))
          }
        })
      });

      const payload = (await response.json()) as {
        tool?: ToolResponse;
        error?: string;
      };

      if (!response.ok || !payload.tool) {
        throw new Error(payload.error ?? "Tool creation failed.");
      }

      setCreatedTool(payload.tool);
      setStatus("Tool drafted. Deploy it to activate your hosted link.");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Tool creation failed unexpectedly.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deployTool(): Promise<void> {
    if (!createdTool) {
      return;
    }

    setIsDeploying(true);
    setError("");
    setStatus("Deploying your tool...");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId: createdTool.id
        })
      });

      const payload = (await response.json()) as {
        tool?: ToolResponse;
        error?: string;
      };

      if (!response.ok || !payload.tool) {
        throw new Error(payload.error ?? "Deployment failed.");
      }

      setCreatedTool(payload.tool);
      setStatus("Tool deployed. Share the URL and start collecting subscriptions.");
    } catch (deployError) {
      const message =
        deployError instanceof Error ? deployError.message : "Deployment failed unexpectedly.";
      setError(message);
    } finally {
      setIsDeploying(false);
    }
  }

  async function importConfig(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase() ?? "json";
      const content = await selectedFile.text();
      const parsed = parseConfigContent(content, extension);
      const validation = importSchema.safeParse(parsed);

      if (!validation.success) {
        throw new Error("The config file is valid JSON/YAML, but it does not match the expected schema.");
      }

      const imported = validation.data;
      const config = imported.config ?? {
        headline: imported.headline,
        description: imported.toolDescription,
        formula: imported.formula,
        outputLabel: imported.outputLabel,
        outputFormat: imported.outputFormat,
        inputs: imported.inputs
      };

      if (imported.name) {
        setValue("name", imported.name, { shouldValidate: true });
      }

      if (imported.subdomain) {
        setValue("subdomain", slugify(imported.subdomain), { shouldValidate: true });
      }

      if (imported.description) {
        setValue("description", imported.description, { shouldValidate: true });
      }

      if (config.headline) {
        setValue("headline", config.headline, { shouldValidate: true });
      }

      if (config.description) {
        setValue("toolDescription", config.description, { shouldValidate: true });
      }

      if (config.formula) {
        setValue("formula", config.formula, { shouldValidate: true });
      }

      if (config.outputLabel) {
        setValue("outputLabel", config.outputLabel, { shouldValidate: true });
      }

      if (config.outputFormat) {
        setValue("outputFormat", config.outputFormat, { shouldValidate: true });
      }

      if (Array.isArray(config.inputs) && config.inputs.length > 0) {
        setValue(
          "inputs",
          config.inputs.map((item) => ({
            id: item.id,
            label: item.label,
            type: item.type,
            helperText: item.helperText ?? "",
            required: item.required ?? true,
            defaultValue: item.defaultValue ?? ""
          }))
        );
      }

      setStatus(`Imported ${selectedFile.name}. Review values and deploy when ready.`);
      setError("");
    } catch (importError) {
      const message =
        importError instanceof Error ? importError.message : "Unable to parse the uploaded config file.";
      setError(message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-12 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="surface p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Builder</p>
            <h2 className="mt-1 text-2xl font-semibold">Create Your Micro-Tool</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Upload a config file or use the visual editor to publish a hosted calculator in one flow.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-2 text-sm transition hover:border-[var(--brand)]">
            <Upload size={16} />
            Import JSON/YAML
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={importConfig}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Account email
            <input
              {...register("accountEmail")}
              type="email"
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.accountEmail ? (
              <span className="text-xs text-[var(--danger)]">{errors.accountEmail.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm">
            Tool name
            <input
              {...register("name")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.name ? <span className="text-xs text-[var(--danger)]">{errors.name.message}</span> : null}
          </label>

          <label className="grid gap-1.5 text-sm">
            Subdomain
            <input
              {...register("subdomain")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.subdomain ? (
              <span className="text-xs text-[var(--danger)]">{errors.subdomain.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Marketplace description
            <textarea
              {...register("description")}
              rows={2}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.description ? (
              <span className="text-xs text-[var(--danger)]">{errors.description.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Tool headline
            <input
              {...register("headline")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.headline ? (
              <span className="text-xs text-[var(--danger)]">{errors.headline.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Tool instructions
            <textarea
              {...register("toolDescription")}
              rows={2}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
            {errors.toolDescription ? (
              <span className="text-xs text-[var(--danger)]">{errors.toolDescription.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Formula
            <input
              {...register("formula")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 font-mono text-xs outline-none transition focus:border-[var(--brand)]"
            />
            <span className="text-xs text-[var(--text-soft)]">
              Use your input IDs in a JS-style expression. Example: (revenue - costs) / hours
            </span>
            {errors.formula ? (
              <span className="text-xs text-[var(--danger)]">{errors.formula.message}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm">
            Result label
            <input
              {...register("outputLabel")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Result format
            <select
              {...register("outputFormat")}
              className="rounded-lg border bg-[#0b1018] px-3 py-2 outline-none transition focus:border-[var(--brand)]"
            >
              <option value="currency">Currency</option>
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
              <option value="text">Text</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[#0b1018] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Inputs</h3>
            <button
              type="button"
              onClick={() =>
                append({
                  id: `input_${fields.length + 1}`,
                  label: `Input ${fields.length + 1}`,
                  type: "number",
                  helperText: "",
                  required: true,
                  defaultValue: ""
                })
              }
              className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs transition hover:border-[var(--brand)]"
            >
              <Plus size={14} /> Add input
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-[var(--line)] p-3">
                <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
                  <input
                    {...register(`inputs.${index}.id`)}
                    className="rounded-md border bg-[#111827] px-2.5 py-2 text-xs font-mono outline-none transition focus:border-[var(--brand)]"
                  />
                  <input
                    {...register(`inputs.${index}.label`)}
                    className="rounded-md border bg-[#111827] px-2.5 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                  <select
                    {...register(`inputs.${index}.type`)}
                    className="rounded-md border bg-[#111827] px-2.5 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
                  >
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="inline-flex items-center justify-center rounded-md border border-[var(--line)] px-2 text-xs transition hover:border-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <input
                  {...register(`inputs.${index}.helperText`)}
                  className="mb-2 w-full rounded-md border bg-[#111827] px-2.5 py-2 text-xs outline-none transition focus:border-[var(--brand)]"
                />

                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" {...register(`inputs.${index}.required`)} />
                    Required
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    Default value
                    <input
                      {...register(`inputs.${index}.defaultValue`)}
                      className="w-28 rounded border bg-[#111827] px-2 py-1 outline-none transition focus:border-[var(--brand)]"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {errors.inputs ? (
            <p className="mt-2 text-xs text-[var(--danger)]">{errors.inputs.message as string}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-[#04150f] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            Create Tool
          </button>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm transition hover:border-[var(--brand)]"
              >
                Preview Config JSON
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--line)] bg-[#0b1018] p-5 shadow-xl">
                <Dialog.Title className="text-lg font-semibold">Generated config</Dialog.Title>
                <pre className="mt-4 max-h-[55vh] overflow-auto rounded-lg border border-[var(--line)] bg-[#060a10] p-3 text-xs leading-relaxed text-[#d7e2ee]">
                  {JSON.stringify(
                    {
                      name: getValues("name"),
                      subdomain: slugify(getValues("subdomain")),
                      description: getValues("description"),
                      config: {
                        headline: getValues("headline"),
                        description: getValues("toolDescription"),
                        formula: getValues("formula"),
                        outputLabel: getValues("outputLabel"),
                        outputFormat: getValues("outputFormat"),
                        inputs: getValues("inputs")
                      }
                    },
                    null,
                    2
                  )}
                </pre>
                <Dialog.Close asChild>
                  <button className="mt-4 rounded-md border border-[var(--line)] px-3 py-1.5 text-sm transition hover:border-[var(--brand)]">
                    Close
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {status ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-sm text-[#c8f2de]">
            <CircleCheck size={16} />
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-[var(--danger)]/70 bg-[#2a1316] px-3 py-2 text-sm text-[#ffb3b3]">
            <CircleAlert size={16} />
            {error}
          </p>
        ) : null}
      </form>

      <aside className="space-y-4">
        <div className="surface p-6">
          <p className="eyebrow">Formula Preview</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            This expression runs on every tool execution. Keep it deterministic and reference only your
            configured input IDs.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 font-mono text-xs text-[#d7e2ee]">
            {watchFormula}
          </pre>
        </div>

        {createdTool ? (
          <div className="surface p-6">
            <p className="eyebrow">Deployment</p>
            <h3 className="mt-1 text-xl font-semibold">{createdTool.name}</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Current status: <span className="font-semibold text-[var(--text)]">{createdTool.status}</span>
            </p>
            <a
              href={createdTool.deploymentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block rounded-md border border-[var(--line)] bg-[#0b1018] px-3 py-2 font-mono text-xs text-[var(--text-soft)]"
            >
              {createdTool.deploymentUrl}
            </a>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={deployTool}
                disabled={isDeploying}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2 text-sm transition hover:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeploying ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                Deploy Hosted Tool
              </button>

              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  className="lemonsqueezy-button inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[#04150f] transition hover:brightness-110"
                >
                  Open Lemon Squeezy Checkout
                </a>
              ) : (
                <p className="rounded-lg border border-[var(--line)] bg-[#0b1018] px-3 py-2 text-xs text-[var(--text-soft)]">
                  Set NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID to enable live checkout links.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="surface p-6">
            <p className="eyebrow">What Happens Next</p>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-[var(--text-soft)]">
              <li>Store your tool config and reserve a subdomain.</li>
              <li>Deploy it to a hosted URL with usage tracking built in.</li>
              <li>Attach Lemon Squeezy checkout and unlock paid access instantly.</li>
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}

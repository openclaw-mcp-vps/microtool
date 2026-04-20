"use client";

import { CircleAlert, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

type AccessGateProps = {
  toolId: string;
  toolName: string;
  checkoutUrl: string | null;
};

export default function AccessGate({ toolId, toolName, checkoutUrl }: AccessGateProps) {
  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  async function claimAccess(): Promise<void> {
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "claim_access",
          toolId,
          email: email || undefined
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Access check failed.");
      }

      window.location.reload();
    } catch (claimError) {
      const message = claimError instanceof Error ? claimError.message : "Unable to claim access.";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="surface mx-auto w-full max-w-2xl p-6 sm:p-8">
      <p className="eyebrow">Paid Access</p>
      <h1 className="mt-2 text-2xl font-semibold">Unlock {toolName}</h1>
      <p className="mt-2 text-sm text-[var(--text-soft)]">
        This tool is available to active subscribers. Complete checkout and confirm your purchase
        email to enter.
      </p>

      <div className="mt-6 grid gap-3">
        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            className="lemonsqueezy-button inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-[#04150f] transition hover:brightness-110"
          >
            Subscribe for $15/mo
          </a>
        ) : (
          <p className="rounded-lg border border-[var(--line)] bg-[#0b1018] px-3 py-2 text-xs text-[var(--text-soft)]">
            Checkout is unavailable because NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is not configured.
          </p>
        )}

        <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-4">
          <p className="text-sm font-medium">Already purchased?</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Enter the same email used at checkout and we will unlock access for this browser.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1 rounded-md border bg-[#111827] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
            />
            <button
              type="button"
              onClick={claimAccess}
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm transition hover:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isChecking ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              Claim Access
            </button>
          </div>

          {error ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--danger)]/70 bg-[#2a1316] px-3 py-2 text-xs text-[#ffb3b3]">
              <CircleAlert size={14} />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

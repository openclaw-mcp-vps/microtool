import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { notFound } from "next/navigation";
import AccessGate from "@/components/AccessGate";
import ToolRenderer from "@/components/ToolRenderer";
import {
  getToolBySubdomain,
  hasPaidAccess,
  recordToolView,
  type ToolRecord
} from "@/lib/database";
import {
  getSessionFromCookiesStore,
  hasPaidToolCookieFromStore
} from "@/lib/auth";
import { buildCheckoutUrl } from "@/lib/payments";

type ToolPageProps = {
  params: Promise<{
    subdomain: string;
  }>;
};

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function getToolForPage(subdomain: string): Promise<ToolRecord | null> {
  const tool = await getToolBySubdomain(subdomain);
  if (!tool || tool.status !== "deployed") {
    return null;
  }

  return tool;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getToolBySubdomain(resolvedParams.subdomain);

  if (!tool) {
    return {
      title: "Tool Not Found"
    };
  }

  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: tool.name,
      description: tool.description,
      type: "website"
    }
  };
}

export const dynamic = "force-dynamic";

export default async function ToolPage({ params }: ToolPageProps) {
  const resolvedParams = await params;
  const tool = await getToolForPage(resolvedParams.subdomain);

  if (!tool) {
    notFound();
  }

  await recordToolView(tool.id);

  const session = await getSessionFromCookiesStore();
  const hasCookieAccess = await hasPaidToolCookieFromStore(tool.id);

  const ownerAccess = session?.email === tool.ownerEmail;
  const paidAccess = session?.email
    ? await hasPaidAccess({ toolId: tool.id, email: session.email })
    : false;

  const hasAccess = ownerAccess || paidAccess || hasCookieAccess;

  const origin = await getOrigin();
  const checkoutUrl = buildCheckoutUrl({
    toolId: tool.id,
    email: session?.email,
    successUrl: `${origin}/dashboard?checkout=success&tool=${tool.id}`
  });

  return (
    <main className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <div className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between rounded-lg border border-[var(--line)] bg-[#0f1623]/80 px-4 py-2.5 text-sm text-[var(--text-soft)]">
        <span>microtool hosted runtime</span>
        <span className="rounded-full border border-[var(--line)] bg-[#0b1018] px-2.5 py-1 font-mono text-xs">
          {tool.subdomain}.microtool.dev
        </span>
      </div>

      {hasAccess ? (
        <ToolRenderer toolId={tool.id} toolName={tool.name} config={tool.config} />
      ) : (
        <AccessGate toolId={tool.id} toolName={tool.name} checkoutUrl={checkoutUrl} />
      )}
    </main>
  );
}

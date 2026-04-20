import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "microtool_session";
const PAID_COOKIE_NAME = "microtool_paid";
const TOKEN_ISSUER = "microtool";

type SessionPayload = {
  email: string;
};

type PaidPayload = {
  toolIds: string[];
};

function getSecret(): Uint8Array {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "local-dev-microtool-secret";
  return new TextEncoder().encode(secret);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function signToken(payload: SessionPayload | PaidPayload, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSecret(), {
      issuer: TOKEN_ISSUER
    });

    const email = (verified.payload.email as string | undefined)?.trim().toLowerCase();
    if (!email) {
      return null;
    }

    return { email };
  } catch {
    return null;
  }
}

async function verifyPaidToken(token: string | undefined): Promise<PaidPayload> {
  if (!token) {
    return { toolIds: [] };
  }

  try {
    const verified = await jwtVerify(token, getSecret(), {
      issuer: TOKEN_ISSUER
    });

    const toolIds = Array.isArray(verified.payload.toolIds)
      ? verified.payload.toolIds.filter((id): id is string => typeof id === "string")
      : [];

    return { toolIds };
  } catch {
    return { toolIds: [] };
  }
}

export async function setSessionCookie(response: NextResponse, email: string): Promise<void> {
  const token = await signToken({ email: normalizeEmail(email) }, "30d");
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getSessionFromCookiesStore(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function addPaidToolCookie(
  response: NextResponse,
  req: NextRequest,
  toolId: string
): Promise<void> {
  const existingToken = req.cookies.get(PAID_COOKIE_NAME)?.value;
  const existing = await verifyPaidToken(existingToken);
  const toolIds = Array.from(new Set([...existing.toolIds, toolId]));
  const token = await signToken({ toolIds }, "90d");

  response.cookies.set(PAID_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
    path: "/"
  });
}

export async function hasPaidToolCookie(req: NextRequest, toolId: string): Promise<boolean> {
  const existingToken = req.cookies.get(PAID_COOKIE_NAME)?.value;
  const existing = await verifyPaidToken(existingToken);
  return existing.toolIds.includes(toolId);
}

export async function hasPaidToolCookieFromStore(toolId: string): Promise<boolean> {
  const store = await cookies();
  const existingToken = store.get(PAID_COOKIE_NAME)?.value;
  const existing = await verifyPaidToken(existingToken);
  return existing.toolIds.includes(toolId);
}

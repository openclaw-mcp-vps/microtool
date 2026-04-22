import { NextResponse } from "next/server";

import { setPaidAccessCookie } from "@/lib/auth";
import { canUnlockAccess } from "@/lib/payments";

function sanitizedRedirect(target: string | null): string {
  if (!target || !target.startsWith("/")) {
    return "/dashboard";
  }

  return target;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  let email = "";
  let redirectTo = "/dashboard";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { email?: string; redirectTo?: string };
    email = body.email ?? "";
    redirectTo = sanitizedRedirect(body.redirectTo ?? "/dashboard");
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") ?? "");
    redirectTo = sanitizedRedirect(String(formData.get("redirectTo") ?? "/dashboard"));
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const canUnlock = await canUnlockAccess(email);

  if (!canUnlock) {
    if (contentType.includes("application/json")) {
      return NextResponse.json(
        {
          unlocked: false,
          message:
            "No completed purchase found for this email yet. If you just paid, wait for the webhook and retry."
        },
        { status: 403 }
      );
    }

    return NextResponse.redirect(
      new URL(`${redirectTo}?unlock=failed`, request.url),
      {
        status: 303
      }
    );
  }

  if (contentType.includes("application/json")) {
    const response = NextResponse.json({ unlocked: true });
    setPaidAccessCookie(response);
    return response;
  }

  const response = NextResponse.redirect(new URL(`${redirectTo}?unlock=success`, request.url), {
    status: 303
  });
  setPaidAccessCookie(response);
  return response;
}

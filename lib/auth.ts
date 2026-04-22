import type { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "microtool_paid_access";
export const ACCESS_COOKIE_VALUE = "granted";

export function hasPaidAccessCookie(value: string | undefined): boolean {
  return value === ACCESS_COOKIE_VALUE;
}

export function setPaidAccessCookie(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearPaidAccessCookie(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 0
  });
}

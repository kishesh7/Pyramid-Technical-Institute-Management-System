import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully." });

  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}


import { SignJWT, jwtVerify } from "jose";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is missing from .env");
}

const secretKey = Buffer.from(secret, "base64");

if (secretKey.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 random bytes.");
}

export const sessionCookieName = "pyramid_session";
export const sessionDuration = 8 * 60 * 60;

export async function createSession(userId: string) {
  return new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (!payload.sub || payload.role !== "ADMIN") {
      return null;
    }

    return {
      userId: payload.sub,
      role: "ADMIN" as const,
    };
  } catch {
    return null;
  }
}

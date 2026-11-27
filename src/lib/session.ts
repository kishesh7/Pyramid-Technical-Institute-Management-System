
import { SignJWT, jwtVerify } from "jose";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is missing from environment variables.");
}

const secretKey = Buffer.from(secret, "base64");

if (secretKey.length < 32) {
  throw new Error(
    "SESSION_SECRET must contain at least 32 random bytes."
  );
}

export const sessionCookieName = "pyramid_session";
export const sessionDuration = 8 * 60 * 60;

const SESSION_ISSUER = "pyramid-ngo";
const SESSION_AUDIENCE = "pyramid-ngo-admin";

export async function createSession(userId: string) {
  if (!userId) {
    throw new Error("A valid user ID is required.");
  }

  return new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      !payload.sub ||
      payload.role !== "ADMIN" ||
      typeof payload.sub !== "string"
    ) {
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

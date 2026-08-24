import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "alfabe_session";

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
}

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "alfabe-dev-secret-degistirin");

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return {
      userId: payload.userId,
      username: String(payload.username ?? ""),
      role: payload.role,
    };
  } catch {
    return null;
  }
}

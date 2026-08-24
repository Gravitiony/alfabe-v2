import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { verifySession, type SessionPayload } from "./jwt";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function mailAddress(username: string): string {
  const domain = process.env.MAIL_DOMAIN || "alfabe.co";
  return `${username.toLowerCase()}@${domain}`;
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get("alfabe_session")?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (session) {
    prisma.user
      .update({ where: { id: session.userId }, data: { lastSeenAt: new Date() } })
      .catch(() => {});
  }
  return session;
}

export async function requireRole(...roles: string[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) redirect("/giris");
  return session;
}

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

export function token() { return randomBytes(32).toString("base64url"); }
export function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function rateLimit(key: string, limit = 5, windowMs = 60 * 60 * 1000): Promise<boolean | null> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  try {
    const row = await db.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt <= now) {
      await db.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
      return true;
    }
    if (row.count >= limit) return false;
    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch { return null; }
}

export async function clientKey(scope: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${scope}:${digest(ip).slice(0, 24)}`;
}

const secret = () => {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
};

export async function setAdminSession(adminId: string) {
  const signed = await new SignJWT({ role: "ADMIN" }).setProtectedHeader({ alg: "HS256" }).setSubject(adminId).setIssuedAt().setExpirationTime("8h").sign(secret());
  (await cookies()).set("scendey_admin", signed, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
}

export async function currentAdmin() {
  try {
    const signed = (await cookies()).get("scendey_admin")?.value;
    if (!signed) return null;
    const { payload } = await jwtVerify(signed, secret());
    if (payload.role !== "ADMIN" || !payload.sub) return null;
    return db.adminUser.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true } });
  } catch { return null; }
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}

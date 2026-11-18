import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { clientKey, rateLimit, setAdminSession } from "@/lib/security";

function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!await rateLimit(await clientKey("admin-login"), 5, 15 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await setAdminSession(admin.id);
  await db.auditLog.create({ data: { adminId: admin.id, action: "admin.sign_in" } });
  return NextResponse.json({ ok: true });
}

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientKey, digest, rateLimit, setAdminSession } from "@/lib/security";

export async function POST(request: Request) {
  const configured = process.env.ADMIN_SETUP_TOKEN;
  if (!configured || configured.length < 32) return NextResponse.json({ error: "Admin setup is not enabled." }, { status: 404 });
  const allowed = await rateLimit(await clientKey("admin-setup"), 5, 15 * 60 * 1000);
  if (allowed === null) return NextResponse.json({ error: "Setup is temporarily unavailable." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const setupToken = typeof body.setupToken === "string" ? body.setupToken : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 14 || password.length > 256) return NextResponse.json({ error: "Enter a valid email and a password of 14–256 characters." }, { status: 400 });
  const expected = Buffer.from(digest(configured), "hex");
  const actual = Buffer.from(digest(setupToken), "hex");
  if (!timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Setup code is incorrect." }, { status: 401 });
  try {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    const admin = await db.$transaction(async tx => {
      if (await tx.adminUser.count()) return null;
      const created = await tx.adminUser.create({ data: { email, passwordHash } });
      await tx.auditLog.create({ data: { adminId: created.id, action: "admin.initial_setup" } });
      return created;
    }, { isolationLevel: "Serializable" });
    if (!admin) return NextResponse.json({ error: "An administrator is already configured. Use the sign-in page." }, { status: 409 });
    await setAdminSession(admin.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Admin setup could not be completed. Please try again." }, { status: 503 });
  }
}

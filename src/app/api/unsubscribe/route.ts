import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digest } from "@/lib/security";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || token.length < 30) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
  const record = await db.emailVerificationToken.findUnique({ where: { digest: digest(token) } });
  if (!record || record.purpose !== "UNSUBSCRIBE") return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 404 });
  await db.waitlistEntry.update({ where: { id: record.entryId }, data: { consent: false, unsubscribedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

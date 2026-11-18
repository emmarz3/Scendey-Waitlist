import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/security";
import { contactSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!await rateLimit(await clientKey("contact"), 5)) return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  const { email, name, subject, message } = parsed.data;
  await db.contactRequest.create({ data: { email, name, subject, message } });
  await db.analyticsEvent.create({ data: { name: "contact_submitted" } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

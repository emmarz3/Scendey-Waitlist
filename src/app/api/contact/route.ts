import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/security";
import { notifyFormspree } from "@/lib/formspree";
import { contactSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const allowed = await rateLimit(await clientKey("contact"), 5);
  if (allowed === null) return NextResponse.json({ error: "Contact is temporarily unavailable." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  const { email, name, subject, message } = parsed.data;
  await db.contactRequest.create({ data: { email, name, subject, message } });
  await db.analyticsEvent.create({ data: { name: "contact_submitted" } });
  const notification = await notifyFormspree({ email, name: name ?? "", subject, message, type: "contact_request" });
  if (!notification.sent && process.env.FORMSPREE_FORM_ID) console.warn(`[SCENDEY] Formspree contact notification failed: ${notification.reason}`);
  return NextResponse.json({ ok: true }, { status: 201 });
}

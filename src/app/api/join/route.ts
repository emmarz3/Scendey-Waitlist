import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digest, rateLimit, token } from "@/lib/security";
import { sendMail, templates } from "@/lib/email";
import { notifyFormspree } from "@/lib/formspree";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter your details and try again." }, { status: 400 }); }
  if (body && typeof body === "object" && "website" in body && (body as { website?: string }).website) return NextResponse.json({ ok: true, existing: false, delivered: false });
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = parsed.data;
  // Limit each address, rather than a shared proxy IP. A legitimate visitor
  // cannot exhaust another visitor's signup allowance.
  const allowed = await rateLimit(`join:${digest(data.email).slice(0, 32)}`, 5, 15 * 60 * 1000);
  if (allowed === null) return NextResponse.json({ error: "Signup is temporarily unavailable. Please try again shortly." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Too many attempts for this email address. Please try again in 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } });
  try {
    const found = await db.waitlistEntry.findUnique({ where: { email: data.email }, select: { id: true } });
    if (found) return NextResponse.json({ ok: true, existing: true, delivered: false, message: "That email is already registered. If you need help, contact us." });
    const referrer = data.referral ? await db.waitlistEntry.findUnique({ where: { referralCode: data.referral }, select: { id: true } }) : null;
    if (data.referral && !referrer) return NextResponse.json({ error: "That referral link is invalid. Remove it and try again." }, { status: 400 });
    const invitation = data.invitation ? await db.invitation.findUnique({ where: { code: data.invitation } }) : null;
    if (data.invitation && (!invitation || invitation.uses >= invitation.maxUses || (invitation.expiresAt && invitation.expiresAt < new Date()) || (invitation.role && invitation.role !== data.role))) return NextResponse.json({ error: "That invitation is invalid or expired." }, { status: 400 });
    const entry = await db.waitlistEntry.create({ data: {
      role: data.role, email: data.email, consent: data.consent,
      consentVersion: data.consent ? "2026-11-18" : null, consentAt: data.consent ? new Date() : null,
      source: data.consent ? data.source : null, utmSource: data.consent ? data.utmSource : null, utmMedium: data.consent ? data.utmMedium : null, utmCampaign: data.consent ? data.utmCampaign : null,
      invitationCode: invitation?.code,
      ...(data.role === "BRAND" ? { brandName: data.brandName, category: data.category, sellingStatus: data.sellingStatus, handleOrUrl: data.handleOrUrl, location: data.location, phone: data.phone, salesBlocker: data.salesBlocker } : { name: data.name, location: data.location, interests: JSON.stringify(data.interests) }),
      referredById: referrer?.id
    } });
    const raw = token();
    await db.emailVerificationToken.create({ data: { digest: digest(raw), purpose: "VERIFY", entryId: entry.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
    await db.analyticsEvent.create({ data: { name: "signup_submitted", role: data.role, source: data.source, entryId: entry.id } });
    const link = `${process.env.APP_URL ?? new URL(request.url).origin}/confirm/${raw}`;
    const [delivery, notification] = await Promise.all([
      sendMail({ to: data.email, ...templates.verification(link) }),
      notifyFormspree({ email: data.email, name: data.role === "BRAND" ? data.brandName : data.name ?? "", role: data.role, category: data.role === "BRAND" ? data.category : "", signupId: entry.id, type: "waitlist_signup" })
    ]);
    if (!notification.sent && process.env.FORMSPREE_FORM_ID) console.warn(`[SCENDEY] Formspree waitlist notification failed: ${notification.reason}`);
    const response: Record<string, unknown> = { ok: true, existing: false, delivered: delivery.sent };
    if (!delivery.sent) response.message = "Your signup is saved, but email verification is unavailable right now. Please try again later or contact us.";
    if (!delivery.sent && process.env.NODE_ENV !== "production") response.previewVerificationUrl = link;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ ok: true, existing: true, delivered: false, message: "That email is already registered. If you need help, contact us." });
    return NextResponse.json({ error: "Signup is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digest, rateLimit } from "@/lib/security";
import { sendMail, templates } from "@/lib/email";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || token.length < 30) return NextResponse.json({ error: "This verification link is invalid." }, { status: 400 });
  if (!await rateLimit(`confirm:${digest(token).slice(0, 24)}`, 8, 60 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const record = await db.emailVerificationToken.findUnique({ where: { digest: digest(token) }, include: { entry: true } });
  if (!record || record.purpose !== "VERIFY" || record.usedAt || record.expiresAt < new Date()) return NextResponse.json({ error: "This verification link has expired or was already used. Request a new one from the signup page." }, { status: 410 });
  const code = record.entry.referralCode ?? crypto.randomUUID().replaceAll("-", "");
  const entry = await db.$transaction(async tx => {
    await tx.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    const updated = await tx.waitlistEntry.update({ where: { id: record.entryId }, data: { status: "CONFIRMED", verifiedAt: new Date(), referralCode: code } });
    await tx.waitlistStatusEvent.create({ data: { entryId: updated.id, from: record.entry.status, to: "CONFIRMED" } });
    if (updated.referredById) {
      const prior = await tx.referral.findUnique({ where: { referredEntryId: updated.id } });
      if (!prior) await tx.referral.create({ data: { referrerId: updated.referredById, referredEntryId: updated.id, confirmedAt: new Date() } });
      await tx.analyticsEvent.create({ data: { name: "referral_confirmed", role: updated.role, source: updated.source, entryId: updated.id } });
    }
    if (updated.invitationCode) {
      const invite = await tx.invitation.findUnique({ where: { code: updated.invitationCode } });
      if (invite && invite.uses < invite.maxUses && (!invite.expiresAt || invite.expiresAt > new Date())) {
        await tx.invitation.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
        await tx.analyticsEvent.create({ data: { name: "invitation_accepted", role: updated.role, entryId: updated.id } });
      }
    }
    await tx.analyticsEvent.create({ data: { name: "email_verified", role: updated.role, source: updated.source, entryId: updated.id } });
    return updated;
  });
  const baseUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const unsubscribeToken = crypto.randomUUID() + crypto.randomUUID();
  await db.emailVerificationToken.create({ data: { digest: digest(unsubscribeToken), purpose: "UNSUBSCRIBE", entryId: entry.id, expiresAt: new Date("9999-12-31") } });
  await sendMail({ to: entry.email, ...templates.welcome(entry.role, `${baseUrl}/unsubscribe/${unsubscribeToken}`) });
  return NextResponse.json({ ok: true, role: entry.role, referralUrl: `${baseUrl}/invite/${code}` });
}

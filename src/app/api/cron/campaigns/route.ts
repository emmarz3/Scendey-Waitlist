import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digest, token } from "@/lib/security";
import { sendMail, templates } from "@/lib/email";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || supplied.length !== secret.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });

  const now = new Date();
  const campaigns = await db.campaign.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, orderBy: { scheduledAt: "asc" }, take: 10 });
  const results: { id: string; delivered: number; recipients: number; status: string }[] = [];
  for (const campaign of campaigns) {
    const claim = await db.campaign.updateMany({ where: { id: campaign.id, status: "SCHEDULED", scheduledAt: { lte: now } }, data: { status: "SENDING" } });
    if (!claim.count) continue;
    const content = await db.campaignSetting.findUnique({ where: { key: `campaign-body:${campaign.id}` } });
    const audience = { status: "CONFIRMED", consent: true, unsubscribedAt: null, ...(campaign.segment === "ALL" ? {} : { role: campaign.segment }) };
    const eligible = await db.waitlistEntry.count({ where: audience });
    if (eligible > 50 || !content) {
      await db.campaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
      await db.auditLog.create({ data: { action: "campaign.scheduled.failed", target: campaign.id, metadata: JSON.stringify({ eligible, reason: eligible > 50 ? "recipient_limit" : "missing_content" }) } });
      results.push({ id: campaign.id, delivered: 0, recipients: eligible, status: "FAILED" });
      continue;
    }
    const recipients = await db.waitlistEntry.findMany({ where: audience, take: 50, select: { id: true, email: true, role: true } });
    let delivered = 0;
    for (const entry of recipients) {
      const raw = token();
      await db.emailVerificationToken.create({ data: { digest: digest(raw), purpose: "UNSUBSCRIBE", entryId: entry.id, expiresAt: new Date("9999-12-31") } });
      const url = `${process.env.APP_URL ?? new URL(request.url).origin}/unsubscribe/${raw}`;
      const message = templates.progress(content.value, url);
      const sent = await sendMail({ to: entry.email, subject: campaign.subject, html: message.html });
      await db.campaignRecipient.upsert({ where: { campaignId_entryId: { campaignId: campaign.id, entryId: entry.id } }, create: { campaignId: campaign.id, entryId: entry.id, event: sent.sent ? "SENT" : "FAILED", detail: sent.sent ? null : sent.reason }, update: { event: sent.sent ? "SENT" : "FAILED", detail: sent.sent ? null : sent.reason } });
      if (sent.sent) { delivered++; await db.analyticsEvent.create({ data: { name: "campaign_email_sent", role: entry.role, entryId: entry.id } }); }
    }
    const status = content && recipients.length > 0 && delivered === recipients.length ? "SENT" : "FAILED";
    await db.campaign.update({ where: { id: campaign.id }, data: { status, sentAt: delivered ? new Date() : null } });
    await db.auditLog.create({ data: { action: "campaign.scheduled.send", target: campaign.id, metadata: JSON.stringify({ recipients: recipients.length, delivered }) } });
    results.push({ id: campaign.id, delivered, recipients: recipients.length, status });
  }
  return NextResponse.json({ processed: results.length, results });
}

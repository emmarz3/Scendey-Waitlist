import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/security";

const schema = z.object({ campaign_enabled: z.boolean(), referrals_enabled: z.boolean(), campaign_perks: z.string().max(1000) });
export async function GET() {
  if (!await currentAdmin()) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const rows = await db.campaignSetting.findMany({ where: { key: { in: ["campaign_enabled", "referrals_enabled", "campaign_perks"] } } });
  const values = Object.fromEntries(rows.map(row => [row.key, row.value]));
  return NextResponse.json({ campaign_enabled: values.campaign_enabled !== "false", referrals_enabled: values.referrals_enabled !== "false", campaign_perks: values.campaign_perks ?? "" });
}
export async function PUT(request: Request) {
  const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ error: "Invalid campaign settings." }, { status: 400 });
  const value = input.data;
  await db.$transaction(async tx => {
    for (const [key, setting] of Object.entries({ campaign_enabled: String(value.campaign_enabled), referrals_enabled: String(value.referrals_enabled), campaign_perks: value.campaign_perks.trim() })) await tx.campaignSetting.upsert({ where: { key }, create: { key, value: setting }, update: { value: setting } });
    await tx.auditLog.create({ data: { adminId: admin.id, action: "settings.update", metadata: JSON.stringify({ campaign_enabled: value.campaign_enabled, referrals_enabled: value.referrals_enabled }) } });
  });
  return NextResponse.json({ ok: true });
}

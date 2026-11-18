import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/security";

const schema = z.object({ name: z.enum(["waitlist_page_view", "audience_selected", "signup_started", "referral_link_copied"]), role: z.enum(["BRAND", "SHOPPER"]).optional(), source: z.string().trim().max(100).optional() });
export async function POST(request: Request) {
  const key = await clientKey("analytics"); if (!await rateLimit(key, 30)) return NextResponse.json({ ok: true });
  const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ ok: false }, { status: 400 });
  await db.analyticsEvent.create({ data: input.data }); return NextResponse.json({ ok: true });
}

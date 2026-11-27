import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/security";

function csv(value: unknown) { const text = value instanceof Date ? value.toISOString() : String(value ?? ""); return `"${text.replaceAll('"', '""')}"`; }
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const entries = await db.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  await db.auditLog.create({ data: { adminId: admin.id, action: "entries.export", metadata: JSON.stringify({ count: entries.length, format: "csv" }) } });
  const fields = ["id", "role", "audienceCategory", "email", "name", "brandName", "category", "sellingStatus", "handleOrUrl", "location", "consent", "consentVersion", "consentAt", "status", "verifiedAt", "invitationSentAt", "unsubscribedAt", "source", "utmSource", "utmMedium", "utmCampaign", "createdAt"] as const;
  const lines = [fields.join(","), ...entries.map(entry => fields.map(field => csv(entry[field])).join(","))];
  return new NextResponse(lines.join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=scendey-waitlist.csv", "cache-control": "no-store" } });
}

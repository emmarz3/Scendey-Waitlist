import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/security";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "INVITED", "SUPPRESSED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = statusSchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ error: "Invalid entry status." }, { status: 400 });
  const { id } = await params; const existing = await db.waitlistEntry.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  if (existing.status === input.data.status) return NextResponse.json({ ok: true, changed: false });
  const now = new Date();
  await db.$transaction(async tx => {
    await tx.waitlistEntry.update({ where: { id }, data: { status: input.data.status, ...(input.data.status === "CONFIRMED" ? { verifiedAt: now } : {}) } });
    await tx.waitlistStatusEvent.create({ data: { entryId: id, from: existing.status, to: input.data.status, adminId: admin.id } });
    await tx.auditLog.create({ data: { adminId: admin.id, action: "entry.status.change", target: id, metadata: JSON.stringify({ from: existing.status, to: input.data.status }) } });
  });
  return NextResponse.json({ ok: true, changed: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params; const entry = await db.waitlistEntry.findUnique({ where: { id }, select: { id: true } });
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  await db.$transaction(async tx => {
    await tx.auditLog.create({ data: { adminId: admin.id, action: "entry.delete", target: id } });
    await tx.waitlistEntry.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}

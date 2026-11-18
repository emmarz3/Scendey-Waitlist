import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 14) throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 14 characters before seeding.");
  const salt = randomBytes(16).toString("hex");
  const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  await db.adminUser.upsert({ where: { email }, create: { email, passwordHash: hash }, update: { passwordHash: hash } });
  const configuredPerks = process.env.CAMPAIGN_PERKS?.trim();
  if (configuredPerks) await db.campaignSetting.upsert({ where: { key: "perks" }, create: { key: "perks", value: configuredPerks }, update: { value: configuredPerks } });
}
main().finally(() => db.$disconnect());

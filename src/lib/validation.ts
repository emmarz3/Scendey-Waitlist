import { z } from "zod";

const base = {
  email: z.preprocess(v => typeof v === "string" ? v.trim().toLowerCase() : v, z.email().max(254)),
  consent: z.boolean().default(false),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(), utmMedium: z.string().max(100).optional(), utmCampaign: z.string().max(100).optional(),
  referral: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/).optional(),
  invitation: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/).optional()
};

export const signupSchema = z.discriminatedUnion("role", [
  z.object({ ...base, role: z.literal("BRAND"), brandName: z.string().trim().min(2).max(100), category: z.string().min(1).max(60), sellingStatus: z.string().max(80).optional(), handleOrUrl: z.string().max(200).optional(), location: z.string().max(100).optional(), phone: z.string().max(40).optional(), salesBlocker: z.string().max(1000).optional() }),
  z.object({ ...base, role: z.literal("SHOPPER"), name: z.string().trim().max(100).optional(), location: z.string().max(100).optional(), interests: z.array(z.string().max(60)).max(20).default([]) })
]);

export const contactSchema = z.object({ email: z.email().max(254).transform(v => v.trim().toLowerCase()), name: z.string().trim().max(100).optional(), subject: z.string().trim().min(2).max(120), message: z.string().trim().min(10).max(3000), website: z.string().max(200).optional() });

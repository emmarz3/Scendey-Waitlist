# SCENDEY waitlist

Prelaunch waitlist campaign built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and GSAP. The SCENDEY wordmark is a replaceable text placeholder because this workspace did not contain a logo asset. Store and seller workspace visuals are concept previews; the product is not represented as live.

## Local setup

1. Install Node.js 20+ and copy `.env.example` to `.env`.
2. Set `ADMIN_SESSION_SECRET` to at least 32 random characters. Set a local admin email and a password of at least 14 characters.
3. Run `npm install`, `npx prisma migrate deploy`, and `npm run db:seed`.
4. Run `npm run dev` and visit `http://localhost:3000`.

Use a PostgreSQL database for local development and set `DATABASE_URL`. Production uses the reviewed `20261119_postgresql_initial` migration. The Railway backend references the private Postgres service and runs `prisma migrate deploy` before startup. Configure a transactional email provider (`EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`) before accepting real waitlist users. On Vercel, set `BACKEND_URL` to the Railway HTTPS origin so `/api`, `/admin`, and `/invite` proxy to the backend; set Railway `APP_URL` and `CANONICAL_URL` to the final public Vercel origin.

When email is unconfigured, signup still saves a pending record but does not claim verification was sent. In development only, the success page offers the generated verification link, and the message preview is logged to the local server. Configure a real provider before inviting real users. `EMAIL_API_URL` is expected to accept a POST JSON payload `{from,to,subject,html}` and bearer authentication; provider response failures are shown honestly.

## Operations

- Create the first local admin with `npm run db:seed`; the seed stores a scrypt password hash, never the raw password.
- Admin pages are protected by a signed HTTP-only session cookie. Change the session secret for production.
- Campaign perks are blank unless the owner sets `CAMPAIGN_PERKS`.
- Privacy notice and campaign terms are draft copy and require owner/legal review.
- Instagram and TikTok links are general destinations only; there are no direct publishing integrations.

## Routes

Public campaign pages: `/`, `/brands`, `/shoppers`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`.

Signup lifecycle: `/join?type=brand|shopper`, `/join/success`, `/confirm/[token]`, `/invite/[code]`, `/my-status`, `/unsubscribe/[token]`.

Admin: `/admin/sign-in`, `/admin`, `/admin/entries`, `/admin/entries/[id]`, `/admin/segments`, `/admin/invitations`, `/admin/campaigns`, `/admin/referrals`, `/admin/analytics`, `/admin/settings`, `/admin/audit`.

The admin campaign workspace supports drafts, audience counts, test sends, confirmation-gated batch sends, and per-recipient outcomes. Sending needs a configured email provider and is capped at 50 recipients per request. Scheduled campaigns can be created through the campaign API and are dispatched by `POST /api/cron/campaigns` with `Authorization: Bearer $CRON_SECRET`; configure an external scheduler to call it regularly. This endpoint is not scheduled automatically by the app host. Protected admin routes include CSV export and entry deletion; entry status changes are audited and tracked in status history.

Production gaps: connect a transactional email provider and verify its sender domain; seed the initial admin with owner-provided credentials; configure a scheduler for campaigns; complete analytics event coverage and category/stage reporting. Privacy notice and campaign terms require owner review before launch. A tracked `.env` and obfuscated startup script were removed; rotate any historical credentials and review deployment logs before treating earlier builds as trusted.

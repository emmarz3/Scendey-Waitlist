# SCENDEY waitlist

Prelaunch waitlist campaign built with Next.js App Router, TypeScript, Prisma, SQLite, and GSAP. The SCENDEY wordmark is a replaceable text placeholder because this workspace did not contain a logo asset. Store and seller workspace visuals are concept previews; the product is not represented as live.

## Local setup

1. Install Node.js 20+ and copy `.env.example` to `.env`.
2. Set `ADMIN_SESSION_SECRET` to at least 32 random characters. Set a local admin email and a password of at least 14 characters.
3. Run `npm install`, `npm run db:push`, and `npm run db:seed`.
4. Run `npm run dev` and visit `http://localhost:3000`.

SQLite data is persisted in `prisma/dev.db` for local use. Back up that file locally; it is ignored by git. For production, provision a persistent relational database and adapt the Prisma datasource/migration workflow, then configure secure server secrets, a canonical `APP_URL`, and a transactional email endpoint/key/from address. No production storage, email provider, or hosting account was supplied with this project.

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

Production gaps: PostgreSQL schema/migrations and deployment setup, automatic scheduled-campaign configuration, campaign schedule controls in the admin UI, complete analytics event coverage and category/stage reporting, and delivery of real invitation emails still need completion. No email provider, production database, hosting account, or cron service credentials were supplied. Privacy notice and campaign terms require owner/legal review before launch. Do not use the local SQLite setup for production.

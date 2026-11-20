# SCENDEY waitlist

Prelaunch waitlist campaign built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and GSAP. The SCENDEY wordmark is a replaceable text placeholder because this workspace did not contain a logo asset. Store and seller workspace visuals are concept previews; the product is not represented as live.

## Local setup

1. Install Node.js 20+ and copy `.env.example` to `.env`.
2. Set `ADMIN_SESSION_SECRET` to at least 32 random characters. Set a local admin email and a password of at least 14 characters.
3. Run `npm install`, `npx prisma migrate deploy`, and `npm run db:seed`.
4. Run `npm run dev` and visit `http://localhost:3000`.

Use a PostgreSQL database for local development and set `DATABASE_URL`. Production uses the reviewed `20261119_postgresql_initial` migration. The Railway backend references the private Postgres service and runs `prisma migrate deploy` before startup. Configure Resend on the server before accepting real waitlist users: set `EMAIL_API_KEY` to a Resend API key and `EMAIL_FROM` to a sender address on a domain verified in Resend. The API URL defaults to `https://api.resend.com/emails`; set `EMAIL_API_URL` only when using a compatible custom endpoint. On Vercel, set `BACKEND_URL` to the Railway HTTPS origin so `/api`, `/admin`, and `/invite` proxy to the backend; set Railway `APP_URL` and `CANONICAL_URL` to the final public Vercel origin.

When email is unconfigured, signup still saves a pending record but does not claim verification was sent. In development only, the success page offers the generated verification link, and the message preview is logged to the local server. Configure Resend before inviting real users. Email delivery uses the Resend API with bearer authentication; provider response failures are shown honestly.

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

## Signup, email, and admin setup

The waitlist signup limit is per normalized email address (five submissions in 15 minutes). A shared proxy IP no longer blocks unrelated visitors. A database outage returns 503 rather than an inaccurate rate-limit message.

Create a Formspree form and set its **Target Email** to the SCENDEY team's inbox. Copy the ID from `https://formspree.io/f/FORM_ID` into the Railway backend service variable `FORMSPREE_FORM_ID`. The backend submits each successful waitlist signup and contact request to Formspree. The database remains the source of truth: a failed Formspree notification never discards a signup. Do not send admin credentials or verification tokens to Formspree.

To send a simple acknowledgement to the submitted `email`, enable **Workflow → Auto Response** for that form. Formspree currently requires a Professional or Business plan for Auto Response. Its acknowledgement is static and **does not confirm the waitlist email address**. Tokenized email verification, welcome messages, invitations, and campaigns use Resend configured with `EMAIL_API_KEY` and `EMAIL_FROM`. Only a successful verification email sets the signup response's `delivered` field to true. A confirmed entry is created only after the recipient follows the verification link.

For the first administrator, set `ADMIN_SETUP_TOKEN` on the Railway backend to a new random secret of at least 32 characters (for example `openssl rand -hex 32`), then visit `/admin/setup` on the backend or the proxied frontend. Enter that code, your admin email, and a unique password of at least 14 characters. This creates one administrator and signs you in. Afterward, remove `ADMIN_SETUP_TOKEN` from Railway; setup remains closed while an admin exists. Admin credentials are never placed in source control. Existing local seed flow (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `npm run db:seed`) remains available for local development.

On Vercel, `BACKEND_URL` must point to the Railway backend HTTPS origin, and the Railway `APP_URL` and `CANONICAL_URL` must be changed to the frontend production origin. Deploy after changing these variables so rewrites and verification links use the right site.

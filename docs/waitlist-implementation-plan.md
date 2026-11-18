# SCENDEY waitlist implementation plan

## Repository findings

The workspace is empty: there is no existing framework, source tree, brand asset, database, or package manifest to preserve. Use a replaceable text wordmark (`SCENDEY`) until an approved logo is supplied. Do not represent preview concepts as live commerce features.

## Route inventory

- Public campaign: `/`, `/brands`, `/shoppers`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`.
- Signup and lifecycle: `/join?type=brand|shopper`, `/join/success`, `/confirm/[token]`, `/invite/[code]`, `/my-status`, `/unsubscribe/[token]`.
- Admin: `/admin/sign-in`, `/admin`, `/admin/entries`, `/admin/entries/[id]`, `/admin/segments`, `/admin/invitations`, `/admin/campaigns`, `/admin/referrals`, `/admin/analytics`, `/admin/settings`, `/admin/audit`.
- Framework error surfaces: not-found, invalid/expired token or referral, unavailable email, and general error.

## Data model

Relational PostgreSQL schema: `WaitlistEntry`, `EmailVerificationToken`, `Referral`, `Invitation`, `Campaign`, `CampaignRecipient`/event, `ContactRequest`, `AdminUser`, `AuditLog`, and `CampaignSetting`. Normalize and uniquely constrain email, use opaque expiring single-use token digests, record consent/source/timestamps/suppression, and index role/status/source/referral lookups. No production in-memory persistence. Local development may use a documented persistent SQLite database if provider availability makes PostgreSQL setup impractical.

## Design tokens and direction

- Gunmetal `#262A2E`, charcoal `#171A1D`, silver `#C4C9CD`, light silver `#F4F5F5`, signal red `#D62832`, white, and near-black.
- Editorial display typography paired with a legible sans serif; left-aligned campaign copy; broad but bounded content width; clean rules and a few distinct image-led compositions instead of repeated cards.
- The memorable element is an explicitly labeled storefront/workspace preview, treated as a design prototype. Responsive layouts are planned for desktop, tablet, and mobile; CTA and form remain immediately usable.
- Motion uses GSAP with scoped React cleanup and reduced-motion handling; no layout-dependent animation or autoplay media.

## Dependencies and architecture

Start with Next.js App Router and TypeScript. Use server actions/route handlers for validation and mutations, a relational ORM with migrations, provider adapters for email and analytics, and server-enforced admin authorization. Keep secrets server-side. Add dependencies only for confirmed needs. Provide `.env.example`, local setup, migrations, and development-only seed guidance.

## Risks / external configuration

- Email delivery, production database, canonical domain, social destinations, admin bootstrap, and analytics provider require owner configuration.
- Privacy and campaign terms are draft copy and need legal review.
- The brief does not define campaign perks; show none unless configured.
- Without provider credentials, verification and campaign delivery must report unavailable status and expose a safe local-development path without claiming delivery.

## Acceptance criteria

- Every listed route renders with working navigation and clear unavailable/invalid states.
- Signup persists normalized pending entries with role-specific validated fields, separate consent, source attribution, rate limiting, and duplicate-safe responses.
- Verification is signed, expiring, single-use; only verified referrals count. Status access is private and suppression/unsubscribe works.
- Admin routes and mutations require server-side authentication; sensitive actions are audited.
- Email templates are separated from delivery, and page views never send mail.
- SEO metadata, sitemap, robots policy, responsive accessible forms/navigation, reduced-motion behavior, meaningful analytics, setup/deployment instructions, and focused tests are included.
- Type check, lint, build, and key signup/referral/admin flows are verified where the local environment permits; blockers are reported precisely.

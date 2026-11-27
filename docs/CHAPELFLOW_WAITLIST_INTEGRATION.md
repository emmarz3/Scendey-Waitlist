# ChapelFlow public waitlist integration

Branch: feature/chapelflow-waitlist-integration  
Date: 27 November 2026

ChapelFlow submits registrations to the existing Scendey POST /api/join endpoint through its own backend relay. Scendey remains the canonical waitlist store.

## Signup data contract

- role remains BRAND or SHOPPER.
- audienceCategory is stored independently: STUDENT, STAFF, BUSINESS, or OTHER.
- name is supported for both roles; brand name and category remain required business-specific fields.
- Optional consent remains the permission for marketing and product-update campaigns. It is not required for verification emails.
- source and UTM attribution are stored as acquisition metadata and do not imply marketing permission.

The Prisma migration adds WaitlistEntry.audienceCategory, defaults historical non-brand records to OTHER, and classifies historical brands as BUSINESS.

## Duplicate handling

Email remains globally unique. A repeat registration returns the pre-existing existing: true result and does not create a second entry or silently convert a SHOPPER record to BRAND. The ChapelFlow server relay normalizes the public response to avoid email enumeration.

## Verification and deployment order

1. Apply this repository's new migration to the Scendey PostgreSQL database.
2. Deploy Scendey's app code and verify its health.
3. Confirm ChapelFlow's server-side SCENDEY_WAITLIST_URL points to the HTTPS /api/join endpoint.
4. Deploy ChapelFlow's backend and Celery worker.
5. Run a controlled signup, verification, marketing opt-out and duplicate-email test.
6. Promote the ChapelFlow frontend only after the controlled test passes.

Do not put the Scendey endpoint or secrets in Vite VITE_* variables. No production migration or deployment is performed from this branch.

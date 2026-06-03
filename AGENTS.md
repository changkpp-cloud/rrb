# Hreed Ruam Bun Project Guide

## Product Context

Hreed Ruam Bun is a Thai Buddhist zero-waste wreath donation platform. The app supports donors, hosts, centers, and central admins. Treat payment, slip review, memorial status, and nameplate printing as operational workflows with real-world impact.

## Stack

- Next.js App Router with TypeScript
- Supabase for database, storage, and server-side admin access
- Tailwind CSS v4
- PromptPay QR, donation slip upload, nameplate printing, ESG reports, and AI photo flows

## Core Flows

Keep the donor flow intact when changing public pages:

1. `/{slug}` memorial information and CTA
2. `/{slug}/payment` PromptPay/payment/slip upload
3. `/{slug}/verifying` transition after slip upload
4. `/{slug}/print-name` donor nameplate entry
5. `/{slug}/ecard` thank-you, e-card, certificate, and AI photo

Admin, center, host, and donor pages must respect these roles:

- Donor: public donation flow only
- Host: event summary, donor list, host documents, and close-out context
- Center: create/open memorials, review slips, print/post nameplates, close memorials, and handle daily operations for its own center
- Admin: receive center reports, view cross-center summaries, open/close/inspect centers, manage users, audit activity, and monitor ESG/system health

Central admin dashboards must not become an operations queue for individual memorials. If a feature asks for slip review, nameplate printing, opening a memorial, or closing a memorial, place it in the center workflow unless the user explicitly asks for a read-only central summary.

## Safety Rules

- Never auto-confirm a donation from AI or image parsing alone. AI may suggest review results, but a human must confirm money movement.
- Keep Supabase service-role usage server-side only.
- Do not commit secrets. Keep `.env.local` private and keep `.env.local.example` aligned with required keys.
- When adding central admin dashboards, prefer center-level read-only aggregation. Add mutations only for central governance actions such as managing centers, users, permissions, or audits.
- Center-scoped views must not expose other centers' donor, host, bank, or slip data.
- Avoid destructive database actions unless the user explicitly asks and the target is verified.

## UI Rules

- Preserve the mobile-first Thai experience.
- Public donor pages should stay calm, ceremonial, and easy for older users to complete.
- Admin and center dashboards should be dense, scannable, and operational, not marketing-like.
- Use existing classes such as `bg-cream-50`, `gold-border`, `card-shadow`, and the established gold/cream/emerald palette.
- Use lucide-react icons already available in the project.
- Test compact mobile widths for overflow, especially QR, donor names, nameplates, and navigation tabs.

## Useful Verification

- Run `npm run build` for type and route checks.
- If changing a UI flow, open the relevant local route and inspect mobile width.
- For payment/nameplate/status changes, check public donor flow and center/admin dashboards together.

# หรีดร่วมบุญ — Zero Waste

แพลตฟอร์มหรีดดิจิทัล ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ

## Tech Stack
- **Next.js 15** (App Router)
- **Supabase** (Database + Storage + Auth)
- **Tailwind CSS v4**
- **TypeScript**

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your keys:
```bash
cp .env.local.example .env.local
```
3. Run the schema in your Supabase SQL editor:
```
supabase/schema.sql
```

### 3. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
app/
  page.tsx              # Main memorial page (SSR + ISR)
  layout.tsx            # Root layout with Thai fonts
  globals.css           # Tailwind + custom gold theme
  api/
    donations/route.ts  # POST donation + slip upload, GET confirmed list

components/
  SiteHeader.tsx        # Sticky header with lotus logo
  MemorialProfile.tsx   # Deceased profile with ornate frame
  CeremonyInfo.tsx      # Ceremony date/time/location card
  WreathBoard.tsx       # Live donor name grid
  PaymentSection.tsx    # Bank info modal + slip upload form
  SiteFooter.tsx        # Footer with ornamental divider
  LotusIcon.tsx         # SVG lotus icon

lib/supabase/
  client.ts             # Browser Supabase client
  server.ts             # Server Supabase client (RSC / API routes)
  types.ts              # TypeScript DB types

supabase/
  schema.sql            # Full DB schema + RLS + Storage + seed data
```

## Environment Variables
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin ops only) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, currently `https://rrb.center` |

## Features
- Mobile-first Thai Buddhist design (gold + cream palette)
- Sticky header with lotus logo
- Deceased memorial profile with ornate photo frame
- Ceremony info card
- Live wreath board showing confirmed donors
- Bank info modal with copyable account number
- Slip upload form with image preview
- ISR (60s revalidation) for donor list
- Falls back to demo data if Supabase not configured

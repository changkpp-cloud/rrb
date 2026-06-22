# Project Status — หรีดร่วมบุญ (RRB)

_Generated 2026-06-19_

---

## 1. Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 |
| UI Runtime | React | ^19.0.0 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Database | Supabase PostgreSQL | @supabase/supabase-js ^2.49.8 |
| Auth helper | @supabase/ssr | ^0.6.1 |
| QR generation | promptpay-qr + qrcode.react | 0.5.0 / 4.2.0 |
| Image export | html-to-image + html2canvas | 1.11.13 / 1.4.1 |
| Icons | lucide-react | ^0.511.0 |
| AI image | OpenAI DALL-E 3 / GPT Image (via `OPENAI_API_KEY`) | internal |
| Deploy | Vercel (auto from GitHub `main`) | — |

---

## 2. Project Structure

```
app/
├── layout.tsx                         # Root layout (Sarabun font)
├── page.tsx                           # Redirect → latest active memorial
│
├── [slug]/                            # Donor-facing public flow
│   ├── layout.tsx
│   ├── page.tsx                       # Memorial overview
│   ├── overview/                      # OverviewClient.tsx
│   ├── payment/page.tsx               # PromptPay QR + slip upload
│   ├── verifying/page.tsx             # Animated transition screen
│   ├── print-name/page.tsx            # Enter donor name → POST /api/donations
│   ├── printing/page.tsx              # E-nameplate display + print trigger
│   └── ecard/page.tsx                 # E-card / condolence card
│
├── ai-photo/
│   └── jobs/[id]/page.tsx             # AI photo job status polling
│
├── certificate/page.tsx               # Zero-waste certificate
├── ecard/page.tsx                     # Standalone e-card (no slug)
├── mock-wreath/page.tsx               # DALL-E wreath simulator
├── payment/page.tsx                   # Standalone payment (legacy)
├── print-name/page.tsx                # Standalone print-name (legacy)
├── print-done/page.tsx                # Success page
├── printing/page.tsx                  # Standalone printing (legacy)
├── verifying/page.tsx                 # Standalone verifying (legacy)
│
├── api/
│   ├── admin/
│   │   ├── login/route.ts             # Admin login → admin_session cookie
│   │   ├── logout/route.ts
│   │   ├── export/route.ts            # CSV export
│   │   └── system-health/route.ts
│   ├── ai-photo/
│   │   ├── generate/route.ts          # GPT Image edit/generate
│   │   ├── jobs/route.ts              # List AI photo jobs
│   │   ├── jobs/[id]/route.ts         # Poll single job
│   │   ├── save/route.ts              # Persist generated image
│   │   ├── credits/route.ts           # Credit check
│   │   └── auth-token/route.ts
│   │   └── service/generate/route.ts  # Internal (bypasses auth)
│   ├── center/
│   │   ├── login/route.ts             # center_session cookie
│   │   └── register/route.ts
│   ├── centers/
│   │   ├── route.ts                   # GET list / POST create
│   │   ├── [id]/route.ts              # GET / PATCH center
│   │   └── [id]/upload-qr/route.ts
│   ├── donations/
│   │   ├── route.ts                   # POST create (auto-confirm)
│   │   ├── [id]/route.ts              # PATCH nameplate_status / donor fields
│   │   └── [id]/slip/route.ts         # GET slip signed URL
│   ├── generate-wreath/route.ts       # DALL-E 3 wreath background
│   ├── memorial/
│   │   ├── route.ts                   # Legacy: GET by slug
│   │   └── host/route.ts              # Host login by host_code
│   ├── memorials/
│   │   ├── create/route.ts            # POST (center dashboard)
│   │   ├── [id]/route.ts              # PATCH update memorial
│   │   ├── [id]/close/route.ts        # POST close memorial
│   │   ├── [id]/info/route.ts         # GET public info
│   │   └── [id]/persons/route.ts      # GET / POST allowed persons
│   │       └── [personId]/route.ts    # DELETE person
│   ├── print-nameplate/route.ts       # Upload PNG + enqueue dispatch_print
│   ├── upload-slip/route.ts           # Upload slip + SHA-256 dedup check
│   ├── webhooks/payment/route.ts      # HMAC-verified payment webhook
│   └── worker/route.ts                # Outbox job processor (GET cron / POST manual)
│
├── dashboard/
│   ├── page.tsx                       # Redirect hub
│   ├── admin/
│   │   ├── page.tsx                   # Admin login page
│   │   └── (protected)/layout.tsx     # admin_session guard
│   │       ├── overview/page.tsx
│   │       ├── centers/page.tsx
│   │       ├── centers/new/page.tsx
│   │       ├── centers/[id]/page.tsx
│   │       ├── memorials/page.tsx
│   │       ├── memorials/[id]/page.tsx
│   │       ├── hosts/page.tsx
│   │       ├── users/page.tsx
│   │       ├── audit/page.tsx
│   │       ├── report/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── esg/page.tsx
│   │       ├── ai-prompts/page.tsx
│   │       └── system/page.tsx
│   ├── center/
│   │   ├── page.tsx                   # Center login page
│   │   └── [id]/
│   │       ├── page.tsx               # Main center dashboard
│   │       ├── active/page.tsx        # Live active memorials
│   │       ├── closed/page.tsx        # Closed memorials
│   │       ├── close-reports/page.tsx # Ready-to-close report
│   │       ├── transfers/page.tsx     # Fund transfer queue
│   │       ├── operations/page.tsx
│   │       ├── create/page.tsx        # CreateMemorialClient.tsx
│   │       └── memorial/[memId]/
│   │           ├── page.tsx           # Manage single memorial
│   │           ├── edit/page.tsx
│   │           └── CloseMemorialButton.tsx
│   └── host/
│       ├── page.tsx                   # Host login (host_code)
│       └── [id]/
│           ├── page.tsx               # HostDashboardClient (4 scroll sections)
│           ├── donors/page.tsx
│           ├── summary/page.tsx
│           └── edit/page.tsx
```

---

## 3. Database Schema

### Core tables

#### `centers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | ชื่อเต็มศูนย์ |
| center_code | text? | รหัสศูนย์ เช่น CTR-KPP-001 |
| province / amphoe / tambon | text? | ที่ตั้ง |
| municipality | text? | เทศบาล/อบต. |
| manager_name | text? | |
| phone | text? | ใช้เป็น PromptPay QR ทุกงานในศูนย์นั้น |
| status | "active"\|"inactive" | |

#### `memorials`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | URL path เช่น `evt-2026-xxxx` |
| center_id | uuid FK→centers | |
| name | text | ชื่อผู้วายชนม์ |
| funeral_status | "draft"\|"active"\|"closed" | |
| ceremony_date/time/location | text | วันฌาปนกิจ |
| host_name / phone / code | text? | เจ้าภาพ |
| host_bank_* | text? | บัญชีรับโอนหลังปิดงาน |
| bank_name / account_number / account_name | text | บัญชีมูลนิธิรับเงิน |
| bank_account_image_url | text? | QR รูปภาพ (fallback) |
| death_certificate_url / host_id_card_url | text? | เอกสารยืนยัน |
| consent_confirmed | bool | |

#### `donations`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| memorial_id | uuid FK | |
| donor_name | text | สร้างครั้งเดียวพร้อมชื่อจริง |
| donor_title | text? | |
| amount | numeric | |
| slip_url | text? | path ใน Supabase Storage |
| slip_hash | text? | SHA-256 ของไฟล์สลิป |
| slip_duplicate_warning | bool | true = พบสลิปซ้ำ (warning ไม่บล็อก) |
| status | "pending"\|"confirmed"\|"rejected" | ระบบใหม่: insert = "confirmed" เสมอ |
| nameplate_status | "pending"\|"queued"\|"printed"\|"posted" | |
| confirmed_at / reviewed_at | timestamptz | |

### Slip fraud detection

#### `slip_submissions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| memorial_id | uuid FK→memorials | |
| slip_hash | text | SHA-256 |
| slip_url | text? | path หลัง upload สำเร็จ |
| duplicate_detected | bool | |
| duplicate_of | uuid? | FK→slip_submissions (first instance) |
| review_status | "none"\|"needs_review"\|"reviewed"\|"ignored" | |
| first_seen_at | timestamptz | |

### Outbox & idempotency

#### `outbox_jobs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_type | text | "print_nameplate" \| "dispatch_print" |
| payload | jsonb | |
| status | "pending"\|"processing"\|"completed"\|"failed" | |
| dedupe_key | text UNIQUE? | ป้องกัน enqueue ซ้ำ |
| attempts / max_attempts | int | retry logic |
| scheduled_at | timestamptz | |

#### `payments` (idempotency)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| donation_id | uuid FK | |
| provider / provider_ref | text | UNIQUE(provider, provider_ref) |
| amount | numeric | |

### Aggregate / reporting tables

| Table | Purpose |
|---|---|
| `ceremony_stats` | ยอด per-memorial (trigger-maintained) |
| `tenant_stats` | ยอด per-center (trigger-maintained) |
| `center_daily_stats` | รายวัน per-center (function: refresh_center_daily_stats) |
| `nameplates` | ป้ายชื่อ (legacy, parallel to donations.nameplate_status) |
| `print_jobs` | คิวปริ้น per-nameplate |
| `equipment` | board / printer / flower_box per-center |
| `reports` | สรุปปิดงาน per-memorial |
| `audit_logs` | action log ทั้งระบบ |

### IAM tables

| Table | Purpose |
|---|---|
| `app_users` | ผู้ใช้จริง (multi-provider: password/email/line/facebook/google) |
| `center_memberships` | role per-user per-center |
| `center_user_requests` | คำขอเข้าร่วมศูนย์ (pending approval) |
| `app_user_sessions` | token_hash session สำหรับ IAM users |

### Stored functions / triggers
- `fn_update_ceremony_stats` — trigger บน `donations` (INSERT/UPDATE/DELETE)
- `fn_update_tenant_memorial_counts` — trigger บน `memorials`
- `fn_update_tenant_donation_stats` — trigger บน `donations`
- `claim_outbox_jobs(batch_size)` — SELECT FOR UPDATE SKIP LOCKED
- `confirm_donation(...)` — atomic: insert payment + UPDATE donations + enqueue print job

---

## 4. Completed Features

### Donor flow (public)
- **Memorial overview page** — ข้อมูลผู้วายชนม์ + งาน
- **Payment page** — PromptPay QR (จากเบอร์ศูนย์), บัญชีสำรอง, upload สลิป
- **Slip upload with dedup** — SHA-256 hash, ตรวจซ้ำใน `slip_submissions`, คืน `duplicate` flag
- **Verifying page** — animated transition (3 steps) ส่ง hash ต่อไป
- **Print-name page** — กรอกชื่อ-ตำแหน่ง, POST `/api/donations` (auto-confirm), error handling
- **E-nameplate page** — render ป้ายชื่อ + POST `/api/print-nameplate`
- **E-card / Certificate** — แสดงใบอนุโมทนาบัตรดิจิทัล

### Donation pipeline
- **Auto-confirm** — ไม่มีขั้นตอน manual approve; donation insert พร้อม `status="confirmed"`
- **Print nameplate** — upload PNG → Supabase Storage → enqueue `dispatch_print` → quick-try printer (1.2s) → fall back ให้ worker retry
- **Outbox worker** (`GET /api/worker`) — claim jobs with SKIP LOCKED, handle `print_nameplate` + `dispatch_print`, retry up to max_attempts
- **Payment webhook** (`POST /api/webhooks/payment`) — HMAC-SHA256 verify, call `confirm_donation()` RPC, idempotent via payments table

### Center dashboard
- **Login** — center_code → `center_session` cookie
- **Memorial list** — active + closed, donation stats, slip warning count, nameplate queue count
- **Create memorial** — ฟอร์มครบ (ผู้วายชนม์, งาน, เจ้าภาพ, บัญชี)
- **Memorial detail** — overview / slip warnings / print queue / donor list / finance / close
- **Slip warnings section** — แสดง donations ที่ slip_duplicate_warning=true พร้อม context
- **Print queue management** — แสดง pending/queued/printed/posted, error cases
- **Close memorial** — 2-step confirm, block ถ้ายังมีป้ายค้าง
- **Close reports** — รายงาน ready-to-close vs needs-attention
- **Transfers page** — รายการงานที่พร้อมโอนเงินเจ้าภาพ
- **Active overview** — ภาพรวมงาน active ทั้งหมดของศูนย์

### Host dashboard
- **Login** — host_code → no cookie (URL-based)
- **Summary view** — 4 scroll sections: สรุปยอด / รายชื่อผู้ร่วมบุญ / HostBankForm / print errors
- **Slip duplicate banner** — แสดง warning รายการสลิปซ้ำสูงสุด 5 รายการ

### Admin dashboard
- **Login** — ADMIN_PASSWORD env → `admin_session` cookie
- **Centers CRUD** — list, create, view detail, delete
- **Memorials management** — list all, detail per memorial
- **Users / IAM** — app_users, center_memberships, center_user_requests
- **Audit log** — ตรวจสอบ action history
- **Report** — ยอดรวม per province/amphoe/center
- **Analytics** — กรอง region/province/period, breakdown table
- **ESG dashboard** — Zero-waste metrics (wreaths reduced, waste kg)
- **AI Prompts editor** — แก้ไข prompt template ต่อ template key
- **System health** — แสดง issues จาก `lib/system-health.ts`

### AI Photo (separate feature)
- **Generate** — GPT Image edit หรือ generate จาก template + donor photo
- **Job polling** — async job status via `ai_photo_requests` table
- **Save** — persist generated image URL
- **Credits** — ตรวจ credit ก่อน generate
- **Template management** — 4 templates (standing_with_label, mourning_wai, host_receiving, organization_board)

### Mock wreath
- **DALL-E 3 background generator** — สร้าง background + overlay ข้อมูลงาน + donor

---

## 5. Pending / WIP

### PRINT_SERVICE_URL not configured in production
`print-nameplate` และ `worker` ทั้งคู่ check `process.env.PRINT_SERVICE_URL` และ early-return ถ้าไม่มี
ยังไม่มี physical printer service deploy; nameplate ถูก set เป็น "queued" ไว้รอ

### `nameplates` / `print_jobs` tables — legacy, ไม่ได้ใช้งาน
Schema ยังคงอยู่ใน types.ts แต่ flow ปัจจุบันใช้ `donations.nameplate_status` + outbox โดยตรง
ไม่มี route ใดเขียน/อ่าน `nameplates` หรือ `print_jobs` อีกต่อไป

### `persons` per-memorial — ยังไม่มี UI
`/api/memorials/[id]/persons/route.ts` (GET/POST) และ `[personId]/route.ts` (DELETE) implement แล้ว
แต่ไม่มี page ใน center/host dashboard ที่ใช้งาน; `MemorialPersonManager` component มีอยู่แต่ไม่ถูก mount

### `center/register` route — stub
`app/api/center/register/route.ts` มีอยู่แต่ UI ลงทะเบียนศูนย์ยังไม่ implement (ใช้ admin สร้างให้)

### IAM login flow — schema ready, UI minimal
`app_users` + `center_memberships` + `app_user_sessions` มีครบ  
`/dashboard/admin/(protected)/users/page.tsx` สร้าง user ได้ แต่ center staff ยังไม่มี login page ของตัวเอง  
ปัจจุบัน center login ยังใช้ `center_code` เดิม (ไม่ผ่าน app_users)

### Standalone legacy routes (`/payment`, `/print-name`, `/printing`, `/verifying`)
Exist เป็น fallback แต่ `verifying/page.tsx` (root) redirect ไป `/print-name` แบบไม่มี `memorial_id` — ใช้ไม่ได้ถ้าไม่มี slug

### `eslint-disable` / `as any` casts ใน production code
ประมาณ 15+ จุดใน api routes ที่ใช้ `(supabase.from("slip_submissions") as any)` เพราะ `slip_submissions` ยังไม่อยู่ใน `lib/supabase/types.ts`  
ต้องเพิ่ม type definition หลัง migration run บน production

### `PAYMENT_WEBHOOK_SECRET` — optional แต่ไม่มีค่า default
ถ้าไม่ set env, webhook จะ reject ทุก request (`verifySignature` return false)  
ยังไม่มี payment provider จริงที่เชื่อมต่อ

### `center_daily_stats` — ต้อง call `refresh_center_daily_stats()` แยก
Function มีอยู่ใน schema แต่ไม่มี scheduled job หรือ trigger call อัตโนมัติ  
Analytics dashboard อ่านจาก `center_daily_stats` ซึ่งอาจ stale

### AI photo — `ai_photo_templates` / `ai_photo_requests` tables
ใช้ใน code แต่ไม่ปรากฏใน `lib/supabase/types.ts` (ใช้ `as any` cast)  
Migration สำหรับ 2 ตารางนี้ไม่มีในโฟลเดอร์ `supabase/migrations/`

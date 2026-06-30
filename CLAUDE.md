# CLAUDE.md — หรีดร่วมบุญ

## กฎเหล็ก

- **ทุกครั้งที่แก้ไขเสร็จ → commit + push GitHub ทันที** ไม่ต้องถาม
- **ทุกครั้งที่แก้เสร็จ → เพิ่มบันทึกต่อท้ายใน `CHANGELOG.md`** (ประวัติสะสม ไม่ลบของเก่า · แก้จุดเดิมซ้ำก็จดเพิ่มเรื่อยๆ พร้อมวันที่)
- **ทุกครั้งที่แก้โครงสร้าง/flow/หน้า/บทบาทผู้ใช้ → อัปเดต `CLAUDE.md` (และ memory ถ้าเป็นการตัดสินใจถาวร) ให้ตรงกับโค้ดก่อน commit** — ห้ามปล่อยให้เอกสารเก่ากว่าโค้ด (`CLAUDE.md` = สถานะปัจจุบัน, `CHANGELOG.md` = ประวัติ)
- ไม่ commit ไฟล์ `.env.local` หรือ secret ใดๆ
- TypeScript strict — ต้อง `npx tsc --noEmit` ผ่านก่อน push เสมอ

> **สมองกลาง (Knowledge Base):** ความรู้ฝั่งธุรกิจ/การสื่อสาร/แบรนด์ อยู่ที่ `docs/brain/` — ใช้เป็นแหล่งอ้างอิงกลางของ AI agent ทุกตัวและทีม (`CLAUDE.md` = เทคนิคโค้ด, `docs/brain` = ธุรกิจ/แบรนด์)

---

## Tech Stack

| รายการ | เวอร์ชัน / รายละเอียด |
|---|---|
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript strict |
| Styling | Tailwind v4 |
| Database | Supabase PostgreSQL |
| Auth | Cookie-based (admin: `admin_session`, center: `center_session`) |
| Storage | Supabase Storage (buckets: `memorials`, `donations`) |
| AI Image | OpenAI DALL-E 3 (`OPENAI_API_KEY`) |
| QR Code | `promptpay-qr` + `qrcode.react` |
| Deploy | Vercel (auto-deploy จาก GitHub `main`) |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=          # default: ESG2025
OPENAI_API_KEY=          # สำหรับ generate-wreath DALL-E 3
NEXT_PUBLIC_SITE_URL=https://ruamboon.online   # โดเมนหลัก (rrb.center ยังใช้งานได้คู่กัน — ลิงก์เก่าเปิดได้)
```

---

## Database Tables

### `centers`
ศูนย์บริหารหรีดร่วมบุญ (สร้างโดย Super Admin เท่านั้น)

| column | type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | text | ชื่อเต็มศูนย์ |
| center_code | text? | เช่น CTR-KPP-001 |
| province / amphoe / tambon | text? | ที่ตั้ง |
| municipality | text? | เทศบาล/อบต. |
| manager_name | text? | ผู้จัดการศูนย์ |
| phone | text? | **PromptPay QR ใช้เบอร์นี้** auto-generate ในหน้าชำระเงิน |
| status | "active"\|"inactive" | |

### `memorials`
งานศพแต่ละงาน

| column | type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| slug | text unique | URL งาน เช่น `evt-2026-xxxx` |
| center_id | uuid FK→centers | ผูกกับศูนย์ |
| name | text | ชื่อผู้วายชนม์ |
| funeral_status | "draft"\|"active"\|"closed" | |
| bank_name/account_number/account_name | text | บัญชีมูลนิธิรับเงิน |
| bank_account_image_url | text? | QR รูปภาพ (fallback ถ้าไม่มีเบอร์ PromptPay) |
| host_name/phone/code | text? | เจ้าภาพ (phone = normalize เหลือเลขล้วน) |
| host_bank_name/account_number/account_name | text? | **บัญชีเจ้าภาพ — เงินผู้ร่วมบุญเข้าตรงนี้โดยตรง** กรอกตอนเปิดงาน |
| host_phone_verified | bool | ยืนยันเบอร์เจ้าภาพด้วย OTP แล้ว (ตั้งตอนเปิดงาน) |
| host_otp_code / host_otp_expires_at | text?/ts? | OTP สำหรับยืนยันซ้ำบนหน้าจัดการงาน |
| host_relationship | text? | ความสัมพันธ์กับผู้วายชนม์ |
| death_certificate_url / host_id_card_url | text? | เอกสารยืนยัน |
| is_active | bool | legacy field |

### `donations`
การร่วมบุญแต่ละรายการ

| column | type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| memorial_id | uuid FK | |
| donor_name | text | สร้างครั้งเดียวตอน print-name step |
| donor_title | text? | ตำแหน่ง/คำนำหน้า |
| amount | numeric | ยอดเงิน |
| slip_url | text? | URL สลิป (upload แยกก่อน) |
| status | "pending"\|"confirmed"\|"rejected" | ศูนย์ตรวจสลิป |
| nameplate_status | "pending"\|"queued"\|"printed"\|"posted" | |

### ตารางอื่นๆ
`nameplates`, `print_jobs`, `equipment`, `reports`, `audit_logs`, `slip_submissions`
`host_otp_requests` — OTP ยืนยันเบอร์เจ้าภาพ **ก่อนเปิดงาน** (ผูก center_id + phone, ยังไม่มี memorial) · cols: code, expires_at, verified_at
`center_report_submissions` — ศูนย์ทำเครื่องหมาย "ส่งรายงานงวดนี้ให้ อปท. แล้ว" (compliance tracker) · UNIQUE(center_id, period_type, period_key)

---

## Route Map

### Public (ผู้ร่วมบุญ / Donor flow)

**Donor flow = 4 หน้า** (มี `ForceExternalBrowser` ใน `[slug]/layout` คอยเด้งออกจาก in-app browser ของ LINE/FB ไปเบราว์เซอร์จริง)
```
/                          → Landing page (อธิบายโครงการ + ลิสต์งานที่เปิดอยู่) — ไม่ใช่ redirect
/{slug}                    → [1] หน้างาน: ข้อมูลผู้วายชนม์ + กำหนดพิธี
/{slug}/payment            → [2] ชำระเงิน: QR + เลขบัญชี + อัปโหลดสลิป + ปุ่มแอปธนาคาร
/{slug}/print-name         → [3] ป้ายชื่อ: กรอกชื่อ/ข้อความ → POST /api/donations (สร้าง donation)
/{slug}/success            → [4] ขอบคุณ: e-card + AI จำลองมอบหรีด (AiPhotoSectionV2) + ดาวน์โหลดภาพ
/{slug}/donate             → redirect → /{slug}/payment
/{slug}/overview           → สรุปภาพรวมงาน
/{slug}/ecard              → E-Card อวยพร (standalone)
/mock-wreath               → จำลองภาพมอบหรีด (AI + รูปหน้า) standalone
/print-done                → หน้าสำเร็จ
```
**หมายเหตุ:** หน้า `verifying`/`printing` เดิม **ลบทิ้งแล้ว** (เปลี่ยนเป็น auto-confirm + auto-print)

### Host Dashboard (เจ้าภาพ)

```
/dashboard/host            → login ด้วย host_code
/dashboard/host/[id]       → แดชบอร์ด 5 แท็บ: สรุปยอด/รายชื่อ/รายงาน/บัญชีรับเงิน/ภาพจำลอง(AI)
/dashboard/host/[id]/edit     → แก้ไขข้อมูลงาน
/dashboard/host/[id]/donors   → รายชื่อ (newest first, print)
/dashboard/host/[id]/summary  → รายงาน (oldest first, print)
```
มีระบบวันหมดอายุสิทธิ์ host (`hostExpiresInDays`)

### Center Dashboard (ศูนย์)

```
/dashboard/center          → login ศูนย์ (มี /register, /change-password)
/dashboard/center/[id]     → รายการงานศพ + ปุ่มเปิดงานใหม่
/dashboard/center/[id]/create → ฟอร์มเปิดงานศพ (กรอกบัญชีรับเงินเจ้าภาพ + ยืนยันเบอร์เจ้าภาพด้วย OTP ก่อนเปิดงาน)
/dashboard/center/[id]/memorial/[memId] → จัดการงาน (+ /edit) + ปิดงาน
/dashboard/center/[id]/operations → งานวันนี้: KPI + คิวป้ายรอพิมพ์/ติดบอร์ด + แจ้งเตือนสลิปซ้ำย้อนหลัง
/dashboard/center/[id]/active|closed|close-reports → รายการงานตามสถานะ
/dashboard/center/[id]/transfers → โอนเงินเจ้าภาพ (+ confirm-transfer)
/dashboard/center/[id]/report → รายงานสรุปศูนย์ รายเดือน/รายปี ส่ง อปท. (พิมพ์ PDF + CSV) — อิงวันฌาปนกิจ
/dashboard/center/[id]/oversight → **บ้านของ อปท. (lgo_observer)** — read-only ภาพรวม KPI/การเงินโปร่งใส/สิ่งแวดล้อม/สวัสดิการ + ลิงก์ไป report/compliance/รายการงาน (ไม่มี PII) · role อื่นเข้าดู preview ได้
/dashboard/center/[id]/compliance → ติดตามสถานะการส่งรายงานศูนย์ → อปท. (12 เดือน + รายปี: ส่งแล้ว/ยังไม่ส่ง/ไม่มีงาน) · ศูนย์กดทำเครื่องหมายส่งบนหน้า report
```
**ศูนย์ไม่ตรวจ/อนุมัติสลิปแล้ว** — donation auto-confirm; operations เห็นแค่ "สลิปซ้ำย้อนหลัง" เป็นหลักฐาน ไม่ใช่คิวอนุมัติ

### Admin Dashboard (Super Admin)

หน้า admin ทั้งหมดอยู่ใต้ `(protected)` (guard ด้วย `admin_session` cookie)
```
/dashboard/admin           → login (ADMIN_PASSWORD)
/dashboard/admin/overview  → ภาพรวมเชิงวิเคราะห์แอดมินกลาง
/dashboard/admin/analytics → วิเคราะห์พื้นที่/เวลา
/dashboard/admin/esg       → รายงาน ESG
/dashboard/admin/report    → รายงานภูมิศาสตร์ (ภาค/จังหวัด/อำเภอ/ศูนย์)
/dashboard/admin/system    → รายงานระบบ / system health
/dashboard/admin/audit     → ตรวจสอบความผิดปกติ (สลิป/บัญชี/งาน)
/dashboard/admin/centers   → รายการศูนย์ (+ /new, /[id])
/dashboard/admin/hosts     → เจ้าภาพทั้งระบบ
/dashboard/admin/memorials → งานศพทั้งระบบ (+ /[id])
/dashboard/admin/users     → ผู้ใช้และสิทธิ์
/dashboard/admin/banner    → จัดการบอร์ดหน้างาน
/dashboard/admin/ai-prompts → จัดการ prompt ภาพ AI
```

---

## API Routes

> ตารางนี้เป็น route หลักที่ใช้บ่อย (ทั้งหมดมี ~44 routes ใน `app/api/` เช่น ai-photo/*, transfers, persons, worker, webhooks/payment, cron/*)

| Method | Path | หน้าที่ |
|---|---|---|
| POST | `/api/admin/login` | Admin login → set `admin_session` cookie |
| POST | `/api/admin/logout` | Clear admin cookie |
| POST | `/api/center/login` | Center login ด้วย center_code |
| POST | `/api/centers` | สร้างศูนย์ใหม่ (ต้อง admin_session) |
| POST | `/api/donations` | สร้าง donation (JSON หรือ FormData) |
| PATCH | `/api/donations/[id]` | เปลี่ยน status (confirmed/rejected) |
| POST | `/api/memorial` | สร้าง memorial ใหม่ |
| GET | `/api/memorial/host` | Host login ด้วย host_code |
| POST | `/api/memorials/create` | สร้าง memorial (center dashboard) — เช็ก OTP เบอร์เจ้าภาพ → ตั้ง host_phone_verified |
| PATCH | `/api/memorials/[id]` | อัปเดต host bank info + เอกสาร |
| POST | `/api/memorials/[id]/close` | ปิดงาน → funeral_status = "closed" |
| POST | `/api/host-otp/send` | **ก่อนเปิดงาน:** ส่ง OTP ไปเบอร์เจ้าภาพ (center auth, ผูก center_id+phone) |
| POST | `/api/host-otp/verify` | **ก่อนเปิดงาน:** ยืนยัน OTP → mark verified_at |
| POST | `/api/centers/[id]/report-submissions` | ศูนย์ทำเครื่องหมาย/ยกเลิก "ส่งรายงานงวดนี้ให้ อปท." (canEditCenterWork) |
| POST | `/api/memorials/[id]/otp/send`\|`verify` | ยืนยันเบอร์เจ้าภาพซ้ำ **+ แก้บัญชีรับเงินเจ้าภาพ (commit ค่าใหม่พร้อม OTP)** บนหน้าจัดการงาน (post-create) — แก้บัญชี/เบอร์ต้องผ่าน OTP ทุกครั้ง |
| POST | `/api/upload-slip` | Upload สลิป (รับเฉพาะ JPG/PNG) ก่อนสร้าง donation |
| POST | `/api/generate-wreath` | DALL-E 3 generate background (ต้อง OPENAI_API_KEY) |

---

## Donation Flow (สำคัญมาก)

```
[2] /{slug}/payment
  → อัปโหลดสลิป → POST /api/upload-slip → ได้ slip_url
  → navigate: /{slug}/print-name?memorial_id=&amount=&slip_url=

[3] /{slug}/print-name
  → กรอกชื่อจริง + ข้อความ
  → POST /api/donations (JSON) { memorial_id, donor_name, donor_title, amount, slip_url }
  → donation สร้าง status="confirmed" ทันที (auto-confirm) + ยิงพิมพ์ป้ายอัตโนมัติถ้ามี printer_id
  → navigate: /{slug}/success?name=&title=&amount=&donation_id=

[4] /{slug}/success  →  e-card + AI จำลองมอบหรีด
```

**กฎสำคัญ:**
- **auto-confirm + auto-print** — ไม่มีขั้นตอน "ตรวจสลิป/อนุมัติ" ของศูนย์อีกแล้ว (ตาม business model)
- **สร้าง donation ครั้งเดียวตอนมีชื่อจริง — ห้าม PATCH ชื่อทีหลัง** (เคยมีบัค donor_name ไม่อัปเดต)
- สลิปซ้ำ = เก็บเป็น `slip_duplicate_warning` (เตือนย้อนหลัง ไม่บล็อก)
- **ป้ายชื่อ:** auto-print → `queued` = "ส่งพิมพ์แล้ว" (ถือว่าจบ) · `error` = พิมพ์ไม่สำเร็จ → ปุ่ม "พิมพ์ซ้ำ" (`POST /api/donations/[id]/nameplate`). **ไม่ใช้สถานะ `posted`/ติดบอร์ด เป็นเงื่อนไขปิดงาน/โอนเงิน** (พิมพ์แล้วถือว่าจบ)
- **เครื่องพิมพ์ออฟไลน์:** PrintNode ค้างคิวแล้วพิมพ์ต่อเองเมื่อเครื่องกลับมา · `GET /api/printer-status?memorialId=` + `PrinterStatusAlert` เตือน "ตรวจสอบเครื่องพิมพ์" บนแดชบอร์ด**ศูนย์+เจ้าภาพ** (ต้องตั้ง `PRINTNODE_API_KEY` ถึงจะรู้สถานะ online/offline)

**กฎเงิน + ค่าดำเนินการ (สำคัญมาก — เรื่องเงิน):**
- **เงินผู้ร่วมบุญเข้าบัญชีเจ้าภาพโดยตรง** (ไม่ผ่านศูนย์) — QR พร้อมเพย์หน้าโอนสร้างจาก **เบอร์เจ้าภาพที่ยืนยัน OTP แล้ว** (`memorial.host_phone` เมื่อ `host_phone_verified`); ถ้ายังไม่ยืนยัน → ไม่โชว์ QR พร้อมเพย์
- **ค่าดำเนินการ = 10% ของยอดร่วมบุญรวม → เก็บคืนจากเจ้าภาพวัน "คืนบอร์ด"** (เจ้าภาพได้เงินเต็มเข้าบัญชีก่อน แล้วจ่าย 10% คืนศูนย์ตอนคืนอุปกรณ์/บอร์ด · เทศบาลไม่รับเงิน)
- หน้า `transfers` = **"เก็บค่าดำเนินการ / คืนบอร์ด"** (ไม่ใช่ "โอนเงินเจ้าภาพ" แล้ว) · `transfer_confirmed_at` = ยืนยัน "เก็บค่าดำเนินการคืน + รับคืนบอร์ด" แล้ว
- สูตรกลางอยู่ที่ `lib/fee.ts` — `systemFee(total)` = `Math.round(total * 0.1)`, `netToHost(total)` = `total − systemFee(total)` (รับประกัน fee + net = total)
- **ทุกที่ต้อง import จาก `@/lib/fee` เท่านั้น — ห้าม hardcode %** ใช้อยู่ทั้งฝั่งเจ้าภาพ (HostDashboardClient, host summary) และฝั่งศูนย์/แอดมิน (memorial page → CloseMemorialButton, transfers, report, admin/hosts)
- **OTP เปิดงาน:** ศูนย์กรอกบัญชีเจ้าภาพ + ยืนยันเบอร์ด้วย OTP ตอนเปิดงาน (`/api/host-otp/*` → `host_otp_requests`) ⚠️ ยัง **MOCK** ส่งรหัสกลับมาโชว์ ยังไม่ส่ง SMS จริง — เมื่อมี SMS provider ให้เพิ่ม `sendSms()` แล้วลบ `devCode` ออกจาก response

---

## Design System

### Color Tokens (Tailwind custom)

```
gold-50 … gold-900    → โทนทอง (primary brand)
cream-50 … cream-200  → พื้นหลัง/card (cream/เนย)
```

### CSS Classes ที่ใช้บ่อย

```css
.gold-gradient       /* background: linear-gradient(135deg, #c9973a, #e8c05a) */
.gold-gradient-text  /* gradient text สีทอง */
.gold-border         /* border: 1px solid #c9a84c */
.card-shadow         /* box-shadow มาตรฐาน */
```

### Typography

- Font หลัก: **Sarabun** (ภาษาไทยทุกส่วน รวม e-card inline styles)
- ขนาด heading: `text-lg font-bold` ใน header
- ขนาด body: `text-sm` / `text-xs` / `text-[11px]` / `text-[10px]`

### Components หลัก

```
LotusIcon            — โลโก้ดอกบัว (SVG)
PromptPayQR          — QR จากเบอร์โทร (promptpay-qr + qrcode.react)
AdminNav             — nav แดชบอร์ด admin (5 เมนู)
HostDashboardClient  — host dashboard scroll 4 tabs
HostBankForm         — ฟอร์มบัญชีเจ้าภาพ
CloseMemorialButton  — ปุ่มโอนเงิน/ปิดงาน (2-step confirm)
VerifyDonationButton — ปุ่มยืนยัน/ปฏิเสธสลิป
```

---

## Auth Pattern

### Admin
- Login: POST `/api/admin/login` → เทียบ `ADMIN_PASSWORD` env
- Session: cookie `admin_session=ok` (httpOnly, 8 ชั่วโมง)
- Guard: `app/dashboard/admin/(protected)/layout.tsx` ตรวจ cookie server-side

### Center
- Login: POST `/api/center/login` ด้วย `center_code`
- Session: cookie `center_session={centerId}` (httpOnly)

### Host
- Login: GET `/api/memorial/host?code={host_code}`
- ไม่มี cookie — ใช้ URL param `id` ต่อ

---

## Supabase Pattern

```typescript
// เสมอใช้ createAdminClient() (service role, bypass RLS)
import { createAdminClient } from "@/lib/supabase/admin";

// Type-safe insert
import type { Database } from "@/lib/supabase/types";
type MemorialUpdate = Database["public"]["Tables"]["memorials"]["Update"];

// Enum literal ต้องใช้ as const
status: "confirmed" as const
funeral_status: "active" as const
```

---

## PromptPay QR Logic

```
memorial.host_phone (เฉพาะเมื่อ host_phone_verified) → generatePayload(phone) → QRCodeSVG
  ↓ fallback
memorial.bank_account_image_url → <Image>
  ↓ fallback
<QRPlaceholder> (SVG)
```

**เงินเข้าบัญชีเจ้าภาพโดยตรง** → QR สร้างจาก `memorial.host_phone` ที่ **ยืนยัน OTP แล้ว** (`host_phone_verified`) เท่านั้น
(เดิมใช้ `centers.phone` — เลิกแล้ว เพราะเงินไม่ผ่านศูนย์)

---

## ระดับสิทธิ์ (MVP ปัจจุบัน)

**แอดมินกลางเป็นผู้ออกรหัสเข้าศูนย์เท่านั้น** (`/dashboard/admin/users` = เมนู "สร้างรหัสเข้าศูนย์") · ออกได้ **2 สิทธิ์**:
```
Super Admin       → เปิดศูนย์ / ดูทั้งหมด / ตรวจสอบระบบ / ออกรหัสเข้าศูนย์
─ รหัสเข้าศูนย์ (แอดมินกลางออกให้ ผูกรายศูนย์) ─
  สิทธิ์แก้ไข = center_manager ("แอดมินศูนย์") → ผู้ปฏิบัติงานศูนย์: เปิด-ปิด-แก้ไขงาน/พิมพ์/ตั้งค่า
  สิทธิ์ดู    = lgo_observer ("ตัวแทน อปท. ประจำศูนย์") → read-only กำกับดูแล: บ้าน /oversight + report/compliance **ไม่เห็น PII** (โดน redirect ออกจาก home/operations/transfers/memorial detail)
Host              → ดูงานของตัวเอง / บัญชีรับเงิน
Donor             → ทำรายการชำระเงิน / ดู e-card / mock-wreath
```
- **center_staff / center_viewer = ยกเลิกการออกใหม่แล้ว** (ยังคงไว้ใน enum เพื่อ backward-compat) · `canEditCenterWork` = `super_admin | center_manager` เท่านั้น
- ล็อกอินศูนย์: **เบอร์มือถือ + รหัสผ่าน** (`/api/center/user-login`) — รหัสผ่านออกโดยแอดมินกลางพร้อมบัญชี
- IAM อยู่ที่ `lib/iam-utils.ts` · helpers: `canEditCenterWork` / `canManageCenterUsers` / `canManageCenterSettings` / `isLgoObserver` / `canExportReports` · เข้าระบบผ่าน `app_users` + `center_memberships`
- ✅ `/oversight` + `/compliance` เสร็จแล้ว · ⏳ **เหลือ:** เทมเพลต export เฉพาะหน่วยประเมิน (LPA/ITA/จังหวัดสะอาด) + มุมรวมหลายศูนย์
- ระบบ login แบบ proper (JWT) ยังไม่ implement — ใช้ cookie + password/OTP แบบง่ายก่อน

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # start dev server (port 3000)
npx tsc --noEmit     # check TypeScript
git add ... && git commit -m "..." && git push origin main
```

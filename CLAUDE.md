# CLAUDE.md — หรีดร่วมบุญ

## กฎเหล็ก

- **ทุกครั้งที่แก้ไขเสร็จ → commit + push GitHub ทันที** ไม่ต้องถาม
- **ทุกครั้งที่แก้เสร็จ → เพิ่มบันทึกต่อท้ายใน `CHANGELOG.md`** (ประวัติสะสม ไม่ลบของเก่า · แก้จุดเดิมซ้ำก็จดเพิ่มเรื่อยๆ พร้อมวันที่)
- **ทุกครั้งที่แก้โครงสร้าง/flow/หน้า/บทบาทผู้ใช้ → อัปเดต `CLAUDE.md` (และ memory ถ้าเป็นการตัดสินใจถาวร) ให้ตรงกับโค้ดก่อน commit** — ห้ามปล่อยให้เอกสารเก่ากว่าโค้ด (`CLAUDE.md` = สถานะปัจจุบัน, `CHANGELOG.md` = ประวัติ)
- ไม่ commit ไฟล์ `.env.local` หรือ secret ใดๆ
- TypeScript strict — ต้อง `npx tsc --noEmit` ผ่านก่อน push เสมอ

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
NEXT_PUBLIC_SITE_URL=https://rrb.center
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
| host_name/phone/code | text? | เจ้าภาพ |
| host_bank_name/account_number/account_name | text? | บัญชีเจ้าภาพ (รับโอนหลังปิดงาน) |
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
`nameplates`, `print_jobs`, `equipment`, `reports`, `audit_logs`

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
/dashboard/center/[id]/create → ฟอร์มเปิดงานศพ
/dashboard/center/[id]/memorial/[memId] → จัดการงาน (+ /edit) + ปิดงาน
/dashboard/center/[id]/operations → งานวันนี้: KPI + คิวป้ายรอพิมพ์/ติดบอร์ด + แจ้งเตือนสลิปซ้ำย้อนหลัง
/dashboard/center/[id]/active|closed|close-reports → รายการงานตามสถานะ
/dashboard/center/[id]/transfers → โอนเงินเจ้าภาพ (+ confirm-transfer)
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
| POST | `/api/memorials/create` | สร้าง memorial (center dashboard) |
| PATCH | `/api/memorials/[id]` | อัปเดต host bank info + เอกสาร |
| POST | `/api/memorials/[id]/close` | ปิดงาน → funeral_status = "closed" |
| POST | `/api/upload-slip` | Upload สลิปก่อนสร้าง donation |
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
center.phone → generatePayload(phone) → QRCodeSVG
  ↓ fallback
memorial.bank_account_image_url → <Image>
  ↓ fallback
<QRPlaceholder> (SVG)
```

เบอร์เก็บที่ `centers.phone` — ใช้ร่วมกันทุกงานในศูนย์นั้น

---

## ระดับสิทธิ์ (MVP ปัจจุบัน)

```
Super Admin   → เปิดศูนย์ / ดูทั้งหมด / ตรวจสอบระบบ
Center Manager → คุมศูนย์ตัวเอง / เปิด-ปิดงาน / ตรวจสลิป
Host          → ดูงานของตัวเอง / บัญชีรับเงิน
Donor         → ทำรายการชำระเงิน / ดู e-card / mock-wreath
```

ระบบ login แบบ proper (JWT / OTP) ยังไม่ได้ implement — ใช้ cookie + password แบบง่ายก่อน

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # start dev server (port 3000)
npx tsc --noEmit     # check TypeScript
git add ... && git commit -m "..." && git push origin main
```

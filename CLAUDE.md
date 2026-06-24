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

```
/                          → redirect ไป /{slug} ของงานที่ active ล่าสุด
/{slug}                    → หน้าหลักงาน (ข้อมูลผู้วายชนม์)
/{slug}/payment            → ชำระเงิน (QR + เลขบัญชี + อัปโหลดสลิป)
/{slug}/verifying          → กำลังตรวจสลิป (placeholder)
/{slug}/print-name         → กรอกชื่อ → POST /api/donations (สร้าง donation)
/{slug}/printing           → ป้ายชื่อ (e-nameplate)
/{slug}/ecard              → E-Card อวยพร
/mock-wreath               → จำลองภาพมอบหรีด (AI + รูปหน้า)
/print-done                → หน้าสำเร็จ
```

### Host Dashboard (เจ้าภาพ)

```
/dashboard/host            → login ด้วย host_code
/dashboard/host/[id]       → แดชบอร์ด scroll 4 sections (สรุป/รายชื่อ/รายงาน/บัญชี)
/dashboard/host/[id]/donors   → รายชื่อ (newest first)
/dashboard/host/[id]/summary  → รายงาน (oldest first, print)
```

### Center Dashboard (ศูนย์)

```
/dashboard/center          → login ศูนย์
/dashboard/center/[id]     → รายการงานศพ + ปุ่มเปิดงานใหม่
/dashboard/center/[id]/create → ฟอร์มเปิดงานศพ
/dashboard/center/[id]/memorial/[memId] → จัดการงาน (ตรวจสลิป + ปิดงาน)
```

### Admin Dashboard (Super Admin)

```
/dashboard/admin           → login (ADMIN_PASSWORD)
/dashboard/admin/overview  → ภาพรวมทั้งระบบ
/dashboard/admin/centers   → รายการศูนย์ + เปิดศูนย์ใหม่
/dashboard/admin/centers/new      → ฟอร์มสร้างศูนย์
/dashboard/admin/centers/[id]     → รายละเอียดศูนย์
/dashboard/admin/users     → ผู้จัดการศูนย์ + สิทธิ์
/dashboard/admin/audit     → ตรวจสอบความผิดปกติ (สลิป/บัญชี/งาน)
/dashboard/admin/report    → รายงาน ภาค/จังหวัด/อำเภอ/ศูนย์
```

---

## API Routes

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
/{slug}/payment
  → อัปโหลดสลิป → POST /api/upload-slip → ได้ slip_url
  → navigate: /verifying?memorial_id=&amount=&slip_url=

/verifying  →  /print-name?amount=&memorial_id=&slip_url=

/print-name
  → กรอกชื่อจริง
  → POST /api/donations (JSON) { memorial_id, donor_name, donor_title, amount, slip_url }
  → สร้าง donation ครั้งเดียว — ไม่มี PATCH ชื่อทีหลัง
  → navigate: /printing?name=&title=&amount=&donation_id=
```

**ห้ามใช้ PATCH ชื่อทีหลัง** — เคยมีบัค donor_name ไม่อัปเดต แก้โดยสร้าง 1 ครั้งตอนมีชื่อจริงแล้ว

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

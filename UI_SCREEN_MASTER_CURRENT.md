# UI Screen Master — หรีดร่วมบุญ Zero Waste
**Version:** iOS 17 Style (current)  
**Last updated:** 2026-05-29  
**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase  
**Design system:** Dynamic Island dark pill header · iOS glass cards · gold/cream palette

---

## ชื่อเรียกเวลาสั่งแก้

ใช้ชื่อ 4 หน้านี้เป็นคำเรียกหลักเวลาสั่งแก้ UI/flow ฝั่งผู้ร่วมบุญ:

| ชื่อเรียก | Route หลัก | งานในหน้า |
|---|---|---|
| **หน้า 1 ข้อมูลงาน** | `/{slug}` | ดูข้อมูลผู้วายชนม์ + กำหนดการ + ตัวอย่างป้ายบนบอร์ด |
| **หน้า 2 การเงิน** | `/{slug}/payment` | โอนเงิน + แนบสลิป + Popup ตรวจสลิป |
| **หน้า 3 ป้ายหรีด** | `/{slug}/print-name` | กรอกชื่อป้าย + ดูตัวอย่าง + แก้ไขได้ + Popup ส่งพิมพ์ |
| **หน้า 4 ขอบคุณ** | `/{slug}/ecard` | E-card + AI Photo + หลักฐานการเงิน |

ลำดับ flow: หน้า 1 ข้อมูลงาน → หน้า 2 การเงิน → หน้า 3 ป้ายหรีด → หน้า 4 ขอบคุณ

---

## สารบัญ

1. [Donor Flow (ผู้ร่วมบุญ)](#1-donor-flow-ผูร่วมบุญ) — S01–S09
2. [Host Dashboard (เจ้าภาพ)](#2-host-dashboard-เจ้าภาพ) — S10–S14
3. [Center Dashboard (ศูนย์บริหาร)](#3-center-dashboard-ศูนย์บริหาร) — S15–S20
4. [ESG / Admin Dashboard (ส่วนกลาง)](#4-esg--admin-dashboard-ส่วนกลาง) — S21–S31
5. [Shared / Utility Pages](#5-shared--utility-pages) — S32–S33

---

## 1. Donor Flow (ผู้ร่วมบุญ)

---

### S01 · หน้าหลักงานศพ

| Field | Value |
|---|---|
| **Screen Number** | S01 |
| **Page Name (TH)** | หน้าหลักงานศพ |
| **Route** | `/{slug}` |
| **User Role** | Public — ผู้ร่วมบุญ / ทั่วไป |
| **Status** | ✅ Active |

**Purpose**  
หน้าแรกที่ผู้ร่วมบุญเข้ามา แสดงข้อมูลผู้วายชนม์ กำหนดการสวดพระอภิธรรมและฌาปนกิจ พร้อมปุ่มมอบหรีด

**Main Sections**
- **SiteHeader** — Dynamic Island dark pill "หรีดร่วมบุญ · Zero Waste" + ปุ่ม `+` (ไปหน้า dashboard selector)
- **MemorialProfile** — รูปผู้วายชนม์ (วงกลม + glow halo) · ชื่อ (large title) · pill tag วันชาตะ/มรณะ · อายุ
- **CeremonyInfo** — iOS grouped table: Row สวดพระอภิธรรม (icon + วันที่ + สถานที่) / Row ฌาปนกิจ (icon + วัน/เวลา + สถานที่)
- **WreathBoard** — รูปบอร์ดหรีดร่วมบุญ (PNG) + section label "หรีดร่วมบุญ"
- **PaymentSection** — CTA button pill "มอบหรีดร่วมบุญ"
- **SiteFooter** — "ร่วมอาลัย · ร่วมทำบุญ · ร่วมลดขยะ"

**Buttons / CTA**
- `มอบหรีดร่วมบุญ` → `/{slug}/payment` (pill gold-gradient button, full-width)
- `+` icon (header right) → `/dashboard`

**Data Displayed**
- `memorial.name`, `memorial.photo_url`
- `memorial.birth_date`, `memorial.death_date`, `memorial.age`
- `memorial.ceremony_date`, `memorial.ceremony_time`, `memorial.ceremony_location`, `memorial.ceremony_hall`
- `memorial.prayer_date` (กำหนดการสวด), `memorial.prayer_location` (สถานที่สวด)
- บอร์ดหรีดรูปภาพ static `/img/บอร์ด2.png`

**Design Notes**
- Background: clean warm gradient (ไม่ใช้ bg-heaven.png แล้ว)
- MemorialProfile: large bold title `clamp(1.25rem, 5.5vw, 1.55rem)`
- CeremonyInfo: iOS Settings grouped table, 0.5px separator, ios-icon-badge
- PaymentSection: `rounded-full` pill, `ios-cta` class
- WreathBoard: rounded-[16px] frame, 0.5px gold border

**Screenshot Requirement**  
แสดงรูปผู้วายชนม์จริง + กำหนดการครบ + ปุ่มมอบหรีด · ถ่ายบนมือถือ iPhone (375px width)

---

### S02 · ชำระเงิน / มอบหรีด

| Field | Value |
|---|---|
| **Screen Number** | S02 |
| **Page Name (TH)** | หน้าชำระเงิน |
| **Route** | `/{slug}/payment` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
แสดง QR PromptPay + เลขบัญชีมูลนิธิ ให้ผู้ร่วมบุญโอนเงิน แล้วแนบสลิปและกรอกยอด

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **กล่อง 1: ร่วมมอบหรีดร่วมบุญ** — QR PromptPay (จากเบอร์ศูนย์) | divider ❖ | เลขบัญชีมูลนิธิ + ปุ่มคัดลอก/บันทึก QR
- **กล่อง 2: โอนแล้วแนบสลิป** — upload สลิป (image preview) + กรอกยอดเงิน
- **ปุ่มยืนยัน** — ส่งต่อไป `/verifying`

**Buttons / CTA**
- `บันทึก QR โค้ด` — download QR image
- `คัดลอกเลขบัญชี` — clipboard copy
- `ยืนยันการโอน` → `/{slug}/verifying?memorial_id=&amount=&slip_url=`

**Data Displayed**
- QR จาก `center.phone` (PromptPay) หรือ `memorial.bank_account_image_url` (fallback)
- `memorial.bank_name`, `memorial.bank_account_number`, `memorial.bank_account_name`
- ค่าบริการ 100 บาท/ใบ (SYSTEM_FEE)

**Design Notes**
- Component: `PaymentPageClient.tsx`
- QR: `PromptPayQR` component (promptpay-qr + qrcode.react)
- Slip upload: drag-to-preview, max-height 58dvh
- ยอดเงิน input type=number, minimum 100

**Screenshot Requirement**  
แสดง QR code ชัด + เลขบัญชี + ช่อง upload สลิป

---

### S03 · กำลังตรวจสลิป

| Field | Value |
|---|---|
| **Screen Number** | S03 |
| **Page Name (TH)** | หน้ากำลังตรวจสลิป |
| **Route** | `/{slug}/verifying` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
Transition page แสดง loading animation 3 ขั้นตอน ก่อน navigate ไปกรอกชื่อ

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **Loading card** — spinning rings + LotusIcon + step list (3 steps animate)
- Auto-navigate → `/{slug}/print-name` หลัง ~4 วินาที

**Steps**
1. รับสลิปเรียบร้อย
2. กำลังตรวจสอบข้อมูล
3. กำลังยืนยันการโอน

**Data Displayed**
- URL params: `memorial_id`, `amount`, `slip_url`

**Design Notes**
- Gold spinning rings (double ring reverse)
- Step dots animate-pulse + animate-bounce dots
- ไม่มีปุ่ม user-action ทั้งสิ้น

**Screenshot Requirement**  
แสดงขณะ step 2 กำลังประมวลผล (ถ่าย mid-animation)

---

### S04 · กรอกชื่อผู้มอบ

| Field | Value |
|---|---|
| **Screen Number** | S04 |
| **Page Name (TH)** | หน้ากรอกชื่อผู้มอบ |
| **Route** | `/{slug}/print-name` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
กรอกชื่อ/องค์กร และตำแหน่ง เพื่อพิมพ์บนป้ายหรีด สร้าง donation record

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **SignPreview** — preview ป้ายชื่อ realtime (auto-scale font)
- **ฟอร์ม** — input ชื่อ/องค์กร + input ตำแหน่ง/ข้อความ
- **Modal confirm** — preview ป้าย + ปุ่มแก้ไข/ส่งพิมพ์

**Buttons / CTA**
- `แสดงก่อนส่งพิมพ์` — open modal (disabled ถ้าไม่มีชื่อ)
- `แก้ไขข้อความ` — close modal
- `ส่งพิมพ์` → POST `/api/donations` → `/{slug}/printing`
- `ย้อนกลับ` → `/{slug}/payment`

**Data Displayed**
- SignPreview: BASE_W=288, BASE_H=80, auto-scale font ตาม container width
- URL params: `amount`, `memorial_id`, `slip_url`

**Design Notes**
- SignPreview: `border: 1.5px solid #c9a84c`, warm gradient background
- Modal: `background: rgba(0,0,0,0.72)` backdrop
- สร้าง donation 1 ครั้งตอนมีชื่อจริง (ห้าม PATCH ทีหลัง)

**Screenshot Requirement**  
แสดง SignPreview พร้อมชื่อจริง + ฟอร์มกรอก

---

### S05 · กำลังส่งพิมพ์ป้าย

| Field | Value |
|---|---|
| **Screen Number** | S05 |
| **Page Name (TH)** | หน้ากำลังส่งพิมพ์ป้าย |
| **Route** | `/{slug}/printing` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
Transition page แสดง printing animation แล้ว navigate ไป E-card

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **Loading card** — spinner + PrinterIcon + 3 steps
- **Success overlay** — checkmark + ชื่อผู้มอบ + countdown → E-card

**Steps**
1. กำลังส่งข้อมูลป้าย
2. กำลังประมวลผล
3. ส่งพิมพ์สำเร็จ

**Design Notes**
- Success overlay: warm gradient, gold border, `background: rgba(0,0,0,0.55)`
- Auto-navigate → `/{slug}/ecard` หลัง 3 วินาที

**Screenshot Requirement**  
แสดง success overlay checkmark พร้อมชื่อผู้มอบ

---

### S06 · E-Card ขอบคุณ

| Field | Value |
|---|---|
| **Screen Number** | S06 |
| **Page Name (TH)** | หน้า E-Card ขอบคุณ |
| **Route** | `/{slug}/ecard` หรือ `/ecard` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
แสดง E-Card สวยงามที่ดาวน์โหลดได้ + ส่วน AI Photo Template ด้านล่าง

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **SECTION 1: E-card** — toggle แสดง/ซ่อนยอด · card 1080×1350px (ratio 4:5) · ปุ่มบันทึก
  - Header gold gradient + LotusIcon
  - ชื่อผู้มอบ + ตำแหน่ง + ยอด
  - รูปผู้วายชนม์ (วงรี) + ชื่อ + วันชาตะ/มรณะ
  - Footer gold
- **SECTION 2: AI Photo Template** (`AiPhotoSection`)
  - Upload รูปผู้มอบ
  - เลือก template (ยืนถือป้าย / ไหว้อาลัย / มอบให้เจ้าภาพ)
  - สร้างภาพ → แสดง 3 ภาพ → ดาวน์โหลด
- **ปุ่มย้อนกลับ** → `/{slug}/print-name`

**Buttons / CTA**
- `ไม่แสดงยอดเงิน` / `แสดงยอดเงิน` — toggle
- `บันทึก E-card` — html-to-image download PNG (1080×1350px)
- `แตะเพื่อแนบรูปผู้มอบ` — file input
- `สร้างภาพที่ระลึก` → POST `/api/generate-wreath` (FormData)
- `บันทึกภาพที่ระลึก` — download AI image
- `← ย้อนกลับ`

**Data Displayed**
- URL params: `name`, `title`, `amount`, `message`
- `memorial.name`, `memorial.photo_url`, `memorial.birth_date`, `memorial.death_date`, `memorial.age`
- `memorial.ceremony_date`, `memorial.ceremony_location`, `memorial.ceremony_hall`

**Design Notes**
- E-card ใช้ inline styles (pixel-perfect สำหรับ html-to-image)
- Font: Sarabun ทั้งหมดในการ์ด
- AiPhotoSection: calls `/api/generate-wreath` with `multipart/form-data`, count=3
- Component: `ECardClient.tsx` + `AiPhotoSection.tsx` + `AiPhotoTemplateSelector.tsx` + `AiPhotoResult.tsx`

**Screenshot Requirement**  
แสดง E-card สมบูรณ์ (มีรูปผู้วายชนม์ ชื่อผู้มอบ) + ส่วน AI Photo ด้านล่าง

---

### S07 · จำลองภาพมอบหรีดร่วมบุญ (AI Photo)

| Field | Value |
|---|---|
| **Screen Number** | S07 |
| **Page Name (TH)** | หน้าจำลองภาพมอบหรีด AI |
| **Route** | `/mock-wreath` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
หน้าเต็มสำหรับสร้าง AI Photo ที่ระลึกจากรูปจริง มี 5 ขั้นตอน ละเอียดกว่า S06

**Main Sections**
- **IosPageHeader** — "จำลองมอบหรีดร่วมบุญ · AI Photo" + back ← `/ecard`
- **Step 1** — แนบรูปผู้มอบ (file input + preview)
- **Step 2** — เลือกแบบภาพ (3 templates: ยืนถือป้าย / ไหว้อาลัย / เจ้าภาพรับมอบ)
- **Step 3** — ข้อมูลจากงานศพ (ชื่อผู้มอบ, ตำแหน่ง, ข้อความ, ชื่อผู้วายชนม์, สถานที่)
- **Step 4** — Prompt Template preview (read-only, locked)
- **Step 5** — สร้างภาพ 3 แบบ + เลือก + ดาวน์โหลด/แชร์

**Buttons / CTA**
- `สร้างภาพจำลอง 3 แบบ` → POST `/api/generate-wreath` (FormData, count=3)
- `สร้างใหม่อีกครั้ง` — regenerate
- `บันทึกภาพ` — download selected image
- `แชร์` — Web Share API / copy link fallback
- `← กลับไป E-card`

**Data Displayed**
- URL params: `name`, `title`, `message`, `deceased_name`, `funeral_place`
- Prompt preview (ล็อก ผู้ใช้แก้ไม่ได้)
- Wreath label text (auto-generated จากชื่อ+ตำแหน่ง+ข้อความ)

**Design Notes**
- StepCard component: `w-6 h-6 rounded-full gold-gradient` step number badge
- Templates จาก `AI_PHOTO_TEMPLATES` ใน `lib/ai-photo-templates.ts`
- Negative prompt ล็อกใน API route (ผู้ใช้ไม่เห็น)
- Support กลับมาจาก E-card พร้อม query string เดิม

**Screenshot Requirement**  
แสดง Step 5 พร้อม 3 ภาพ AI ที่ generate แล้ว

---

### S08 · หน้าส่งพิมพ์สำเร็จ

| Field | Value |
|---|---|
| **Screen Number** | S08 |
| **Page Name (TH)** | หน้าส่งพิมพ์สำเร็จ |
| **Route** | `/print-done` |
| **User Role** | Public — ผู้ร่วมบุญ |
| **Status** | ✅ Active |

**Purpose**  
Standalone success page (ไม่ผ่าน slug flow) แสดงผลสำเร็จและ shortcut ไปหน้าอื่น

**Main Sections**
- **IosPageHeader** — "หรีดร่วมบุญ · Zero Waste"
- **Success icon** — gold circle + checkmark
- **ชื่อผู้มอบ** + ข้อความขอบคุณ
- **Action buttons** (3 ปุ่ม)

**Buttons / CTA**
- `ดูอีการ์ด / หลักฐานการมอบ` → `/ecard?name=&title=&amount=`
- `จำลองภาพมอบหรีด` → `/mock-wreath?...`
- `กลับหน้าหลัก` → `/`

**Design Notes**
- URL params: `name`, `title`, `amount`
- ปุ่ม 3 อัน: gold-gradient / gold border / gray border

**Screenshot Requirement**  
แสดง success state พร้อมชื่อผู้มอบและ 3 action buttons

---

### S09 · หน้า redirect หลัก

| Field | Value |
|---|---|
| **Screen Number** | S09 |
| **Page Name (TH)** | หน้า redirect |
| **Route** | `/` |
| **User Role** | Public |
| **Status** | ✅ Active |

**Purpose**  
Redirect ไปยัง `/{slug}` ของงานศพที่ active ล่าสุด

**Design Notes**
- ไม่มี UI — pure redirect logic
- ถ้าไม่มีงาน active → แสดง error text เล็กน้อย

---

## 2. Host Dashboard (เจ้าภาพ)

---

### S10 · Login เจ้าภาพ

| Field | Value |
|---|---|
| **Screen Number** | S10 |
| **Page Name (TH)** | Login เจ้าภาพ |
| **Route** | `/dashboard/host` |
| **User Role** | Host — เจ้าภาพ |
| **Status** | ✅ Active |

**Purpose**  
Login ด้วย host_code เพื่อเข้าดู dashboard งานศพของตัวเอง

**Main Sections**
- **IosPageHeader** — "Dashboard เจ้าภาพ · Host Access" + ← กลับ `/`
- **Icon** — KeyRound circle gold
- **Heading** — เข้าสู่ระบบเจ้าภาพ + คำอธิบาย
- **Card ฟอร์ม** — input รหัสเจ้าภาพ (uppercase, tracking-widest) + ปุ่ม login

**Buttons / CTA**
- `เข้าสู่ระบบ` → GET `/api/memorial/host?code=` → redirect `/dashboard/host/{id}`

**Data Displayed**
- Input: รหัสเจ้าภาพ (เช่น H3K9AB, maxLength=10)

**Design Notes**
- ไม่มี cookie — ใช้ host_code URL param ต่อ
- Error: inline text สีแดง ใต้ input
- `toUpperCase()` auto

**Screenshot Requirement**  
แสดง input รหัสเจ้าภาพ พร้อม placeholder

---

### S11 · Host Dashboard หลัก

| Field | Value |
|---|---|
| **Screen Number** | S11 |
| **Page Name (TH)** | Dashboard เจ้าภาพ |
| **Route** | `/dashboard/host/[id]` |
| **User Role** | Host — เจ้าภาพ |
| **Status** | ✅ Active |

**Purpose**  
แดชบอร์ดหลักเจ้าภาพ 4 sections เลื่อนดูได้ พร้อม tab navigation

**Main Sections**
- **IosPageHeader** — `memorial.name` + "Host Dashboard" + ← `/dashboard/host` + ✏️ แก้ไข
- **Tab bar** — สรุปยอด / รายชื่อ / รายงาน / บัญชีรับเงิน (sticky ใต้ header)
- **Section 1 — สรุปยอด** — ยอดรวม / ค่าบริการ / สุทธิ / จำนวนใบ / รอยืนยัน
- **Section 2 — รายชื่อ** — donation list (newest first) + status badge
- **Section 3 — รายงาน** — link → `/dashboard/host/[id]/summary` (print-friendly)
- **Section 4 — บัญชีรับเงิน** — `HostBankForm` กรอกเลขบัญชีเจ้าภาพ

**Buttons / CTA**
- Tab scroll navigation (4 tabs)
- ✏️ icon → `/dashboard/host/[id]/edit?code={host_code}` (แก้ไขข้อมูลงาน)
- `ดูรายชื่อทั้งหมด` → `/dashboard/host/[id]/donors`
- `ดูรายงาน (พิมพ์ได้)` → `/dashboard/host/[id]/summary`
- `บันทึกบัญชี` — PATCH `/api/memorials/[id]`

**Data Displayed**
- `memorial.name`, `memorial.ceremony_date`
- donations: `donor_name`, `amount`, `status`, `created_at`
- ยอด confirmed / pending count
- Service fee: 100 บาท/ใบ

**Design Notes**
- Component: `HostDashboardClient.tsx`
- IntersectionObserver ตรวจ active section เพื่อ highlight tab
- HostBankForm: แยก component, PATCH `/api/memorials/[id]`
- Tab bar: `bg-gold-50 rounded-xl p-1` สไตล์ iOS segment control

**Screenshot Requirement**  
แสดง Section 1 สรุปยอด พร้อมตัวเลข + tab bar

---

### S12 · รายชื่อผู้ร่วมบุญ (Host)

| Field | Value |
|---|---|
| **Screen Number** | S12 |
| **Page Name (TH)** | รายชื่อผู้ร่วมบุญ (เจ้าภาพ) |
| **Route** | `/dashboard/host/[id]/donors` |
| **User Role** | Host — เจ้าภาพ |
| **Status** | ✅ Active |

**Purpose**  
รายชื่อผู้ร่วมบุญทั้งหมด เรียงใหม่ → เก่า พร้อมสรุปยอดด้านบน

**Main Sections**
- Header พร้อม ← + download icon
- สรุป confirmed amount
- รายการ donation (newest first): ชื่อ / ยอด / สถานะ / วันเวลา

**Buttons / CTA**
- `Download` — export (ถ้า implement)
- `← กลับ` → `/dashboard/host/[id]`

**Data Displayed**
- Donations: `donor_name`, `donor_title`, `amount`, `status`, `created_at`

**Screenshot Requirement**  
รายชื่อผู้ร่วมบุญพร้อม badge สถานะ

---

### S13 · รายงานสรุป (พิมพ์ได้)

| Field | Value |
|---|---|
| **Screen Number** | S13 |
| **Page Name (TH)** | รายงานสรุป (เจ้าภาพ) |
| **Route** | `/dashboard/host/[id]/summary` |
| **User Role** | Host — เจ้าภาพ |
| **Status** | ✅ Active |

**Purpose**  
รายงานสรุปรายชื่อผู้ร่วมบุญ เรียงเก่า → ใหม่ สำหรับพิมพ์

**Main Sections**
- Header + print button
- ตารางรายชื่อ (oldest first) พร้อม ลำดับ / ชื่อ / ยอด

**Buttons / CTA**
- `Download / พิมพ์` — `window.print()` หรือ html-to-image

**Design Notes**
- Client component (`"use client"`)
- Fetch donations ใน useEffect

**Screenshot Requirement**  
รายงาน print-friendly

---

### S14 · แก้ไขข้อมูลงานศพ (เจ้าภาพ)

| Field | Value |
|---|---|
| **Screen Number** | S14 |
| **Page Name (TH)** | แก้ไขข้อมูลงาน (เจ้าภาพ) |
| **Route** | `/dashboard/host/[id]/edit?code={host_code}` |
| **User Role** | Host — เจ้าภาพ |
| **Status** | ✅ Active |

**Purpose**  
เจ้าภาพแก้ไขข้อมูลงานที่กรอกผิด เช่น วันชาตะ/มรณะ กำหนดการ

**Main Sections**
- **IosPageHeader** — "แก้ไขข้อมูลงาน" + ← `backHref`
- **Actor badge** — "แก้ไขโดย: เจ้าภาพ · ระบบบันทึกทุกการแก้ไข"
- **Section ข้อมูลผู้วายชนม์** — ชื่อ, วันเกิด/เสียชีวิต (ThaiDateInput พ.ศ.), อายุ (auto-calc)
- **Section กำหนดการสวด** — text กำหนดการ + สถานที่สวด
- **Section กำหนดการฌาปนกิจ** — วันฌาปนกิจ + เวลา + อาคาร + สถานที่
- **Section เจ้าภาพ** — ชื่อ, โทรศัพท์, ความสัมพันธ์
- **ปุ่มบันทึก**

**Buttons / CTA**
- `บันทึกการแก้ไข` → PATCH `/api/memorials/[id]/info` → redirect back

**Data Displayed**
- ข้อมูลงานศพทั้งหมดจาก memorial
- ThaiDateInput: แสดง พ.ศ. ไทย (day/month/year selectors)

**Design Notes**
- Component: `EditMemorialInfoForm.tsx`
- Auth: ตรวจ `host_code` query param vs DB
- Audit log บันทึก `actor_type: "host"` ใน `audit_logs`
- Auto-calculate age จาก birth_date + death_date

**Screenshot Requirement**  
ฟอร์มแก้ไขพร้อม ThaiDateInput แสดง พ.ศ.

---

## 3. Center Dashboard (ศูนย์บริหาร)

---

### S15 · Login ศูนย์บริหาร

| Field | Value |
|---|---|
| **Screen Number** | S15 |
| **Page Name (TH)** | Login ศูนย์บริหาร |
| **Route** | `/dashboard/center` |
| **User Role** | Center Manager — ผู้จัดการศูนย์ |
| **Status** | ✅ Active |

**Purpose**  
Login ด้วย center_code (UPPERCASE) รับ cookie `center_session`

**Main Sections**
- **IosPageHeader** — "Dashboard ศูนย์ · Center Access" + ← `/dashboard`
- Building2 icon + heading + คำอธิบาย
- Card: input center_code + ปุ่ม login

**Buttons / CTA**
- `เข้าสู่ระบบ` → POST `/api/center/login` → set cookie → redirect `/dashboard/center/{id}`

**Data Displayed**
- Input: รหัสศูนย์ (เช่น CTR-KPP-001, maxLength=12)

**Design Notes**
- Cookie: `center_session={centerId}` httpOnly, 8 ชั่วโมง
- ไม่มีหน้า logout (แค่ปิด browser หรือหมด session)

---

### S16 · Center Dashboard — รายการงานศพ

| Field | Value |
|---|---|
| **Screen Number** | S16 |
| **Page Name (TH)** | Dashboard ศูนย์ — รายการงานศพ |
| **Route** | `/dashboard/center/[id]` |
| **User Role** | Center Manager |
| **Status** | ✅ Active |

**Purpose**  
แสดงสรุปสถิติศูนย์ + รายการงานศพทั้งหมด + ปุ่มเปิดงานใหม่

**Main Sections**
- **IosPageHeader** — `center.name` + "ศูนย์บริหาร" + ← `/dashboard/center`
- **Stats row** — งานทั้งหมด / กำลังดำเนินการ (badges)
- **ปุ่มเปิดงานใหม่** — → `/dashboard/center/[id]/create`
- **รายการ memorial cards** — แต่ละงาน: ชื่อ, วันฌาปนกิจ, จำนวนผู้ร่วมบุญ, status badge, ปุ่ม close/delete
- **`MemorialCardActions`** — 2-step confirm modal สำหรับ ปิดงาน และ ลบงาน

**Buttons / CTA**
- `+ เปิดงานใหม่` → `/dashboard/center/[id]/create`
- `จัดการงาน` → `/dashboard/center/[id]/memorial/{memId}`
- `ปิดงาน` (amber) → POST `/api/memorials/[id]/close` (modal confirm)
- `ลบงาน` (red) → DELETE `/api/memorials/[id]` (modal confirm)

**Data Displayed**
- `center.name`, `center.center_code`
- memorials: `name`, `ceremony_date`, `funeral_status`, donation count (confirmed)

**Design Notes**
- Server component, `revalidate: 30`
- Memorial cards: status badge `STATUS_COLOR` map (draft/active/closed)
- MemorialCardActions: client component, 2 modal dialogs

**Screenshot Requirement**  
รายการงานศพ 2-3 งาน พร้อม status badge และ action buttons

---

### S17 · เปิดงานศพใหม่

| Field | Value |
|---|---|
| **Screen Number** | S17 |
| **Page Name (TH)** | เปิดงานศพใหม่ |
| **Route** | `/dashboard/center/[id]/create` |
| **User Role** | Center Manager |
| **Status** | ✅ Active |

**Purpose**  
ฟอร์มสร้างงานศพใหม่ สมบูรณ์ รับข้อมูลทุก field แล้วสร้าง memorial + generate event_code + host_code

**Main Sections**
- **IosPageHeader** — "เปิดงานสำเร็จ" (แสดงตอน result แล้ว) / ก่อนนั้น: ฟอร์ม
- **ข้อมูลผู้วายชนม์** — ชื่อ, วันเกิด/เสียชีวิต (ThaiDateInput), อายุ, อัปโหลดรูป
- **กำหนดการสวดพระอภิธรรม** — text + สถานที่
- **กำหนดการฌาปนกิจ** — วันที่ (ThaiDateInput), เวลา, อาคาร, สถานที่
- **ข้อมูลเจ้าภาพ** — ชื่อ, โทรศัพท์, ความสัมพันธ์
- **บัญชีมูลนิธิ** — ชื่อธนาคาร, เลขบัญชี, ชื่อบัญชี, อัปโหลด QR
- **บัญชีเจ้าภาพ** (optional) — host bank info
- **Result page** — event_code, host_code, link สาธารณะ, ปุ่มคัดลอก

**Buttons / CTA**
- `สร้างงานศพ` → POST `/api/memorials/create` (FormData)
- `คัดลอก Host Code` / `คัดลอก Event Code` / `คัดลอกลิงก์`
- `เปิดหน้างานศพ` (external link)

**Data Displayed**
- Result: `eventCode`, `hostCode`, `slug`, public URL

**Design Notes**
- Component: `CreateMemorialClient.tsx`
- Upload: photo + QR image → Supabase storage
- ThaiDateInput ทุก date field
- Collapsible sections (ChevronDown/Up)
- Fallback: ถ้า column ไม่มี (migration ยังไม่ apply) → base-only insert

**Screenshot Requirement**  
ฟอร์มพร้อม ThaiDateInput + result card หลังสร้างสำเร็จ

---

### S18 · จัดการงานศพ (ศูนย์)

| Field | Value |
|---|---|
| **Screen Number** | S18 |
| **Page Name (TH)** | จัดการงานศพ |
| **Route** | `/dashboard/center/[id]/memorial/[memId]` |
| **User Role** | Center Manager |
| **Status** | ✅ Active |

**Purpose**  
ตรวจสลิป ยืนยัน/ปฏิเสธ donation + ปิดงานศพ + ดูข้อมูลสรุป

**Main Sections**
- **IosPageHeader** — `memorial.name` + วันฌาปนกิจ + ← center + ✏️ + ↗️ link
- **Stats** — ยอดรวม / ยืนยันแล้ว / รอตรวจ / ค่าบริการ / สุทธิ
- **ปุ่มปิดงาน** — `CloseMemorialButton` (2-step confirm)
- **รายการ donations** — VerifyDonationButton ยืนยัน/ปฏิเสธ แต่ละรายการ
- **Link สาธารณะ** — แสดง URL + copy

**Buttons / CTA**
- ✏️ → `/dashboard/center/[id]/memorial/[memId]/edit`
- ↗️ → `/{slug}` (new tab)
- `ยืนยัน` / `ปฏิเสธ` → PATCH `/api/donations/[id]`
- `ปิดงานและโอนเงิน` → POST `/api/memorials/[id]/close`

**Data Displayed**
- Donations list: donor_name, amount, status, slip_url, nameplate_status, created_at
- Total confirmed amount, pending count, service fee, net amount
- Status badges: pending(amber) / confirmed(emerald) / rejected(red)
- Nameplate: pending / queued / printed / posted

**Design Notes**
- `SYSTEM_FEE = 100` บาท/ใบ
- `VerifyDonationButton` client component
- `CloseMemorialButton` 2-step confirm + shows host bank transfer info

**Screenshot Requirement**  
รายการ donations พร้อมปุ่ม verify + สรุปยอด

---

### S19 · แก้ไขข้อมูลงานศพ (ศูนย์)

| Field | Value |
|---|---|
| **Screen Number** | S19 |
| **Page Name (TH)** | แก้ไขข้อมูลงาน (ศูนย์) |
| **Route** | `/dashboard/center/[id]/memorial/[memId]/edit` |
| **User Role** | Center Manager |
| **Status** | ✅ Active |

**Purpose**  
ศูนย์แก้ไขข้อมูลงานศพ (เหมือน S14 แต่ actorType = "center")

**Design Notes**
- Component: `EditMemorialInfoForm.tsx` (shared กับ S14)
- Auth: ตรวจ cookie `center_session`
- Audit log: `actor_type: "center"`

---

### S20 · Dashboard Selector

| Field | Value |
|---|---|
| **Screen Number** | S20 |
| **Page Name (TH)** | เลือกประเภท Dashboard |
| **Route** | `/dashboard` |
| **User Role** | All authenticated roles |
| **Status** | ✅ Active |

**Purpose**  
หน้า selector ให้เลือกเข้า dashboard ตามบทบาท

**Main Sections**
- Logo หรีดร่วมบุญ (centered)
- Card: ศูนย์บริหาร → `/dashboard/center`
- Card: เจ้าภาพ → `/dashboard/host`
- Card: ESG Admin → `/dashboard/admin`

**Design Notes**
- ไม่มี sticky header (full center layout)
- Cards: `bg-cream-50 rounded-2xl gold-border card-shadow`

---

## 4. ESG / Admin Dashboard (ส่วนกลาง)

---

### S21 · Login Admin

| Field | Value |
|---|---|
| **Screen Number** | S21 |
| **Page Name (TH)** | Login ESG Admin |
| **Route** | `/dashboard/admin` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
Login ด้วย `ADMIN_PASSWORD` env รับ cookie `admin_session=ok`

**Main Sections**
- **IosPageHeader** — "ESG Admin · ส่วนกลาง" + ← `/dashboard`
- BarChart3 icon + heading
- Card: input password + ปุ่ม login

**Buttons / CTA**
- `เข้าสู่ระบบ` → POST `/api/admin/login` → set cookie → `/dashboard/admin/overview`

**Design Notes**
- Cookie: `admin_session=ok` httpOnly, 8 ชั่วโมง
- Protected layout: `app/dashboard/admin/(protected)/layout.tsx`

---

### S22 · Admin Overview

| Field | Value |
|---|---|
| **Screen Number** | S22 |
| **Page Name (TH)** | ภาพรวมระบบ |
| **Route** | `/dashboard/admin/overview` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
KPI ภาพรวมทั้งระบบ + รายการงานล่าสุด

**Main Sections**
- **AdminNav** — navigation 5 เมนู (sticky)
- **Stats grid** — ศูนย์ทั้งหมด / active / งานศพ / active / ผู้ร่วมบุญ / ยอดรวม / รอตรวจ
- **ESG stats** — หรีดที่ลดขยะ / น้ำหนักขยะที่ลด
- **งานศพล่าสุด** — รายการ 5 งานล่าสุด + status

**Data Displayed**
- `centers`: total / active count
- `memorials`: total / active count
- `donations`: confirmed count + total amount / pending count
- ESG: `KG_PER_WREATH = 2` × confirmed count

**Design Notes**
- `revalidate: 60`
- AdminNav component: ภาพรวม / ศูนย์ / งานศพ / เจ้าภาพ / รายงาน + ปุ่ม logout

---

### S23 · รายการศูนย์ (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S23 |
| **Page Name (TH)** | รายการศูนย์บริหาร |
| **Route** | `/dashboard/admin/centers` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
แสดงรายการศูนย์ทั้งหมด พร้อมสถิติ + ปุ่มลบ

**Main Sections**
- **AdminNav**
- ปุ่ม `+ เพิ่มศูนย์ใหม่`
- รายการศูนย์: ชื่อ / รหัส / จำนวนงาน / active / status
- `DeleteCenterButton` — 2-step confirm modal

**Buttons / CTA**
- `+ เพิ่มศูนย์ใหม่` → `/dashboard/admin/centers/new`
- คลิกศูนย์ → `/dashboard/admin/centers/[id]`
- ลบ (Trash2 icon) → DELETE `/api/centers/[id]`

**Design Notes**
- ลบถูก block ถ้ามี active memorials

---

### S24 · สร้างศูนย์ใหม่ (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S24 |
| **Page Name (TH)** | สร้างศูนย์ใหม่ |
| **Route** | `/dashboard/admin/centers/new` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
ฟอร์มสร้างศูนย์บริหารหรีดร่วมบุญใหม่

**Buttons / CTA**
- `สร้างศูนย์` → POST `/api/centers`

**Data Fields**
- ชื่อศูนย์, center_code, จังหวัด/อำเภอ/ตำบล, เทศบาล, ผู้จัดการ, เบอร์ (PromptPay)

---

### S25 · รายละเอียดศูนย์ (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S25 |
| **Page Name (TH)** | รายละเอียดศูนย์ |
| **Route** | `/dashboard/admin/centers/[id]` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
ข้อมูลศูนย์ + รายการงานในศูนย์ + สถิติ

---

### S26 · รายการงานศพ (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S26 |
| **Page Name (TH)** | รายการงานศพทั้งระบบ |
| **Route** | `/dashboard/admin/memorials` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
แสดงงานศพทั้งหมดในระบบ filter by status (active/closed/all)

**Main Sections**
- Filter tabs: ทั้งหมด / กำลังดำเนินการ / ปิดแล้ว
- รายการ memorials: ชื่อ / event_code / ศูนย์ / วันฌาปนกิจ / status / donation count

**Data Displayed**
- Joins: memorial + center name + donation count

---

### S27 · รายงาน ESG (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S27 |
| **Page Name (TH)** | รายงาน ESG Impact |
| **Route** | `/dashboard/admin/esg` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
แสดงผลกระทบด้านสิ่งแวดล้อม (ESG) ที่หรีดร่วมบุญสร้าง

**Main Sections**
- KPI: หรีดดิจิทัลทั้งหมด / ขยะพวงหรีดที่ลดได้ (kg) / ยอดเงินรวม / ศูนย์ active / งานศพ
- ESG formula: `KG_PER_WREATH = 2` (2 กก./หรีด)

**Data Displayed**
- confirmed donations count × 2 = kg waste reduced
- Total confirmed amount
- Centers active, memorials closed/active

---

### S28 · รายงานภูมิภาค (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S28 |
| **Page Name (TH)** | รายงาน ภาค/จังหวัด/อำเภอ/ศูนย์ |
| **Route** | `/dashboard/admin/report` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
Drill-down report: ภาค → จังหวัด → อำเภอ → ศูนย์

**Main Sections**
- รายงานแยกตาม region / province / amphoe / center
- KPI: จำนวนศูนย์ / งานศพ / ผู้ร่วมบุญ / ยอดเงิน / ESG (kg)
- จัดกลุ่มตาม REGION_MAP (6 ภาค)

---

### S29 · Analytics (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S29 |
| **Page Name (TH)** | Analytics ภาพรวม |
| **Route** | `/dashboard/admin/analytics` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
วิเคราะห์ข้อมูลแบบ filter ตาม geo-level + period

**Main Sections**
- `AnalyticsFilters` — filter: geo-level (ภาค/จังหวัด/อำเภอ/ศูนย์) + period (7d/30d/90d/1y/all)
- Breakdown table ตาม filter ที่เลือก

**Data Displayed**
- Joindata: centers + memorials + donations per geo + period

---

### S30 · ตรวจสอบความผิดปกติ (Admin Audit)

| Field | Value |
|---|---|
| **Screen Number** | S30 |
| **Page Name (TH)** | ตรวจสอบความผิดปกติ |
| **Route** | `/dashboard/admin/audit` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
ตรวจสอบ anomalies: สลิปรอนาน / ยอดสูงผิดปกติ / audit log ล่าสุด

**Main Sections**
- สลิปรอตรวจนาน (pending > X hours)
- ยอดเงินสูงผิดปกติ (≥ 10,000 บาท)
- Audit log ล่าสุด (who edited what)
- งานศพที่น่าสงสัย

**Data Displayed**
- `donations`: pending list + large amounts
- `audit_logs`: actor_type, actor_id, action, details, created_at
- `memorials`: flagged items

---

### S31 · ข้อมูลเจ้าภาพ (Admin)

| Field | Value |
|---|---|
| **Screen Number** | S31 |
| **Page Name (TH)** | ข้อมูลเจ้าภาพ |
| **Route** | `/dashboard/admin/hosts` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
รายชื่อเจ้าภาพทุกงาน + บัญชีรับเงินเจ้าภาพ + สถิติ

**Main Sections**
- รายการ memorials ที่มี host_name
- ข้อมูล: host_name, host_phone, host_relationship, host_bank_account
- ยอดเงินสุทธิที่เจ้าภาพควรได้รับ

---

## 5. Shared / Utility Pages

---

### S32 · Admin Protected Layout

| Field | Value |
|---|---|
| **Screen Number** | S32 |
| **Page Name (TH)** | Layout Admin (Protected) |
| **Route** | `/dashboard/admin/(protected)/*` |
| **User Role** | Super Admin |
| **Status** | ✅ Active |

**Purpose**  
Server-side cookie guard สำหรับทุกหน้า admin

**Design Notes**
- ตรวจ `admin_session=ok` cookie ทุก request
- ถ้าไม่มี → redirect `/dashboard/admin`
- `AdminNav` — 5 เมนู: ภาพรวม / ศูนย์ / งานศพ / เจ้าภาพ / รายงาน / analytics / ESG / audit + logout

---

### S33 · Certificate (Placeholder)

| Field | Value |
|---|---|
| **Screen Number** | S33 |
| **Page Name (TH)** | ใบรับรอง |
| **Route** | `/{slug}/certificate` |
| **User Role** | Public |
| **Status** | 📋 Draft |

**Purpose**  
หน้าใบรับรองการร่วมบุญ (ยังไม่ implement)

---

## ภาพรวม Component Architecture

```
Layout (layout.tsx)
├── iOS 17 ambient bg (2 glow divs)
├── Sarabun font (Google Fonts)
└── All pages inherit

Shared Components (components/)
├── IosPageHeader       ← Dynamic Island pill (ใช้ทุกหน้า)
├── SiteHeader          ← Public homepage only (S01)
├── LotusIcon           ← SVG icon ดอกบัว
├── ThaiDateInput       ← วัน/เดือน/ปี พ.ศ. selector
├── MemorialProfile     ← รูป + ชื่อ + วันชาตะ/มรณะ (S01)
├── CeremonyInfo        ← iOS grouped table กำหนดการ (S01)
├── WreathBoard         ← รูปบอร์ดหรีด (S01)
├── PaymentSection      ← CTA ปุ่มมอบหรีด (S01)
├── SiteFooter          ← Footer text (S01)
├── HomeScrollClient    ← Lazy reveal WreathBoard + PaymentSection
├── PaymentPageClient   ← ชำระเงิน (S02)
├── HostDashboardClient ← Host dashboard + tabs (S11)
├── HostBankForm        ← ฟอร์มบัญชีเจ้าภาพ (S11)
├── EditMemorialInfoForm← แก้ไขข้อมูล (S14, S19)
├── ECardClient         ← E-card + AI Photo (S06)
├── AdminNav            ← Navigation admin (S22-S31)
├── VerifyDonationButton← ยืนยัน/ปฏิเสธสลิป (S18)
├── CloseMemorialButton ← ปิดงาน 2-step (S18)
├── MemorialCardActions ← Close/Delete cards (S16)
├── DeleteCenterButton  ← ลบศูนย์ (S23)
├── PromptPayQR         ← QR PromptPay (S02)
└── ai-photo/
    ├── AiPhotoSection        ← Container (S06)
    ├── AiPhotoTemplateSelector← 3 templates (S06)
    └── AiPhotoResult         ← Preview + download (S06)
```

---

## Design System Reference

| Token | Value |
|---|---|
| Font | Sarabun (Google Fonts) |
| Primary CTA | `gold-gradient` + `ios-cta` (rounded-full) |
| Card | `ios-glass` หรือ `bg-cream-50 rounded-2xl gold-border card-shadow` |
| Header | `IosPageHeader` — dark Dynamic Island pill |
| Border | `gold-border` = 0.5px rgba(201,152,60,0.35) |
| Shadow | `card-shadow` = 0 2px 24px rgba(176,120,32,0.07) |
| Background | Body: warm gradient `#FDFBF4 → #F8F1E4 → #FAF4EC` |
| Input | `px-4 py-3 rounded-xl gold-border bg-white text-gold-800` |
| Back btn (iOS) | Dark pill `rgba(14,9,2,0.82)` + `backdrop-blur(40px)` |

---

## API Routes สรุป

| Method | Path | หน้าที่ |
|---|---|---|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Clear admin cookie |
| POST | `/api/center/login` | Center login + set cookie |
| POST | `/api/centers` | สร้างศูนย์ (admin) |
| DELETE | `/api/centers/[id]` | ลบศูนย์ (admin) |
| POST | `/api/donations` | สร้าง donation |
| PATCH | `/api/donations/[id]` | เปลี่ยน status |
| GET | `/api/memorial/host` | Host login ด้วย code |
| POST | `/api/memorials/create` | สร้าง memorial (center) |
| PATCH | `/api/memorials/[id]` | อัปเดต host bank / docs |
| PATCH | `/api/memorials/[id]/info` | แก้ไขข้อมูลงาน (center/host/admin) |
| POST | `/api/memorials/[id]/close` | ปิดงาน |
| DELETE | `/api/memorials/[id]` | ลบงาน (center/admin) |
| POST | `/api/upload-slip` | Upload สลิป → Supabase storage |
| POST | `/api/generate-wreath` | AI image (DALL-E / gpt-image-1) |

---

*Generated from source code — หรีดร่วมบุญ Zero Waste v2026-05*

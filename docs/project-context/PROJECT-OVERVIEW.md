# ภาพรวมโปรเจค — หรีดร่วมบุญ Zero Waste

> เอกสารบริบทสำหรับ Claude.ai Project · สรุปจากโค้ดจริง ณ วันที่จัดทำ (ดูสถานะล่าสุดใน `CURRENT-STATUS.md` และประวัติใน `CHANGELOG.md`)

## 1. โปรเจคนี้ทำอะไร / แก้ปัญหาอะไร

**หรีดร่วมบุญ Zero Waste** คือเว็บแอพจัดการงานฌาปนกิจแบบ "เปลี่ยนพวงหรีดเป็นทุนบุญ":

- **ปัญหาที่แก้:** พวงหรีดดอกไม้สดใช้ครั้งเดียวแล้วกลายเป็นขยะ (ประมาณ 2 กก./พวง) และเงินค่าพวงหรีดไม่ถึงมือครอบครัวผู้วายชนม์
- **วิธีแก้:** แทนที่จะซื้อพวงหรีด ผู้ร่วมงาน "ร่วมบุญ" โอนเงิน**เข้าบัญชีเจ้าภาพโดยตรง** แล้วระบบพิมพ์**ป้ายชื่อ**ผู้ร่วมบุญไปติดบอร์ดหน้างานแทนพวงหรีด
- **ผู้ดำเนินการ:** บริษัท หรีดร่วมบุญ จำกัด (ผู้พัฒนาแอพ) ร่วมกับ "ศูนย์บริหาร" ประจำพื้นที่ (ผูกกับ อปท./เทศบาล) — ศูนย์เก็บ**ค่าดำเนินการ 10%** ของยอดร่วมบุญคืนจากเจ้าภาพในวัน "คืนบอร์ด" (เงินไม่ผ่านศูนย์/เทศบาล)
- **มิติ ESG:** รายงานลดขยะ/สวัสดิการ ส่งให้ อปท. ตรวจสอบแบบ read-only (ไม่เห็นข้อมูลส่วนบุคคล)

โดเมนหลัก: `https://ruamboon.online` (โดเมนเก่า `rrb.center` ยังใช้ได้)

## 2. Tech Stack (จาก package.json จริง)

| หมวด | เทคโนโลยี | เวอร์ชัน |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 |
| UI | React / React DOM | ^19.0.0 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS (+ @tailwindcss/postcss) | ^4 |
| Icons | lucide-react | ^0.511.0 |
| Database | Supabase PostgreSQL (@supabase/supabase-js ^2.49.8, @supabase/ssr ^0.6.1) | — |
| Storage | Supabase Storage (buckets: `memorials` = public, `donations` = private) | — |
| Payment (QR) | promptpay-qr ^0.5.0 + qrcode.react ^4.2.0 + qrcode ^1.5.4 — สร้าง QR พร้อมเพย์ฝั่ง client จาก "เบอร์เจ้าภาพที่ยืนยัน OTP แล้ว" | — |
| Payment (ยืนยัน) | **ไม่มี payment gateway** — ผู้ร่วมบุญโอนเองแล้วอัปโหลดสลิป (auto-confirm) · มี `webhooks/payment` + ตาราง `payments` เตรียมไว้แต่ยังไม่ได้ต่อ provider จริง | — |
| AI Image | OpenAI Images API (เรียกตรงผ่าน `lib/openai-image.ts`, model default `gpt-image-1.5`) — จำลองภาพมอบหรีด | — |
| พิมพ์ป้าย | PrintNode API (`lib/printnode.ts`) + pdf-lib ^1.17.1 + @pdf-lib/fontkit ^1.1.1 (สร้าง PDF ป้าย) | — |
| SMS OTP | ThaiBulkSMS API v2 (`lib/sms.ts`) — ต้องตั้ง env `THAIBULKSMS_*` ครบ 3 ตัวจึงส่งจริง ไม่ตั้ง = โหมดทดสอบโชว์รหัสบนจอ | — |
| รูปภาพ client | heic2any ^0.0.4 (แปลง HEIC→JPEG), html-to-image ^1.11.13, html2canvas ^1.4.1 | — |
| Hosting | Vercel (auto-deploy จาก GitHub branch `main`, มี `vercel.json`) | — |
| Repo | GitHub `changkpp-cloud/rrb` | — |

**Auth pattern (ไม่ใช่ JWT เต็มรูปแบบ):**
- Admin: cookie `admin_session` (เทียบ env `ADMIN_PASSWORD`)
- Center: cookie `center_session` — ล็อกอินด้วยเบอร์มือถือ + รหัสผ่าน (`/api/center/user-login` ผ่านตาราง `app_users` + `center_memberships`) หรือ legacy center_code
- Host: รหัส `host_code` (ไม่มี cookie ใช้ URL param ต่อ)
- Supabase เรียกผ่าน `createAdminClient()` (service role, bypass RLS) เสมอ — RLS มีเฉพาะ public read/insert พื้นฐาน

## 3. User Roles

| Role | ล็อกอินอย่างไร | ทำอะไรได้ |
|---|---|---|
| **Super Admin** (แอดมินกลาง) | รหัสผ่านกลาง (`ADMIN_PASSWORD`) → cookie `admin_session` | เปิดศูนย์ใหม่ · ออก "รหัสเข้าศูนย์" ให้ผู้ใช้ (2 สิทธิ์ด้านล่าง) · ดูภาพรวม/วิเคราะห์/ESG/system health/audit log ทั้งระบบ · จัดการแบนเนอร์และ AI prompt |
| **center_manager** (แอดมินศูนย์ — สิทธิ์แก้ไข) | เบอร์มือถือ + รหัสผ่าน (ออกโดยแอดมินกลาง) | เปิดงานศพ (กรอกบัญชีเจ้าภาพ + ยืนยัน OTP) · แก้ไขงาน/แก้บัญชี (ต้อง OTP ทุกครั้ง) · ปิดงาน · จัดการคิวพิมพ์ป้าย · เก็บค่าดำเนินการ/รับคืนบอร์ด · รายงานส่ง อปท. |
| **lgo_observer** (ตัวแทน อปท. — สิทธิ์ดู) | เบอร์มือถือ + รหัสผ่าน | read-only: หน้า `/oversight` (KPI/การเงินโปร่งใส/สิ่งแวดล้อม) + `/report` + `/compliance` · **ไม่เห็น PII** (ถูก redirect ออกจากหน้า operations/transfers/รายละเอียดงาน) |
| **Host** (เจ้าภาพ) | รหัส `host_code` (ได้ตอนศูนย์เปิดงาน) | ดูแดชบอร์ดงานตัวเอง: ยอดรวม/รายชื่อผู้ร่วมบุญ/รายงาน/บัญชีรับเงิน/ภาพ AI · แก้ไขข้อมูลงานบางส่วน · สิทธิ์หมดอายุ 30 วันหลังปิดงาน |
| **Donor** (ผู้ร่วมบุญ) | ไม่ต้องล็อกอิน | เข้าหน้างานผ่านลิงก์/QR → โอนเงิน → อัปโหลดสลิป → กรอกชื่อป้าย + ข้อความหลังป้าย → รับ e-card + สร้างภาพ AI มอบหรีด |

หมายเหตุ: enum เดิมมี `center_staff` / `center_viewer` แต่**ยกเลิกการออกใหม่แล้ว** (คงไว้เพื่อ backward-compat) · helper สิทธิ์อยู่ที่ `lib/iam-utils.ts` (`canEditCenterWork` = super_admin | center_manager)

## 4. Workflow หลัก

```
[1] ศูนย์เปิดงาน (/dashboard/center/[id]/create)
    เจ้าภาพมาแจ้งที่ศูนย์ → เจ้าหน้าที่กรอก: ข้อมูลผู้วายชนม์ + กำหนดพิธี
    + บัญชีรับเงินเจ้าภาพ (ธนาคาร/เลขบัญชี/ชื่อบัญชี — บังคับ)
    + เบอร์เจ้าภาพ → ส่ง OTP → เจ้าภาพบอกรหัส → ยืนยัน (host_phone_verified)
    → ได้ slug งาน (เช่น ctr-xxx-somchai) + host_code สำหรับเจ้าภาพ

[2] แชร์ลิงก์งาน (/{slug})
    หน้างานแสดง: รูป/ประวัติผู้วายชนม์ + กำหนดพิธี + บอร์ดรำลึกป้ายผู้ร่วมบุญ

[3] ผู้ร่วมบุญจ่ายเงิน (/{slug}/payment)
    เห็น QR พร้อมเพย์ (generate จากเบอร์เจ้าภาพที่ยืนยัน OTP — เงินเข้าเจ้าภาพตรง)
    + เลขบัญชี/เลขพร้อมเพย์ + ปุ่มคัดลอก + ปุ่ม deep link เปิดแอปธนาคาร
    → โอนเงินในแอปธนาคาร → กลับมาอัปโหลดสลิป (JPG/PNG, มี hash กันสลิปซ้ำ)

[4] กรอกป้ายชื่อ (/{slug}/print-name)
    ชื่อ/องค์กร + ตำแหน่ง/ข้อความอาลัย (หน้าป้าย) + ข้อความหลังป้าย (ไม่บังคับ)
    → POST /api/donations → สร้าง donation status="confirmed" ทันที (auto-confirm)
    → ยิงพิมพ์ป้ายอัตโนมัติผ่าน PrintNode (ถ้างานตั้ง printer_id)
    → พิมพ์ไม่สำเร็จ = SMS แจ้งศูนย์ + ปุ่ม "พิมพ์ซ้ำ" ในระบบ

[5] หน้าขอบคุณ (/{slug}/success)
    e-card + สร้างภาพ AI จำลองมอบหรีด (แชร์ลิงก์รับรูปทีหลังได้)

[6] ระหว่างงาน
    ศูนย์ดูคิวป้าย/KPI ที่ /operations · เจ้าภาพดูยอด+รายชื่อ real-time ที่ host dashboard
    ป้ายผู้ร่วมบุญขึ้น "บอร์ดรำลึก" บนหน้าแรกและหน้างาน (กดดูข้อความหลังป้ายได้)

[7] ปิดงาน + เก็บค่าดำเนินการ
    ศูนย์กด "ปิดงาน" → funeral_status = closed (host เข้าดูได้อีก 30 วัน)
    วันคืนบอร์ด: เจ้าภาพจ่ายค่าดำเนินการ 10% ของยอดรวมคืนศูนย์ (สูตรที่ lib/fee.ts)
    → ศูนย์กดยืนยันที่หน้า /transfers (transfer_confirmed_at)

[8] รายงาน
    ศูนย์ออกรายงานรายเดือน/รายปีส่ง อปท. (PDF/CSV) + ทำเครื่องหมาย "ส่งแล้ว" (compliance)
    อปท. ดู oversight/compliance แบบ read-only · แอดมินกลางดู analytics/ESG ทั้งระบบ
```

**กฎเหล็กเรื่องเงิน:**
- เงินผู้ร่วมบุญเข้า**บัญชีเจ้าภาพโดยตรง** ไม่ผ่านศูนย์/เทศบาล/บริษัท
- QR พร้อมเพย์สร้างจากเบอร์ที่**ยืนยัน OTP แล้วเท่านั้น** — แก้บัญชี/เบอร์ภายหลังต้องผ่าน OTP ทุกครั้ง
- ค่าดำเนินการ = `Math.round(total * 0.1)` — ต้อง import จาก `@/lib/fee` เท่านั้น ห้าม hardcode
- การกระทำเรื่องเงิน (แก้บัญชี/ปิดงาน/เก็บค่าดำเนินการ) ถูกบันทึกใน `audit_logs`

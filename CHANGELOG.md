# CHANGELOG — หรีดร่วมบุญ

> บันทึกประวัติการแก้ไขแบบสะสม (append ต่อท้ายเรื่อยๆ ไม่ลบของเก่า)
> ใหม่สุดอยู่บนสุด · รูปแบบ: `- หัวข้อ — เหตุผล/ผลลัพธ์ (ไฟล์/commit)`
> สถานะปัจจุบันของระบบดูที่ `CLAUDE.md` · ไฟล์นี้เก็บ "ประวัติว่าเกิดอะไรขึ้นเมื่อไหร่"

---

## 2026-06-28

### อัปเดตชื่อเว็บในเอกสาร rrb.center → ruamboon.online ทั้งหมด
- เปลี่ยน rrb.center เป็น ruamboon.online ในเอกสารทุกที่ที่ระบุเป็น "โดเมน/URL ของเว็บ"
- **ไฟล์:** `ระบบสรุป-หรีดร่วมบุญ.md` (5 จุด), `SYSTEM_DOCUMENTATION.md` (2), `docs/checklist-เปิดศูนย์แรก.md`, `docs/brain/06-มาตรฐานแบรนด์.md`, `docs/brain/02-flow-ระบบ.md`, `README.md` + comment ใน `CreateMemorialClient.tsx` ที่ stale
- **คงไว้ตั้งใจ:** CHANGELOG เดิม (ประวัติ ณ ตอนนั้น) และหมายเหตุ "rrb.center ยังใช้งานได้คู่กัน" ใน `lib/site-url.ts` / `CLAUDE.md` / `docs/brain/06` (อธิบายพฤติกรรม dual-domain จริง)

### แทนที่ "ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ" ด้วยสโลแกนใหม่ทั้งหมด
- เปลี่ยนวลีแบรนด์เก่าเป็นสโลแกนใหม่ (`SITE_SLOGAN`) ทุกจุด — กลับลำจากรอบก่อนที่ "เพิ่มต่อท้าย" มาเป็น "แทนที่"
- **โค้ด:** `app/layout.tsx` (meta description = สโลแกน + "สำหรับงานศพไทย"), `app/[slug]/page.tsx` (fallback ทั้ง 2 จุด = สโลแกนล้วน)
- **เอกสารแบรนด์:** `README.md`, `ระบบสรุป-หรีดร่วมบุญ.md` (Tagline), `UI_SCREEN_MASTER_CURRENT.md`, `PROJECT_SLIDE_BRIEF.md` (2 จุด)
- **ไม่แตะ:** `ร่วมอาลัยและร่วมทำบุญ` (ข้อความ default บนภาพหรีด AI — คนละตัว) และ CHANGELOG เดิม (ประวัติ)

### เพิ่มสโลแกนต่อท้าย meta description (ตอนแชร์ลิงก์)
- **เพิ่ม ไม่ลบของเดิม** — ต่อท้ายสโลแกนใหม่ใน meta description เพื่อให้ตอนแชร์ลิงก์ LINE/FB เห็นสโลแกนด้วย
- เพิ่มค่ากลาง `SITE_SLOGAN` ใน `lib/site-url.ts` (แก้ที่เดียว ใช้ทุกที่)
- จุดที่ต่อท้าย: `app/layout.tsx` (แชร์ลิงก์หน้าแรก/ทั่วไป), `app/[slug]/page.tsx` `buildShareDescription` (ลิงก์งานจริง = ข้อมูลผู้วายชนม์ + สโลแกน) และ fallback กรณีหางานไม่เจอ
- **หมายเหตุ:** ลิงก์งานผู้วายชนม์จริง description เดิมเป็นข้อมูลคน (ชาตะ/มรณะ/อายุ/กำหนดพิธี) ไม่ใช่สโลแกนเก่า — ตอนนี้ต่อสโลแกนเพิ่มท้าย

### เปลี่ยนสโลแกนใหม่ + แสดงบนหน้าแรก
- **เดิม:** `SiteFooter` แสดง "ร่วมอาลัย · ร่วมทำบุญ · ร่วมลดขยะ" (เฉพาะท้ายหน้างาน `/{slug}`)
- **ใหม่:** สโลแกน 2 บรรทัด — บรรทัดแรก "เปลี่ยนพวงหรีดเป็นทุน ร่วมบุญเจ้าภาพ" / บรรทัดล่าง "ลดขยะต้นทาง สร้างสวัสดิการผู้วายชนม์"
- **แก้:** `components/SiteFooter.tsx` (ข้อความ 2 บรรทัด, บรรทัดแรกเด่นกว่า) + เพิ่ม `<SiteFooter />` บน `app/page.tsx` (หน้าแรกให้แสดงสโลแกนด้วย)
- **หมายเหตุ:** meta description (`app/layout.tsx`, `[slug]/page.tsx`) และเอกสารแบรนด์ (`docs/brain/06`, README ฯลฯ) ยังเป็นข้อความเดิม — ค่อยทยอยซิงค์ภายหลังถ้าต้องการ

### เปลี่ยนโดเมนหลักเป็น ruamboon.online (ใช้คู่กับ rrb.center)
- **ที่มา:** ซื้อโดเมนใหม่ `ruamboon.online` ตั้งเป็นโดเมนหลักของระบบ ลิงก์/QR ที่สร้างใหม่ใช้โดเมนนี้
- **นโยบาย:** ใช้คู่กัน **ไม่ redirect** — `rrb.center` ยังชี้มาเว็บเดียวกัน ลิงก์/QR เก่าที่แจกไปแล้วเปิดได้ปกติ
- **แก้โค้ด:** `lib/site-url.ts` (ค่า `SITE_URL` fallback), `.env.local.example` + `.env.local` (`NEXT_PUBLIC_SITE_URL`), ข้อความตัวอย่าง URL ใน `CreateMemorialClient.tsx` และหน้าเปิดศูนย์ `admin/centers/new/page.tsx`
- **ต้องทำฝั่ง infra (นอกโค้ด):** เพิ่มโดเมน `ruamboon.online` ใน Vercel + ตั้ง DNS ที่ Hostinger ให้ชี้ Vercel + อัปเดต env `NEXT_PUBLIC_SITE_URL` บน Vercel แล้ว redeploy (สำคัญ: env บน Vercel ชนะค่า fallback ในโค้ด)

## 2026-06-25

### แก้บั๊ก: รูปผู้วายชนม์ไม่แสดงบน iPhone ในหน้าขอบคุณ/e-card
- **อาการ:** เปิดหน้าขอบคุณบน iPhone แล้วรูปผู้วายชนม์หาย (ตัวหนังสือ/ลายเส้นยังอยู่) แต่ Android แสดงครบ
- **สาเหตุ:** รูปอัปโหลดขนาดเต็มจากกล้องมือถือ (~12MP) → `html-to-image (toPng)` ที่ใช้ render การ์ดเป็น PNG ชนลิมิต decode/canvas ของ iOS Safari → drop เฉพาะรูป ขณะ Android ไม่มีลิมิตเลยออกครบ
- **แก้:** `ECardClient.tsx` — ย่อรูปผ่าน canvas ให้ ≤720px ก่อนทำ data URL (เล็กพอให้ iOS embed/decode ได้ + กัน canvas CORS taint ผ่าน blob URL) + warm up `toPng` หนึ่งรอบก่อนจับจริง (Safari มักทิ้งรูปฝังในรอบ rasterize แรก)
- **แก้ที่ต้นทางด้วย:** ฟอร์มเปิดงาน (`CreateMemorialClient.tsx`) ย่อรูปผู้วายชนม์ตั้งแต่ตอนเลือกไฟล์ (≤1280px JPEG) ผ่าน util ใหม่ `lib/compress-image.ts` → `photo_url` เก็บไฟล์ขนาดพอเหมาะตั้งแต่แรก ทุกหน้าที่ดึงไปใช้ได้ประโยชน์ + อัปโหลดเร็วขึ้น (display-time downscale ยังคงไว้เป็น defense สำหรับงานเก่าที่อัปไฟล์เต็มไว้แล้ว)

### ย่อรูปทุกช่องทางอัปโหลด เพื่อโหลดเร็วทั้งระบบ
- ต่อ `compressImage()` เข้าทุกจุดที่อัปรูป (util เติมพื้นขาวกัน PNG โปร่งใสเป็นดำ):
  - **รูปคน** (≤1280px): รูปผู้วายชนม์ (เปิดงาน), รูปบุคคล/ครอบครัว `MemorialPersonManager`
  - **เอกสาร/สลิป** (≤1600px คงความอ่านออก, ข้ามไฟล์ PDF อัตโนมัติ): สลิป `PaymentPageClient`, เอกสารศูนย์ `CenterMemorialDocsForm`, เอกสารเจ้าภาพ `HostBankForm` + `HostVerificationGate`
  - **แบนเนอร์บอร์ด** (≤1600px) `BoardBannerAdmin`
  - **QR ธนาคารศูนย์** (≤1280px, คงคมพอสแกน) `CenterSettingsForm`
- ที่มี compress อยู่แล้วไม่แตะ: `AiPhotoSectionV2`, `AiPhotoSection`, `mock-wreath`

## 2026-06-24

### แก้ AI prompt ให้ภาพแม่นขึ้น — เติม [wreath_label_text] ที่ค้าง
- ทดสอบ AI จำลองมอบหรีดจริง (gpt-image-1.5) เจอว่า prompt มี `[wreath_label_text]` ค้างไม่ถูกแทนที่ (token นี้อยู่ใน DB template `ai_photo_templates` แต่ไม่มีใน replacements map ของ `buildAiPhotoPrompt`)
- เพิ่ม `[wreath_label_text]` → แทนด้วยข้อความป้ายจริง (ชื่อ+ตำแหน่ง) ให้ตรงกับ `{PLAQUE_PRINT_TEXT}` และส่วน MANDATORY → ข้อความบนป้ายถูกย้ำ 2 จุด ภาพแม่นขึ้น
- ยืนยันด้วยการจำลองแทนที่ (ไม่เสียค่า OpenAI)

### 🔴 พบบั๊ก blocker: คอลัมน์ transfer_confirmed_* หายจาก DB → ยืนยันโอนเจ้าภาพไม่ได้
- ทดสอบ flow ปิดงาน+โอนเจ้าภาพ เจอว่า `transfer_confirmed_at`/`transfer_confirmed_by` ไม่มีในฐานข้อมูล (นิยามไว้แค่ใน setup-fresh.sql ไม่มี migration แยก) → confirm-transfer query error → ตอบ 404 หลอกๆ → ศูนย์ยืนยันการโอนเงินให้เจ้าภาพไม่ได้
- เพิ่ม migration `20260624000000_add_transfer_confirmed.sql` (ALTER TABLE เพิ่ม 2 คอลัมน์) — **ต้องรันใน Supabase ก่อนเปิดศูนย์**
- ส่วน logic ปิดงาน + confirm-transfer ตรวจแล้วถูกต้อง (auth ครบ, เช็คลำดับ ปิดงาน→มีบัญชี→กันยืนยันซ้ำ) แค่ติดคอลัมน์ DB
- ✅ รัน migration แล้ว (24 มิ.ย.) — ทดสอบ chain ปิดงาน→ยืนยันโอน ผ่านครบ (400/200/200/409, DB บันทึก transfer_confirmed_* ถูกต้อง)

### ปิดช่องโหว่: เพิ่ม auth ที่ API จัดการงาน (เดิมเปิดโล่ง)
- `POST /api/memorials/create` ไม่มี auth — ยิงตรงสร้างงานให้ center_id ไหนก็ได้ → เพิ่ม `getCenterAccess` + `canEditCenterWork` (คนนอก 403, ศูนย์ล็อกอินเปิดงานได้ปกติ)
- `POST /api/memorials/[id]/close` (ใครก็ปิดงานใครได้) → เพิ่ม center auth ของงานนั้น
- `PATCH /api/donations/[id]` (แก้สถานะ/ชื่อ donation, ไม่มี UI เรียกแล้ว) → เพิ่ม center auth ของงานนั้น
- `PATCH /api/memorial` (legacy แก้งาน active ล่าสุด) → จำกัดเฉพาะแอดมิน
- ทดสอบทุกตัว: คนนอก → 403, ศูนย์/แอดมิน → ผ่าน (flow จริงไม่พัง) · endpoint donor/auth (donations, upload-slip, ai-photo, ฯลฯ) ยังเปิดตามเดิมโดยตั้งใจ

### ย้าย auto-print + แจ้งเตือนเจ้าภาพ ไปทำเบื้องหลัง (after) — ผู้ร่วมบุญไม่ต้องรอ
- เดิม `POST /api/donations` await `sendPrintJob` (สร้าง PDF + โหลดฟอนต์ + อัปโหลด storage + PrintNode) ในคำขอ → ผู้ร่วมบุญรอ 2-3 วิหลังกด "ยืนยันส่งพิมพ์" ก่อนเด้งไปขอบคุณ
- ใช้ `after()` ของ Next.js: บันทึก donation + ตอบกลับทันที (~0.5s) แล้วพิมพ์ป้าย+แจ้งเตือนเจ้าภาพเบื้องหลัง
- ทดสอบ flow ผู้ร่วมบุญครบ 4 หน้าบน dev server: ผ่านหมด ไม่มี console error · ยืนยัน after() อัปเดต nameplate_status เบื้องหลังจริง

### แจ้งเตือน "ตรวจสอบเครื่องพิมพ์" → ขึ้นทั้งแดชบอร์ดศูนย์ + เจ้าภาพ
- งานพิมพ์ที่ค้าง (เครื่องออฟไลน์) PrintNode จัดการให้อยู่แล้ว — ค้างคิวแล้วพิมพ์ต่อเองตามลำดับเมื่อเครื่องกลับมา (เราไม่ต้องสร้างคิวเอง)
- เพิ่มแบนเนอร์เตือนเมื่อ **เครื่องพิมพ์ออฟไลน์** หรือ **มีป้ายพิมพ์ไม่สำเร็จ** — แสดงทั้งหน้าจัดการงาน (ศูนย์) และแดชบอร์ดเจ้าภาพ เพื่อช่วยกันไปแก้เครื่องพิมพ์
- `getPrinterState` (PrintNode `/printers`) + `GET /api/printer-status?memorialId=` (ศูนย์/เจ้าภาพเรียกได้) + `PrinterStatusAlert` (poll ทุก 30 วิ)

### เพิ่มปุ่ม "พิมพ์ซ้ำ" ป้ายชื่อให้ศูนย์ + ตัดเงื่อนไข "ติดบอร์ด" ออก (launch-critical)
- เดิม: คิวพิมพ์เป็น read-only — ศูนย์พิมพ์ซ้ำไม่ได้ (ป้าย error ค้างถาวร)
- เพิ่ม endpoint `POST /api/donations/[id]/nameplate` (action reprint, ตรวจสิทธิ์ศูนย์) + `NameplateActions` ปุ่ม "พิมพ์ซ้ำ" ในส่วนป้ายชื่อ
- **ตัดสินใจ: ไม่ใช้สถานะ `posted` (ติดบอร์ด) เป็นเงื่อนไข** — พิมพ์แล้วถือว่าจบ (เจ้าของเลือก "ตัดเงื่อนไขออก") → เอาปุ่ม "ติดบอร์ดแล้ว" ออก, label `queued` = "ส่งพิมพ์แล้ว", หน้าโอนเงิน (transfers) "พร้อมโอน" ไม่ผูกกับการติดบอร์ดอีกต่อไป (เหลือ: ถึงวันฌาปนกิจ + มีผู้ร่วมบุญ + มีบัญชีเจ้าภาพ), warning ก่อนปิดงานเปลี่ยนเป็นเตือนเฉพาะป้าย "พิมพ์ไม่สำเร็จ"
- หมายเหตุ: `/api/print-nameplate` + worker `PRINT_SERVICE_URL` เป็นระบบพิมพ์คู่ขนานที่ไม่ได้ใช้ (active = PrintNode) — เก็บไว้เผื่อ self-hosted

### สร้างสมองกลาง (Knowledge Base) ของบริษัท — `docs/brain/`
- ฐานความรู้กลางให้ AI Agent ทุกตัว + ทีมดึงไปใช้ (Single Source of Truth ฝั่งธุรกิจ/แบรนด์)
- 9 ไฟล์: README(สารบัญ), แนวคิดโครงการ, flow ระบบ, คำอธิบายต่อ อปท., ข้อห้ามเรื่องเงิน, FAQ, มาตรฐานแบรนด์, คลัง prompt, อภิธานศัพท์
- ก้าวแรกของแผน "AI Agent Office" (12 เจ้าหน้าที่/5 ฝ่าย) — สมองกลางคือฐานที่ทุก agent อ้างอิง
- เพิ่ม pointer ใน CLAUDE.md

### รายงานศูนย์ → อปท. (รายเดือน/รายปี)
- หน้าใหม่ `/dashboard/center/[id]/report` — สรุปทุกงานในช่วงเวลา (อิงวันฌาปนกิจ): จำนวนงาน, ผู้ร่วมบุญ, ยอดร่วมบุญรวม, **ค่าดำเนินการสะสม (รายได้ศูนย์ = ราย × 100)**, ยอดนำส่งเจ้าภาพ, ลดขยะ + ตารางต่องาน
- เลือกรายเดือน/รายปี · ออกเป็นเอกสารพิมพ์/PDF (มีหัวศูนย์+ช่องลงนาม อปท.) + ดาวน์โหลด CSV
- เพิ่มปุ่มเข้าหน้านี้ในแดชบอร์ดศูนย์ section "รายงานศูนย์"
- ไฟล์: `report/page.tsx`, `report/CenterReportActions.tsx`, `report/CenterReportPeriodSelector.tsx`
- ตามทิศทางธงนำ อปท. (เก็บข้อมูลทุกอย่างเพื่อรายงานรายเดือน/ปีส่งเจ้าของโครงการประจำพื้นที่)

### แก้บั๊กค่าดำเนินการ (เรื่องเงิน)
- ฝั่งศูนย์คิดค่าดำเนินการเหมา 100 บาท/งาน แต่ฝั่งเจ้าภาพคิด 100 บาท/รายการ → ยอดนำส่งเจ้าภาพไม่ตรงกัน
- แก้ให้ฝั่งศูนย์เป็น `จำนวนราย × 100` ตรงตามแบบเสนอโครงการ อปท. (100 บาท/รายการเสมอ) — `memorial/[memId]/page.tsx`, `CloseMemorialButton.tsx`, `transfers/page.tsx`
- บันทึกกฎค่าดำเนินการลง CLAUDE.md
- หน้า admin hosts: แก้ "ยอดนำส่ง/รอนำส่ง" ให้เป็น**สุทธิ** (หัก ราย × 100) ทั้งการ์ดสรุปและรายงานต่องาน — `admin/(protected)/hosts/page.tsx`

### แก้ปัญหา in-app browser (LINE/Facebook) บนมือถือ
- เปิดแอปธนาคารจากในแชทไม่ได้ → เริ่มจาก `intent://`+package, เอา Play Store fallback ออก, สุดท้ายใช้ custom scheme ตรงๆ (เลี่ยงการอ้อม Play Store โชว์ "อัปเดต") — `PaymentPageClient.tsx`
- เพิ่ม fallback อัตโนมัติ: กดแอปธนาคารแล้วถ้าไม่เปิดใน ~1.5 วิ (detect ผ่าน visibilitychange/blur) แสดงคำแนะนำให้คัดลอกเลขพร้อมเพย์แล้วเปิดแอปเอง — ใช้ได้กับทุกแอปไม่ว่า scheme จะถูกไหม; ลบ field `pkg` ที่ไม่ใช้แล้ว (scheme KTB/KMA/TTB ยังรอเทสต์เครื่องจริง)
- เพิ่ม `ForceExternalBrowser` — เปิดลิงก์งานในแชทแล้วเด้งออกเบราว์เซอร์จริง: LINE auto (`openExternalBrowser=1`), FB Android แสดงปุ่ม "เปิดใน Chrome" ให้กดเอง, FB iOS แนะนำเปิดใน Safari — `components/ForceExternalBrowser.tsx`, `app/[slug]/layout.tsx`
- เพิ่มคำอธิบายกล่องยืนยันของ FB ("ออกจากแอป = ออกจาก Facebook ไม่ใช่ออกจากหรีดร่วมบุญ") กันผู้ใช้กดยกเลิก

### ปรับ UI/ข้อความ donor flow
- แก้ logo 404: `SmartAppHeader` logo เป็น slug-dynamic (เดิม hardcoded `evt-2026-rra8`)
- แก้สระ/วรรณยุกต์ไทยในเมนูล่างโดนตัด (เพิ่ม line-height)
- ปุ่มหน้าชำระเงิน "ถัดไป — ระบุชื่อบนป้าย" → "ส่งตรวจสอบสลิป"
- ปุ่มยืนยันป้าย "ยืนยันส่งข้อมูล" → "ยืนยันส่งพิมพ์", ตอนส่ง "กำลังส่งพิมพ์"
- แบนเนอร์ "รับการร่วมบุญเรียบร้อย" auto-hide 5 วิ แล้ว fade out

### กระบวนการทำงาน
- เพิ่มกฎเหล็ก: แก้ flow/โครงสร้างต้องอัปเดต `CLAUDE.md` + memory ก่อน commit
- สร้างไฟล์ `CHANGELOG.md` นี้ (ประวัติสะสม)
- **ลบทับ `CLAUDE.md` ให้ตรงโค้ดจริง** (อ่านโค้ดทั้งระบบแล้วซิงค์): Route Map (donor 4 หน้า/success=e-card+AI, ลบ verifying/printing), Host 5 แท็บ+edit, Center operations/transfers ไม่ตรวจสลิป, Admin (protected) ครบทุกหน้า, Donation Flow = auto-confirm+auto-print

## 2026-06-23

### เปลี่ยน flow หลัก
- Auto-confirm + auto-print donations — ตัดขั้นรอตรวจสลิปออก (ตาม business model), ลบหน้า orphan `verifying`/`printing`
- เอาแท็บ "รอตรวจ" (pending review) ออกจาก center dashboard
- แยก donor flow กลับเป็น 4 หน้า (หน้างาน → ชำระเงิน → ป้ายชื่อ → ขอบคุณ)

### หน้างาน / ศูนย์
- ศูนย์เพิ่มเอกสารเจ้าภาพ + บัญชีรับเงินบนหน้า memorial ได้
- เพิ่ม slug URL งานที่แก้ไขได้ + กันซ้ำ, ตัดคำนำหน้าไทยออกจาก slug, เพิ่ม `printer_id` migration
- เพิ่มที่อยู่ไทยแบบ cascading (จังหวัด/อำเภอ/ตำบล) ในฟอร์มเปิดงาน
- แก้บั๊กงานที่เปิดแล้วหายจาก center dashboard
- เพิ่มการ์ดแชร์ QR + ลิงก์บนหน้าจัดการงาน
- ThaiDateInput: เปลี่ยนปี พ.ศ. เป็น dropdown
- เพิ่ม master access code สำหรับทดสอบทุก dashboard

### Performance / ตั้งค่า
- เร่งหน้างาน: self-host ฟอนต์ Sarabun + บีบรูปบอร์ดเป็น webp
- ใช้ `rrb.center` เป็น site URL (ไม่ใช้ vercel.app), คง `openExternalBrowser` บนลิงก์/QR
- เพิ่มแบนเนอร์บอร์ดที่ admin จัดการได้บนหน้างาน

---

> ประวัติก่อน 2026-06-23 ดูได้จาก `git log`

## 2026-06-26

### UX: banner กลับจากแอปธนาคาร → อัปโหลดสลิปทันที
- เพิ่ม Page Visibility detection ใน `PaymentPageClient.tsx` — หลังกดปุ่มแอปธนาคาร (K PLUS/SCB ฯลฯ) แล้วกลับมาเว็บ จะแสดง banner "โอนเสร็จแล้วใช่ไหม? แตะที่นี่เพื่ออัปโหลดสลิป"
- แตะ banner → scroll ไปที่ช่องอัปโหลด + เปิด file picker อัตโนมัติ
- banner ขึ้นเฉพาะเมื่อกดปุ่มแอปธนาคารจริง (wentToBankApp ref) และยังไม่ได้แนบสลิป — ไม่ขึ้นซ้ำถ้ากลับมาโดยไม่ได้กดปุ่ม

## 2026-06-26
- ลบกรอบวงรี (oval border) ออกจากรูปผู้วายชนม์ในหน้า E-Card (pp/ecard/ECardClient.tsx) — แสดงรูปแบบสี่เหลี่ยมตามขนาดเดิม ไม่มีเส้นขอบหรือเงา


## 2026-06-26
- ซ่อนแท็บ `ภาพจำลอง` ในแดชบอร์ดเจ้าภาพ (components/HostDashboardClient.tsx) ด้วย feature flag `SHOW_PERSONS_TAB = false` — โค้ดและ content ยังอยู่ครบ แค่ไม่แสดงในแถบเมนู เมื่อพร้อมเปิดให้เปลี่ยน flag เป็น `true`

## 2026-06-26
- ลบข้อความ `เลือกเจ้าภาพ / ญาติ...`, `เจ้าภาพยังไม่ได้เพิ่มบุคคล...`, และ `ระบบจะใช้เฉพาะรูปที่เจ้าภาพอนุญาต...` ออกจากหน้าจำลองมอบหรีดผู้ใช้ (HostPersonPicker)

## 2026-06-26
- เพิ่มหน้า `/dashboard/host/[id]/announce` รายชื่อสำหรับพิธีกร: แสดงชื่อ+ตำแหน่ง+ข้อความ เรียงตามลำดับที่ร่วมบุญ ไม่แสดงยอดเงิน พิมพ์/บันทึกได้
- เพิ่มปุ่ม `บันทึกรายชื่อพิธีกร` (ไอคอนไมค์) ในแท็บรายชื่อของแดชบอร์ดเจ้าภาพ

## 2026-06-26
- เปลี่ยนชื่อแท็บ `รายงาน` → `สรุปการเงิน` ในแดชบอร์ดเจ้าภาพ
- เพิ่มปุ่ม `แชร์` (Web Share API / fallback LINE) + `บันทึกภาพ` (html-to-image toPng) ในหน้ารายชื่อพิธีกร และหน้าสรุปการเงิน
- header/navigation ไม่ติดไปในภาพ — ถ่ายเฉพาะ contentRef เท่านั้น

## 2026-06-26
- หน้าแรก rrb.center ตัดส่วน hero / benefits / how-it-works / ESG / quick-links ออกทั้งหมด เหลือเฉพาะส่วน `งานศพที่เปิดอยู่ขณะนี้` + header (โลโก้ + ปุ่มเข้าใช้งานสำหรับเจ้าหน้าที่)

## 2026-06-29
- **แก้สูตรค่าดำเนินการให้ตรงแก่นโครงการ: จากเดิม 100 บาท/รายการ (คงที่) → 5% ของยอดร่วมบุญ (เจ้าภาพได้สุทธิ 95%)**
- เพิ่มสูตรกลาง `lib/fee.ts` (`FEE_RATE = 0.05`, `systemFee()`, `netToHost()`) — รับประกัน fee + net = total
- แก้ทุกจุดให้ import จาก `@/lib/fee` แทน hardcode: host summary, HostDashboardClient, center memorial page, transfers, report, admin/hosts
- ปรับ label UI ทุกจุดจาก "(N ราย × 100 ฿)" → "(5% ของยอดร่วมบุญ)" และอัปเดต CLAUDE.md + docs/brain/04

## 2026-06-29
- **ปรับอัตราค่าดำเนินการ: 5% → 10% ของยอดร่วมบุญ (เข้าศูนย์ 10% / เจ้าภาพได้สุทธิ 90%)**
- แก้ที่สูตรกลาง `lib/fee.ts` (`FEE_RATE = 0.1`) จุดเดียว — ทุกหน้าอัปเดตตาม
- ปรับ label UI ที่ hardcode (host summary, HostDashboardClient, admin/hosts) + อัปเดตเอกสารทั้งหมด (CLAUDE.md, docs/brain, database.md, เอกสารสรุป, ตัวอย่างตัวเลข)

## 2026-06-29
### แก้บั๊ก "แนบสลิปแล้วไม่สำเร็จ" + ใช้ชนิดไฟล์เป็นด่านตรวจว่าเป็นสลิปจริง
- **ที่มา:** สลิปโอนเงินจริงจากแอปธนาคาร (บันทึก/แชร์/แคปหน้าจอ) เป็นรูป **JPG หรือ PNG เสมอ** — ถ้าไฟล์ไม่ใช่ 2 แบบนี้ ถือว่าไม่น่าใช่สลิปจริง
- **บั๊กเดิม:** `ALLOWED_SLIP_TYPES` รับ webp/pdf ด้วย และไฟล์ HEIC จาก iPhone ที่ `compressImage` decode ไม่ได้ (Android/เดสก์ท็อป) จะถูกอัปทั้งดิบ → API ตอบ 415 พร้อมข้อความรวมๆ "อัปโหลดไม่สำเร็จ" ทำให้ผู้ใช้ลองซ้ำเท่าไรก็ไม่ผ่าน
- **แก้:** `app/api/upload-slip/route.ts` + `app/api/donations/route.ts` → จำกัด `ALLOWED_SLIP_TYPES = {image/jpeg, image/png}` (ตอบ 415 พร้อม flag `not_a_slip`)
- **ฝั่งหน้าเว็บ** `components/PaymentPageClient.tsx`: ตรวจชนิดไฟล์ทันทีหลังเลือก (หลัง compressImage แปลง HEIC→JPEG ให้แล้ว) ถ้าไม่ใช่ JPG/PNG แจ้ง "ไฟล์นี้ไม่ใช่รูปสลิป..." เลยไม่ต้องรอ submit + แยกข้อความ error กรณี 415 ให้ชัด

## 2026-06-29
### เวิร์คโฟลว์เงินใหม่: เงินเข้าบัญชีเจ้าภาพโดยตรง + กรอกบัญชี/ยืนยัน OTP ตอนเปิดงาน
- **เปลี่ยนแก่นเรื่องเงิน:** เงินผู้ร่วมบุญไม่ผ่านศูนย์อีกต่อไป — เข้า **บัญชีเจ้าภาพโดยตรง** · QR พร้อมเพย์หน้าโอนสร้างจาก `memorial.host_phone` ที่ **ยืนยัน OTP แล้ว** (`host_phone_verified`) เท่านั้น (`app/[slug]/payment/page.tsx`)
- **ค่าดำเนินการ 10% เก็บคืนจากเจ้าภาพวันคืนบอร์ด** (เดิมหักก่อนโอน) — หน้า `transfers` เปลี่ยนเป็น "เก็บค่าดำเนินการ / คืนบอร์ด", `TransferConfirmButton` = "เก็บค่าดำเนินการคืน + รับคืนบอร์ดแล้ว", KPI เปลี่ยนเป็น "ค่าดำเนินการค้างรับ"
- **ฟอร์มเปิดงาน (`CreateMemorialClient.tsx`)** เพิ่ม: ช่องบัญชีรับเงินเจ้าภาพ (ธนาคาร/เลขบัญชี/ชื่อบัญชี — บังคับ) + กล่องยืนยันเบอร์เจ้าภาพด้วย OTP (ส่งรหัส/กรอกรหัส 6 หลัก) · บล็อกปุ่มเปิดงานจนกว่าจะยืนยันเบอร์สำเร็จ
- **OTP ก่อนเปิดงาน** (ยังไม่มี memorial → ผูก center_id+phone): ตาราง `host_otp_requests` (migration `20260629000000`), API `/api/host-otp/send` + `/verify` (center auth), util `lib/otp.ts` (+ `OTP_VERIFY_WINDOW_MS` 30 นาที) · `create` API เช็กแถวที่ verified ภายในกรอบเวลา → ตั้ง `host_phone_verified` + normalize เบอร์ก่อนเก็บ
- หน้าจัดการงาน `memorial/[memId]` ฝัง `HostPhoneVerify` (ยืนยันเบอร์ซ้ำ post-create) + ปรับถ้อยคำการเงินเป็น "เงินเข้าบัญชีเจ้าภาพโดยตรง · ค่าดำเนินการเก็บคืนวันคืนบอร์ด"
- ⚠️ **OTP ยัง MOCK** — ส่ง `devCode` กลับมาโชว์บนจอ ยังไม่ส่ง SMS จริง (เมื่อมี SMS provider เพิ่ม `sendSms()` แล้วลบ devCode)
- ⚠️ **ต้องรัน migration `20260629000000_add_host_phone_otp.sql` ใน Supabase ก่อนใช้งาน** (สร้างตาราง host_otp_requests + เพิ่มคอลัมน์ memorials)

## 2026-06-29
### แดชบอร์ด อปท. (PR1 — backend/สิทธิ์): เพิ่ม role `lgo_observer` read-only
- เพิ่ม role **`lgo_observer` = "อปท. (ผู้กำกับดูแล)"** ใน enum `app_user_role` (migration `20260629010000_add_lgo_observer_role.sql`) + `lib/supabase/types.ts`
- `lib/iam-utils.ts`: เพิ่ม role + `roleLabel` + helper `isLgoObserver()` / `canExportReports()` · `canEditCenterWork`/`canManageCenter*` คืน false สำหรับ อปท. (อยู่แล้ว)
- **ออกบัญชี อปท. ได้:** เพิ่ม `lgo_observer` ใน `VALID_ROLES` (`/api/admin/users`) + dropdown `CreateCenterUserForm` + ปุ่มอนุมัติคำขอใน `admin/users` → แอดมินสร้างบัญชี อปท. ผูกศูนย์ในเขตได้
- **กั้น PII (read-only):** หน้า home / operations / transfers / memorial detail → ถ้า role = อปท. `redirect` ไปหน้า `report` (create/edit ถูกกั้นด้วย `canEditCenterWork` อยู่แล้ว) · อปท. เห็น report + active/closed lists เท่านั้นใน PR1
- ⚠️ **ต้องรัน migration `20260629010000` ก่อน** (เพิ่มค่า enum) · ⏳ PR ถัดไป: หน้า `/oversight` (บ้าน อปท.) + `compliance` ติดตามรายงานศูนย์ + export สำหรับ LPA/ITA/จังหวัดสะอาด

### แดชบอร์ด อปท. (PR2 — หน้า /oversight)
- เพิ่มหน้า **`/dashboard/center/[id]/oversight`** = บ้านของ อปท. (read-only, ไม่มี PII): หัวศูนย์/พื้นที่ + แถบโปร่งใส (เงินเข้าเจ้าภาพตรง ไม่ผ่าน อปท.) + KPI สะสม (งาน/ผู้ร่วมบุญ/ยอดร่วมบุญ/ถึงเจ้าภาพ/ค่าดำเนินการ/ลดขยะ) + สรุป 4 มิติปีปัจจุบัน (ผู้บริหาร/การเงินโปร่งใส/สิ่งแวดล้อม/สวัสดิการ) + ปุ่มไปรายงาน(export PDF/CSV) + ลิงก์รายการงาน + logout
- aggregate per-memorial เหมือนหน้า report (confirmed donations, `systemFee`, ลดขยะ 2 กก./พวง) — query เฉพาะ count/sum **ไม่ดึง host_bank/phone/donor_name/เอกสาร**
- เปลี่ยนปลายทาง redirect ของ อปท. จาก `report` → `oversight` ทั้ง 4 หน้า (home/operations/transfers/memorial detail) → อปท. login แล้วเด้งเข้า /oversight อัตโนมัติ

### แดชบอร์ด อปท. (PR3 — compliance ติดตามการส่งรายงาน)
- ตารางใหม่ `center_report_submissions` (migration `20260629020000`) — บันทึกว่าศูนย์ส่งรายงานงวดไหนให้ อปท. แล้ว · UNIQUE(center_id, period_type, period_key)
- API `POST /api/centers/[id]/report-submissions` — ศูนย์ (canEditCenterWork) ทำเครื่องหมาย/ยกเลิก · อปท. เปลี่ยนไม่ได้
- หน้า report: เพิ่ม `ReportSubmissionControl` — ศูนย์กด "ทำเครื่องหมายว่าส่งให้ อปท. แล้ว" ของงวดที่เลือก (อปท. เห็นสถานะอย่างเดียว)
- หน้าใหม่ **`/compliance`**: อปท. ดูสถานะส่งรายงาน 12 เดือนล่าสุด + รายปี (ส่งแล้ว/ยังไม่ส่ง/ไม่มีงาน) + KPI สรุป + ลิงก์ไป report · เพิ่มลิงก์เข้า compliance บนหน้า oversight

### ลดระดับสิทธิ์เหลือ 2 (แอดมินกลางเป็นผู้ออกรหัสเข้าศูนย์)
- เหลือ 2 สิทธิ์ที่ออกให้ศูนย์: **สิทธิ์แก้ไข = `center_manager` ("แอดมินศูนย์")** ผู้ปฏิบัติงาน · **สิทธิ์ดู = `lgo_observer` ("ตัวแทน อปท. ประจำศูนย์")** read-only
- `canEditCenterWork` = `super_admin | center_manager` เท่านั้น (เอา `center_staff` ออก) · `center_staff`/`center_viewer` ยกเลิกการออกใหม่ (คงใน enum เพื่อ backward-compat)
- `/api/admin/users` `VALID_ROLES` เหลือ 2 · ฟอร์มสร้างผู้ใช้ + dropdown อนุมัติคำขอ เหลือ 2 ตัวเลือก + คำอธิบายสิทธิ์ + ปุ่มคัดลอกล็อกอินส่งให้ผู้รับ
- เมนูแอดมิน "ผู้ใช้" → **"สร้างรหัสเข้าศูนย์"** · self-signup (`/api/center/register`) ขอสิทธิ์เป็น `center_manager`
- **ล็อกอินศูนย์เปลี่ยนเป็นเบอร์มือถือ + รหัสผ่าน** (`CenterLoginClient`) แทนอีเมล · ปรับ label/ถ้อยคำ (roleLabel, system-health) ให้ตรงโมเดลใหม่
- ⚠️ **ต้องรัน migration `20260629020000` ก่อน** · ⏳ ที่เหลือ: เทมเพลต export LPA/ITA/จังหวัดสะอาด + มุมรวมหลายศูนย์ (defer)

## 2026-06-30 — แก้บั๊กเจนภาพ AI มอบหรีดล้มเหลว (จำลองมอบหรีด)
- **สาเหตุหลัก:** รูปผู้มอบอัปโหลดเข้า bucket `donations` (private) แต่ worker `processAiPhotoJob` ดึงรูปผ่าน **public URL** → fetch ไม่ผ่าน → job failed "โหลดรูปผู้มอบเพื่อเจนภาพไม่สำเร็จ"
- `app/api/ai-photo/jobs/route.ts`: เก็บ `reference_image_url` เป็น **storage path** (`uploadData.path`) แทน public URL
- `lib/ai-photo-jobs.ts`: เพิ่ม `fileFromDonationStorageReference` → `storage.download(path)` ผ่าน service role (อ่าน private bucket ได้) + `storagePathFromReference` รองรับ row เก่าที่เป็น URL เต็ม (backward-compat)
- `lib/compress-image.ts`: เพิ่ม `createImageBitmap` + แปลง HEIC/HEIF (`heic2any`) + `fallbackToOriginalOnDecodeError` แก้ client "The source image cannot be decoded." · `isDecodeFailure` รองรับ `DOMException` (EncodingError) ที่บางเบราว์เซอร์ไม่นับเป็น instanceof Error
- `components/ai-photo/AiPhotoSectionV2.tsx`: ใช้ `compressImage(..., fallbackToOriginalOnDecodeError: true)` ตอนแนบรูปผู้มอบ

### แก้ AI photo ภาพแตก (ต่อยอดจาก fix บน main) + ปลดลิมิตฟรี 1 ภาพ — 2026-06-30
- fix บน main (`9c751ab`) แก้ "อ่านรูปผู้มอบจาก private bucket" + decode ฝั่ง client แล้ว แต่ **ยังไม่ได้ย้ายที่เก็บภาพที่สร้าง** → ภาพยังแตก
- `lib/ai-photo-jobs.ts` `uploadGeneratedImage`: ย้ายที่เก็บภาพที่สร้าง `donations` (private) → **`memorials` (public)** + ถอด data URL (base64) ตรง ๆ แทน `fetch(dataUrl)` + กันไฟล์ 0 ไบต์ (รูปอ้างอิงยังอ่านจาก donations ผ่าน service role ตามเดิมของ main)
- ถอดระบบจำกัด "ฟรี 1 ภาพ/รายการ" ออกทั้งระบบ: เอา credit check (429) ออกจาก `auth-token`/`generate` · เลิกเขียน `ai_photo_credits` ใน `generate`/`save`/`ai-photo-jobs` · `jobs` คืนงานเดิมเฉพาะ pending/processing · client ลบ UI/ข้อความ credit + ปุ่มเป็น "สร้างภาพใหม่อีกครั้ง"
- ลบไฟล์ตาย `components/ai-photo/AiPhotoSection.tsx` + `app/api/ai-photo/credits/route.ts`

### หน้า AI photo: เจนสำเร็จแล้วโชว์เฉพาะรูป — ซ่อนฟอร์มทั้งหมด — 2026-06-30
- เมื่อ `images.length > 0` (เจนสำเร็จ) `AiPhotoSectionV2` early-return เป็นมุมมองสะอาด: หัวข้อ "ภาพที่ระลึก" + `AiPhotoResult` (รูป + ปุ่มบันทึก/แชร์) เท่านั้น
- ซ่อน: กรอบแนบรูปผู้มอบ, ตัวเลือกเพศ/ช่วงอายุ, consent, ปุ่มสร้างภาพ, กล่องสถานะ activeJob, ข้อความ processing
- เมนู E-Card + เมนูหลักด้านบน อยู่นอก component (ECardClient) จึงคงอยู่ครบตามต้องการ
- ลบบล็อก Result เดิมท้ายฟอร์ม (กลายเป็น dead code เพราะ early-return)

### ศูนย์แก้ไขบัญชีรับเงินเจ้าภาพภายหลังได้ — ต้องยืนยัน OTP ทุกครั้ง — 2026-06-30
- เดิม: ตอนเปิดงานกรอกบัญชี + ยืนยัน OTP ได้ (มีแล้ว) แต่ **หน้าแก้ไขงานของศูนย์ไม่มีช่องแก้บัญชี** → ศูนย์เปลี่ยนเลขบัญชีที่โชว์หน้าโอนไม่ได้
- `HostPhoneVerify` (หน้าจัดการงาน → การเงิน): เพิ่มช่องแก้ ชื่อธนาคาร/เลขบัญชี/ชื่อบัญชี + เบอร์เจ้าภาพ · มี badge "แก้ไขแล้ว — ต้องยืนยัน OTP" เมื่อค่าเปลี่ยน
- `/api/memorials/[id]/otp/verify`: รับ host_bank_name/account_number/account_name แล้ว **commit พร้อมตอนยืนยัน OTP สำเร็จ** (ตั้ง host_phone_verified=true ไปด้วย) → แก้บัญชี/เบอร์ต้องผ่าน OTP ทุกครั้ง (ตามนโยบายเรื่องเงิน)
- หน้าจัดการงาน: ผู้มีสิทธิ์แก้ → ใช้ฟอร์ม OTP แก้บัญชีได้ · สิทธิ์ดูอย่างเดียว (อปท.) → เห็นบัญชีแบบอ่านอย่างเดียวเหมือนเดิม

### ต่อ SMS OTP จริงผ่าน ThaiBulkSMS — 2026-06-30
- เพิ่ม `lib/sms.ts`: `sendSms()` / `sendOtpSms()` ยิง ThaiBulkSMS API v2 (POST https://api-v2.thaibulksms.com/sms, Basic auth, form params msisdn/message/sender/sms_type) + `isSmsConfigured()`
- wire เข้า `/api/host-otp/send` (ก่อนเปิดงาน) และ `/api/memorials/[id]/otp/send` (post-create/แก้บัญชี):
  - ตั้ง env `THAIBULKSMS_API_KEY` + `THAIBULKSMS_API_SECRET` + `THAIBULKSMS_SENDER` ครบ → ส่ง SMS จริง, ไม่คืน devCode · ส่งไม่สำเร็จตอบ 502 พร้อม error
  - ไม่ตั้ง → fallback โหมดทดสอบเดิม (คืน devCode โชว์บนจอ + log) ไม่พัง
- UI ไม่ต้องแก้ — กล่อง "โหมดทดสอบ" ผูกกับ devCode อยู่แล้ว (โหมดจริงไม่มี devCode → กล่องไม่ขึ้น)
- เอกสาร: เพิ่ม env ใน CLAUDE.md + ปรับ note OTP จาก MOCK → ส่งจริงผ่าน ThaiBulkSMS

### คู่มือ + .env.example สำหรับเปิดใช้ SMS OTP — 2026-06-30
- เพิ่ม `docs/setup-sms-otp.md` — ขั้นตอนสมัคร ThaiBulkSMS → เติมเครดิต → จดทะเบียน Sender → เอา key → ใส่ Vercel env (พร้อมวิธีทดสอบ/แก้ปัญหา)
- เพิ่มตัวแปร `THAIBULKSMS_API_KEY/SECRET/SENDER` ใน `.env.local.example`

### หน้าโอนเงิน: เพิ่มข้อความแนะนำหลังโอนเสร็จ — 2026-06-30
- ใต้ "เปิดแอปธนาคารเพื่อโอนเงิน" เพิ่มบรรทัด "โอนเสร็จ กดย้อนกลับออกจากแอพธนาคาร กลับมาหน้านี้อัตโนมัติ" (PaymentPageClient)

### AI photo: เปลี่ยนกล่องสถานะเป็น "ลิงก์รับรูปภายหลัง" — 2026-06-30
- ลบกล่องเขียว "เริ่มสร้างภาพบนระบบแล้ว / หน้านี้จะอัปเดตอัตโนมัติ" ออก
- ระหว่างเจน (pending/processing) แสดงการ์ดลิงก์ `activeJob.jobUrl` + ปุ่ม "แชร์ลิงก์รับรูป" (navigator.share) และ "คัดลอกลิงก์" → ผู้ใช้แชร์ลิงก์ไปแชท แล้วกดเข้าทีหลังที่หน้า /ai-photo/jobs/[id] เพื่อรับรูปที่เจนเสร็จ (เจนใช้เวลา 30–90 วิ ไม่ต้องเปิดหน้าค้าง)

### หน้าโอนเงิน: แสดงทั้งเลขพร้อมเพย์ + เลขบัญชี พร้อมปุ่มคัดลอกแยกกัน — 2026-06-30
- เดิมหน้าโอนแสดงเลขบัญชีเฉพาะตอนไม่มีพร้อมเพย์ (either/or) → เปลี่ยนเป็น **แสดงทั้ง 2 เลขพร้อมกัน** (เลขพร้อมเพย์ + เลขบัญชี)
- ปุ่มคัดลอกแยกกัน: "คัดลอกเลขพร้อมเพย์" และ "คัดลอกเลขบัญชี" (state ราย field)
- หลังบ้านมีช่องกรอกครบทั้ง 2 อยู่แล้ว: เลขบัญชี = `host_bank_account_number` · เลขพร้อมเพย์ = เบอร์เจ้าภาพที่ยืนยัน OTP (`host_phone`) — ปรับ label ฟอร์มเปิดงานให้ชัดว่าเบอร์นี้ = เลขพร้อมเพย์

### หน้าโอนเงิน: สลับลำดับ เลขบัญชีก่อน พร้อมเพย์ท้าย — 2026-06-30
- จัดลำดับใหม่: ชื่อบัญชี → ธนาคาร → เลขบัญชี → เลขพร้อมเพย์ (เดิมพร้อมเพย์อยู่ก่อนเลขบัญชี) · ปุ่มคัดลอกเรียงตามเดียวกัน

### เพิ่มหน้านโยบายความเป็นส่วนตัว (PDPA) — 2026-06-30
- หน้าใหม่ `/privacy` (static, ไม่พึ่งระบบภายนอก) — ครอบคลุมข้อมูลที่ระบบเก็บจริง (ผู้วายชนม์/เจ้าภาพ/ผู้ร่วมบุญ/รูปใบหน้า AI), วัตถุประสงค์, การเปิดเผย (ศูนย์/อปท. เห็นแค่ยอดรวม/OpenAI-Supabase-SMS-พิมพ์ป้าย), สิทธิเจ้าของข้อมูลตาม PDPA, ความปลอดภัย, ติดต่อ
- เพิ่มลิงก์ "นโยบายความเป็นส่วนตัว" ใน `SiteFooter` (โผล่หน้าแรก + หน้างาน)
- หมายเหตุ: ผู้ให้บริการควรแก้ชื่อผู้ควบคุมข้อมูล + ช่องทางติดต่อให้ตรงหน่วยงานจริงก่อนเผยแพร่

### นโยบายความเป็นส่วนตัว: ใส่ข้อมูลผู้ควบคุมข้อมูลจริง — 2026-06-30
- ระบุผู้ควบคุมข้อมูล = บริษัท หรีดร่วมบุญ จำกัด + อปท./ศูนย์ที่เปิดใช้เป็นผู้ควบคุมข้อมูลร่วมของงานในพื้นที่ตน
- ช่องทางติดต่อจริง: อีเมล rrbzerowaste@gmail.com · โทร 096-235-4999 · ลบ caveat ฉบับเริ่มต้นออก

### แก้ระบบแจ้งเตือนเจ้าภาพที่พังอยู่ — 2026-06-30
- `lib/notify.ts`: เอา LINE Notify ออก (LINE ปิดบริการ มี.ค. 2025) + เลิกใช้ Twilio → รวมส่ง SMS ผ่าน ThaiBulkSMS (`lib/sms.ts`) เจ้าเดียวกับ OTP
- แก้ข้อความ `msgNewDonation`: เดิม "รอตรวจสลิป" (ผิด เพราะ auto-confirm) → "เข้าบัญชีเจ้าภาพโดยตรง · ป้ายชื่อกำลังพิมพ์"
- ลบ `msgDonationConfirmed` ที่ไม่ถูกใช้ (ไม่มีขั้นตอน confirm แยกแล้ว) · notifyHost best-effort no-op เมื่อยังไม่ตั้งค่า SMS

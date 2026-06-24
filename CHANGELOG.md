# CHANGELOG — หรีดร่วมบุญ

> บันทึกประวัติการแก้ไขแบบสะสม (append ต่อท้ายเรื่อยๆ ไม่ลบของเก่า)
> ใหม่สุดอยู่บนสุด · รูปแบบ: `- หัวข้อ — เหตุผล/ผลลัพธ์ (ไฟล์/commit)`
> สถานะปัจจุบันของระบบดูที่ `CLAUDE.md` · ไฟล์นี้เก็บ "ประวัติว่าเกิดอะไรขึ้นเมื่อไหร่"

---

## 2026-06-24

### แก้ปัญหา in-app browser (LINE/Facebook) บนมือถือ
- เปิดแอปธนาคารจากในแชทไม่ได้ → เริ่มจาก `intent://`+package, เอา Play Store fallback ออก, สุดท้ายใช้ custom scheme ตรงๆ (เลี่ยงการอ้อม Play Store โชว์ "อัปเดต") — `PaymentPageClient.tsx`
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

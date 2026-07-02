# โครงสร้างโปรเจค — หรีดร่วมบุญ Zero Waste

> ไม่รวม `node_modules/`, `.next/`, `.git/` · อ่านจากโครงสร้างจริง

```
rrb/
├── app/                        # Next.js App Router (หน้าเว็บ + API ทั้งหมด)
│   ├── page.tsx                # หน้าแรก: ลิสต์งานที่เปิด + บอร์ดรำลึกผู้ร่วมบุญ (DynamicVirtualBoard)
│   ├── privacy/                # นโยบายความเป็นส่วนตัว (PDPA) — static
│   ├── [slug]/                 # ★ Donor flow รายงานศพ (slug = URL งาน)
│   │   ├── page.tsx            #   [1] หน้างาน: ข้อมูลผู้วายชนม์ + กำหนดพิธี + บอร์ดป้าย
│   │   ├── payment/            #   [2] ชำระเงิน: QR พร้อมเพย์ + เลขบัญชี + อัปโหลดสลิป
│   │   ├── print-name/         #   [3] กรอกชื่อป้าย + ข้อความหลังป้าย → POST /api/donations
│   │   ├── success/            #   [4] ขอบคุณ: e-card + ภาพ AI มอบหรีด
│   │   ├── donate/             #   redirect → payment
│   │   ├── overview/           #   สรุปภาพรวมงาน
│   │   └── ecard/              #   E-Card อวยพร (standalone)
│   ├── ai-photo/jobs/[id]/     # หน้ารับรูป AI ภายหลัง (ลิงก์แชร์ได้ โพลสถานะจนเจนเสร็จ)
│   ├── ecard/ · certificate/ · mock-wreath/ · print-done/   # หน้า standalone อื่นๆ
│   ├── dashboard/
│   │   ├── host/[id]/          # แดชบอร์ดเจ้าภาพ (login ด้วย host_code) + donors/ summary/ edit/ announce/
│   │   ├── center/             # login ศูนย์ + register/
│   │   └── center/[id]/        # แดชบอร์ดศูนย์: create/ (เปิดงาน+OTP), memorial/[memId]/ (+edit),
│   │                           #   operations/ (งานวันนี้+คิวป้าย), active/ closed/ close-reports/,
│   │                           #   transfers/ (เก็บค่าดำเนินการ/คืนบอร์ด), report/ (รายงาน อปท.),
│   │                           #   oversight/ (บ้าน อปท. read-only), compliance/ (ติดตามส่งรายงาน)
│   │   └── admin/              # login แอดมินกลาง
│   │       └── (protected)/    # guard ด้วย admin_session cookie:
│   │                           #   overview/ analytics/ esg/ report/ system/ audit/ (ตัวดู audit_logs)
│   │                           #   centers/ (+new, [id]) hosts/ memorials/ (+[id]) users/ banner/ ai-prompts/
│   └── api/                    # API Routes ทั้งหมด (ดู API-ROUTES.md)
│
├── components/                 # React components
│   ├── PaymentPageClient.tsx   # หน้าโอนเงิน (QR, คัดลอกเลข, deep link ธนาคาร, อัปโหลดสลิป)
│   ├── DynamicVirtualBoard.tsx # บอร์ดรำลึกป้ายผู้ร่วมบุญ (ผู้มอบจริงก่อน+สปอนเซอร์เติม, กดดูข้อความหลังป้าย)
│   ├── HostDashboardClient.tsx # แดชบอร์ดเจ้าภาพ (แท็บเลื่อน)
│   ├── HostPhoneVerify.tsx     # ฟอร์มแก้บัญชี+เบอร์เจ้าภาพ ยืนยัน OTP (หน้าจัดการงานศูนย์)
│   ├── EditMemorialInfoForm.tsx / HostBankForm.tsx / TransferConfirmButton.tsx / NameplateActions.tsx
│   ├── PromptPayQR.tsx         # สร้าง QR พร้อมเพย์จากเบอร์ (promptpay-qr + qrcode.react)
│   ├── ForceExternalBrowser.tsx# เด้งออกจาก in-app browser (LINE/FB) ไปเบราว์เซอร์จริง
│   ├── PrinterStatusAlert.tsx  # เตือนเครื่องพิมพ์ออฟไลน์ (ศูนย์+เจ้าภาพ)
│   ├── ai-photo/               # AiPhotoSectionV2 (ฟอร์มเจนภาพ), AiPhotoResult, HostPersonPicker ฯลฯ
│   ├── admin/ · center/ · host/ · ui/   # component เฉพาะ role
│   └── ... (SiteHeader, SiteFooter, LotusIcon, ThaiAddressSelect, ThaiDateInput ฯลฯ)
│
├── lib/                        # Business logic / utilities
│   ├── supabase/               # admin.ts (service role client — ใช้ตัวนี้เสมอ), client.ts, server.ts,
│   │                           #   types.ts (generated types), schema.sql, seed.sql
│   ├── fee.ts                  # ★ สูตรค่าดำเนินการ 10% (systemFee/netToHost) — ห้าม hardcode ที่อื่น
│   ├── iam.ts / iam-utils.ts   # สิทธิ์ผู้ใช้ (getCenterAccess, canEditCenterWork, isLgoObserver ฯลฯ)
│   ├── otp.ts / sms.ts         # OTP 6 หลัก + ส่ง SMS ผ่าน ThaiBulkSMS (fallback โหมดทดสอบ)
│   ├── notify.ts               # SMS แจ้งศูนย์เมื่อป้ายพิมพ์ไม่สำเร็จ (ไม่แจ้งเจ้าภาพรายคน)
│   ├── audit.ts                # logAudit → audit_logs (best-effort)
│   ├── printnode.ts            # ส่งงานพิมพ์ป้าย (PDF) ไป PrintNode
│   ├── openai-image.ts         # เรียก OpenAI Images (generate/edit, gpt-image-1.5)
│   ├── ai-photo-jobs.ts / ai-photo-templates.ts / ai-photo-schema.ts   # ระบบเจนภาพแบบ job
│   ├── compress-image.ts       # ย่อ/แปลงรูปฝั่ง client (รองรับ HEIC→JPEG อัตโนมัติ)
│   ├── memorial.ts             # query งานศพ (getActiveMemorials, getMemorialBoardDonations ฯลฯ)
│   ├── donation-policy.ts      # ลิมิตรายวันศูนย์ + แปลง donation เป็น public shape
│   ├── center-reporting.ts / center-route.ts / center-slug.ts   # รายงานศูนย์ + slug/route helper
│   ├── host-session.ts / admin-session.ts / master-access.ts    # session helpers
│   ├── rate-limit.ts / outbox.ts / system-health.ts / site-settings.ts / site-url.ts
│   └── thai-romanize.ts / regions.ts / prayer-details.ts / browser-actions.ts
│
├── supabase/                   # SQL ฝั่ง database
│   ├── schema.sql / setup-fresh.sql          # schema เต็ม (setup-fresh = ติดตั้งใหม่ครบชุด)
│   ├── migration_*.sql                       # migrations ยุคแรก (add_columns, iam_users, ai_photo_*)
│   └── migrations/*.sql                      # migrations เรียงเวลา (ai_photo_jobs, private_slip_storage,
│                                             #   scale_foundation, host_phone_otp, lgo_observer,
│                                             #   center_report_submissions, phone_only_center_users ฯลฯ)
│
├── docs/
│   ├── brain/                  # ★ "สมองกลาง" ความรู้ธุรกิจ/แบรนด์ (แนวคิด, flow, กฎเรื่องเงิน, FAQ, glossary)
│   ├── project-context/        # เอกสารชุดนี้ (บริบทสำหรับ Claude.ai Project)
│   ├── setup-sms-otp.md        # คู่มือเปิดใช้ SMS จริง (ThaiBulkSMS)
│   └── checklist-เปิดศูนย์แรก.md
│
├── ai-service/                 # (แยกต่างหาก) microservice เจนภาพ AI — Dockerfile + index.js
│                               #   ใช้เมื่อกำหนด env AI_SERVICE_URL; ไม่ตั้ง = เรียก OpenAI ตรงจาก Next.js
├── public/                     # โลโก้ + public/data/geo/ (ข้อมูลจังหวัด/อำเภอ/ตำบลทั้งประเทศ)
├── scripts/load-donations.mjs  # สคริปต์ seed ข้อมูล donation
├── tests/donation-policy.test.ts  # เทสต์เดียวที่มี (npm run test:policy)
│
├── CLAUDE.md                   # ★ กติกาโปรเจคสำหรับ Claude Code (มีอยู่แล้ว — สถานะปัจจุบันของระบบ)
├── CHANGELOG.md                # ประวัติการแก้ไขสะสม (ห้ามลบของเก่า)
├── AGENTS.md                   # กติกาสำหรับ AI agent (donor flow ห้ามพัง, ขอบเขตแต่ละ role)
├── README.md / SYSTEM_DOCUMENTATION.md / database.md / UI_SCREEN_MASTER_CURRENT.md
├── project-status-rrb.md / PROJECT_SLIDE_BRIEF.md / ระบบสรุป-หรีดร่วมบุญ.md   # เอกสารสรุปยุคก่อน
├── next.config.ts / tsconfig.json / postcss.config.mjs / vercel.json
└── .env.local.example          # ตัวอย่าง env ทั้งหมด (Supabase, OpenAI, PrintNode, ThaiBulkSMS ฯลฯ)
```

## จุดที่ต้องรู้เมื่อแก้โค้ด

- **Donor flow (`app/[slug]/*`) ห้ามพัง** — เป็นเส้นทางเงินจริง (ดู AGENTS.md)
- Supabase ใช้ `createAdminClient()` จาก `lib/supabase/admin.ts` เสมอ (service role)
- ตารางที่ยังไม่อยู่ใน generated types ให้ cast `(supabase.from("...") as any)` ตามแพทเทิร์นเดิมใน repo
- ก่อน push ต้อง `npx tsc --noEmit` ผ่าน + เพิ่มบันทึกใน `CHANGELOG.md` + อัปเดต `CLAUDE.md` ถ้าโครงสร้าง/flow เปลี่ยน

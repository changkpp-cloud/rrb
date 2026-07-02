# API Routes — หรีดร่วมบุญ Zero Waste

> รวบรวมจาก `app/api/**/route.ts` จริงทั้งหมด (~48 endpoints)
> "ใครเรียก" อ้างอิงการตรวจสิทธิ์จริงในโค้ด: `admin_session` cookie / `getCenterAccess()+canEditCenterWork()` / host_code / public

## Auth & ผู้ใช้

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/admin/login` | เทียบ `ADMIN_PASSWORD` → set cookie `admin_session` (httpOnly 8 ชม.) | public |
| POST | `/api/admin/logout` | ล้าง cookie แอดมิน | admin |
| POST | `/api/center/login` | login ศูนย์แบบ legacy ด้วย center_code → cookie `center_session` | public |
| POST | `/api/center/user-login` | login ศูนย์ด้วย **เบอร์มือถือ + รหัสผ่าน** (app_users + center_memberships) | public |
| POST | `/api/center/logout` | ออกจากระบบศูนย์ | center |
| POST | `/api/center/register` | self-signup ขอสิทธิ์ center_manager (status pending รอแอดมินอนุมัติ) | public |
| POST | `/api/center/change-password` | เปลี่ยนรหัสผ่านผู้ใช้ศูนย์ | center |
| POST | `/api/admin/users` | แอดมินกลางออก "รหัสเข้าศูนย์" (สร้าง app_user + membership; VALID_ROLES = center_manager, lgo_observer) | admin |
| GET | `/api/memorial/host?code=` | Host login ด้วย host_code → คืนข้อมูลงาน | public (รู้รหัส) |

## ศูนย์ & งานศพ

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/centers` | สร้างศูนย์ใหม่ | admin |
| PATCH/DELETE | `/api/centers/[id]` | แก้ไข/ลบศูนย์ | admin/center ตามสิทธิ์ |
| POST | `/api/centers/[id]/upload-qr` | อัปโหลดรูป QR บัญชีของศูนย์ (เก็บใน bucket memorials) | center |
| POST | `/api/centers/[id]/report-submissions` | ทำเครื่องหมาย/ยกเลิก "ส่งรายงานงวดนี้ให้ อปท. แล้ว" | canEditCenterWork |
| POST | `/api/admin/centers/[id]/reset-access-code` | รีเซ็ตรหัสเข้าศูนย์ | admin |
| POST | `/api/admin/centers/[id]/purge` | ลบข้อมูลงาน+donation ทั้งศูนย์ | admin |
| POST | `/api/memorials/create` | **เปิดงานศพ** (form-data: ข้อมูลผู้วายชนม์+พิธี+บัญชีเจ้าภาพ+รูป) — เช็ก OTP ที่ยืนยันใน `host_otp_requests` → ตั้ง `host_phone_verified` · คืน slug + host_code | canEditCenterWork |
| POST | `/api/memorial` | สร้าง memorial (เส้นทางเก่า) · GET คืนงานล่าสุด · PATCH อัปเดต | ตามโค้ดเดิม |
| PATCH | `/api/memorials/[id]` | อัปเดต host bank/เอกสาร (passbook, death cert, id card) | center |
| DELETE | `/api/memorials/[id]` | ลบงาน (ต้องมี center_session หรือ admin_session) | center/admin |
| PATCH | `/api/memorials/[id]/info` | แก้ข้อมูลงาน (ชื่อ/พิธี/เจ้าภาพ) + เขียน audit_logs `edit_memorial_info` | center/host/admin |
| POST | `/api/memorials/[id]/close` | ปิดงาน → funeral_status=closed + host_expires_at (+30 วัน) + audit `close_memorial` | canEditCenterWork |
| POST | `/api/memorials/[id]/confirm-transfer` | ยืนยัน "เก็บค่าดำเนินการ/รับคืนบอร์ดแล้ว" → transfer_confirmed_at/by + audit `confirm_transfer` (ต้องปิดงานก่อน) | center |
| GET/POST | `/api/memorials/[id]/persons` (+`/[personId]`) | จัดการบุคคลฝั่งเจ้าภาพสำหรับภาพ AI | center/host |

## OTP (2 ชุด)

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/host-otp/send` | **ก่อนเปิดงาน:** ส่ง OTP ไปเบอร์เจ้าภาพ (ผูก center_id+phone ใน host_otp_requests) · ส่ง SMS จริงผ่าน ThaiBulkSMS ถ้าตั้ง env ครบ ไม่งั้นคืน `devCode` โชว์บนจอ | canEditCenterWork |
| POST | `/api/host-otp/verify` | ยืนยัน OTP → mark verified_at (ใช้เปิดงานได้ภายใน 30 นาที) | canEditCenterWork |
| POST | `/api/memorials/[id]/otp/send` | **หลังเปิดงาน:** ส่ง OTP ยืนยันเบอร์ซ้ำ/แก้เบอร์ (เก็บ code ใน memorials) | canEditCenterWork |
| POST | `/api/memorials/[id]/otp/verify` | ยืนยัน OTP → host_phone_verified=true + **commit บัญชีใหม่** (host_bank_*) พร้อมกัน + audit `verify_host_bank` — แก้บัญชี/เบอร์ต้องผ่าน OTP ทุกครั้ง | canEditCenterWork |

## Donation flow (ผู้ร่วมบุญ)

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/upload-slip` | อัปโหลดสลิป (รับเฉพาะ JPG/PNG ตอบ 415 ถ้าไม่ใช่) → private path + slip_hash + ตรวจซ้ำ | public |
| POST | `/api/donations` | **สร้าง donation** (JSON: memorial_id, donor_name, donor_title, message, amount, slip_url/hash) → status=`confirmed` ทันที (auto-confirm) + ยิงพิมพ์ป้ายเบื้องหลัง (after) + SMS แจ้งศูนย์ถ้าพิมพ์ล้ม · มีลิมิตรายวันต่อศูนย์ (CENTER_DAILY_DONATION_LIMIT ตอบ 429) | public |
| GET | `/api/donations?memorial_id=` | ลิสต์ donation (public shape) | public/center |
| PATCH | `/api/donations/[id]` | เปลี่ยน status/แก้ไข (มี center auth — ไม่มี UI เรียกแล้ว) | center |
| POST | `/api/donations/[id]/nameplate` | สั่ง "พิมพ์ซ้ำ" ป้ายที่ error | center |
| GET | `/api/donations/[id]/slip` | ดูสลิป (คืน signed URL อายุ 60 วิ) | center/host ที่มีสิทธิ์ |
| POST | `/api/print-nameplate` | สร้าง PDF ป้าย + ส่ง PrintNode + อัปเดต nameplate_status | ระบบ/ศูนย์ |
| GET | `/api/printer-status?memorialId=` | สถานะเครื่องพิมพ์ (PrintNode online/offline) + จำนวนป้าย error | center + host |

## AI Photo (จำลองมอบหรีด)

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/ai-photo/jobs` | สร้าง job เจนภาพ (form-data: รูปผู้มอบ + ข้อมูล) → ตอบ jobId/jobUrl ทันที ประมวลผลเบื้องหลัง (`processAiPhotoJob`) · คืน job เดิมเฉพาะที่ pending/processing (กันยิงซ้ำ — **ไม่จำกัดจำนวนภาพแล้ว**) | public |
| GET | `/api/ai-photo/jobs/[id]` | โพลสถานะ job + imageUrl เมื่อเสร็จ (หน้า `/ai-photo/jobs/[id]` ใช้) | public |
| POST | `/api/ai-photo/auth-token` | ออก token + build prompt สำหรับเส้นทางเจนตรง (rate-limit 5 ครั้ง/IP/10 นาที) | public |
| POST | `/api/ai-photo/service/generate` | เจนภาพ local (เรียก OpenAI ตรง; ใช้เมื่อไม่มี AI_SERVICE_URL ภายนอก) | ผ่าน token |
| POST | `/api/ai-photo/generate` | เจนภาพแบบ sync เส้นทางเก่า | public |
| POST | `/api/ai-photo/save` | บันทึกผลภาพลง ai_photo_requests (fire-and-forget) | public |
| POST | `/api/generate-wreath` | เจนภาพพื้นหลังหรีด (OpenAI) — ต้องมี OPENAI_API_KEY | public |

## อื่นๆ / ระบบ

| Method | Path | ทำอะไร | ใครเรียก |
|---|---|---|---|
| POST | `/api/upload-ecard` | อัปโหลดภาพ e-card (คืน signed URL 1 ชม.) | public |
| GET | `/api/download?url=` | proxy ดาวน์โหลดไฟล์ | public |
| POST | `/api/webhooks/payment` | webhook ยืนยันการชำระจาก provider (ตรวจ HMAC `PAYMENT_WEBHOOK_SECRET` → RPC `confirm_donation`) — **เตรียมไว้ ยังไม่ต่อ provider จริง** | provider |
| GET/POST | `/api/worker` | ประมวลผล outbox_jobs (Vercel cron, Authorization: Bearer CRON_SECRET) | cron |
| GET | `/api/cron/refresh-stats` | refresh ceremony_stats/tenant_stats | cron |
| GET | `/api/system/health` · `/api/admin/system-health` | health check / system report | public / admin |
| GET | `/api/admin/export` | export ข้อมูล (memorials + donations สูงสุด 5000 แถว) | admin |
| POST | `/api/admin/site-settings/board` | ตั้งรูป/แคปชันบอร์ดหน้าแรก (site_settings) | admin |

## แพทเทิร์นสำคัญ

- **Response error** ทุก route เป็น `{ error: string }` พร้อม status code เหมาะสม (400/401/403/404/409/415/429/500/502/503)
- Route ที่ทำงานหนักเบื้องหลังใช้ `after()` ของ Next.js (พิมพ์ป้าย, แจ้งเตือน) — ตอบผู้ใช้ก่อน
- `maxDuration = 300` กำหนดใน route ที่เรียก OpenAI (ai-photo/jobs, generate, service/generate)
- การกระทำเรื่องเงินเขียน `audit_logs` ผ่าน `logAudit()` (`lib/audit.ts`) แบบ best-effort

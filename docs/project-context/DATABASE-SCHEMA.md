# Database Schema — หรีดร่วมบุญ Zero Waste (Supabase PostgreSQL)

> สรุปจาก `lib/supabase/schema.sql` + `supabase/migration_*.sql` + `supabase/migrations/*.sql` (ไฟล์จริง)
> การเข้าถึงจากแอพใช้ **service role** (`createAdminClient()`) เป็นหลัก → bypass RLS

## ตารางหลัก

### `centers` — ศูนย์บริหารหรีดร่วมบุญ (สร้างโดย Super Admin)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | text | ชื่อเต็มศูนย์ |
| center_code | text UNIQUE | รหัสศูนย์ (จาก migration_add_columns) เช่น CTR-KPP-001 |
| official_lgo_code | text | รหัส อปท. มาตรฐาน (ใช้เป็น prefix slug งาน) |
| municipality / tambon / amphoe / province | text | ที่ตั้ง |
| manager_name | text | ผู้จัดการศูนย์ |
| phone | text | เบอร์ศูนย์ (ใช้รับ SMS แจ้งป้ายพิมพ์ไม่สำเร็จ) |
| status | text | `active` \| `inactive` |
| created_at | timestamptz | |

### `memorials` — งานศพแต่ละงาน (FK → centers)
| กลุ่มคอลัมน์ | รายละเอียด |
|---|---|
| ตัวตน | id (uuid PK), slug (UNIQUE — URL งาน), event_code (UNIQUE), center_id (FK→centers, SET NULL) |
| ผู้วายชนม์ | name, birth_date, death_date, age, photo_url |
| พิธี | ceremony_date (NOT NULL), ceremony_time, ceremony_location, ceremony_hall, prayer_date, prayer_location (เก็บ prayer details แบบ serialize) |
| ที่ตั้งงาน (รหัสกรมการปกครอง) | ceremony_province_code/name, ceremony_district_code/name, ceremony_subdistrict_code/name, ceremony_postal_code |
| เจ้าภาพ | host_name, host_phone (normalize เลขล้วน), host_code (UNIQUE — ใช้ login), host_relationship |
| ยืนยันเบอร์/OTP | **host_phone_verified** (bool — ต้อง true ถึงโชว์ QR พร้อมเพย์), host_otp_code, host_otp_expires_at |
| บัญชีเจ้าภาพ (เงินเข้าตรงนี้) | **host_bank_name, host_bank_account_number, host_bank_account_name** (+ host_bank_passbook_url ถ้ามี) |
| บัญชีมูลนิธิ (legacy/fallback) | bank_name, bank_account_number, bank_account_name, bank_account_image_url (QR รูป) |
| เอกสารยืนยัน | death_certificate_url, host_id_card_url, host_verified (bool) |
| สถานะ | **funeral_status**: `draft` \| `active` \| `closed` · is_active (bool legacy) · host_expires_at (host หมดสิทธิ์ 30 วันหลังปิด) |
| การเงินปิดงาน | transfer_confirmed_at, transfer_confirmed_by (= ยืนยันเก็บค่าดำเนินการ/รับคืนบอร์ดแล้ว) |
| พิมพ์ป้าย | printer_id (PrintNode printer ของงาน) |

### `donations` — การร่วมบุญ (FK → memorials CASCADE)
| คอลัมน์ | หมายเหตุ |
|---|---|
| id (uuid PK), memorial_id (FK), center_id | |
| donor_name (NOT NULL), donor_title | ชื่อ + ตำแหน่ง/คำนำหน้า (หน้าป้าย) |
| message | ข้อความอาลัย/กำลังใจ (**หลังป้าย** — แสดงบนบอร์ดรำลึก) |
| amount numeric(10,2) | ยอดเงิน (ผู้ร่วมบุญกรอกเอง — ยังไม่มีตรวจสลิปจริง) |
| slip_url, slip_hash, slip_duplicate_warning | สลิป (private path) + hash กันซ้ำ (เตือนย้อนหลัง ไม่บล็อก) |
| **status** | `pending` \| `confirmed` \| `rejected` — flow ปัจจุบัน **auto-confirm** (สร้างเป็น confirmed ทันที) + confirmed_at |
| **nameplate_status** | `pending` \| `queued` \| `printed` \| `posted` (+ ในโค้ดใช้ `error` เมื่อพิมพ์ล้ม) — `queued` = ส่งพิมพ์แล้วถือว่าจบ |

### `nameplates` / `print_jobs` — ป้ายชื่อ + งานพิมพ์
- `nameplates`: donation_id (FK SET NULL), memorial_id (FK CASCADE), donor_name, donor_title, message, pdf_url, **print_status** (`pending|queued|printing|printed|error|reprint`), **board_status** (`pending|posted`), print_job_id
- `print_jobs`: nameplate_id (FK CASCADE), printer_id, **status** (`queued|printing|printed|error`), queued_at, printed_at, printed_by, error_message

### `payments` — บันทึกการชำระผ่าน provider (เตรียมไว้ ยังไม่ต่อ gateway จริง)
donation_id (FK CASCADE), provider + provider_ref (UNIQUE คู่ — idempotent), amount, status (default `completed`), metadata jsonb · ใช้โดย RPC `confirm_donation` ที่เรียกจาก `/api/webhooks/payment`

## ตาราง IAM (ผู้ใช้ระบบศูนย์)

### enums
- `app_user_role`: `super_admin` | `center_manager` | `center_staff`* | `center_viewer`* | `lgo_observer` (*ยกเลิกการออกใหม่ คงไว้ backward-compat · lgo_observer เพิ่มโดย migration 20260629010000)
- `app_user_status`: `pending` | `active` | `suspended` | `rejected`
- `auth_provider`: `password` | `email` | `line` | `facebook` | `google` (ใช้จริงเฉพาะ password)

### ตาราง
- `app_users`: id, email (UNIQUE), display_name, phone (ใช้ login แบบเบอร์+รหัสผ่าน), auth_provider, password_hash, global_role, status, approved_by/at, last_login_at
- `center_memberships`: center_id + user_id (UNIQUE คู่) + role — ผูกผู้ใช้เข้าศูนย์
- `center_user_requests`: คำขอสมัครเข้าศูนย์ (รอแอดมินอนุมัติ)
- `app_user_sessions`: user_id, token_hash (UNIQUE) — session ล็อกอินศูนย์

## ตารางเสริม

| ตาราง | หน้าที่ | คอลัมน์สำคัญ |
|---|---|---|
| `host_otp_requests` | OTP ยืนยันเบอร์เจ้าภาพ **ก่อนเปิดงาน** (ยังไม่มี memorial) | center_id (FK), phone, code, expires_at, verified_at |
| `ai_photo_requests` | job เจนภาพ AI มอบหรีด | donation_id/memorial_id (text), template_key, final_prompt, reference_image_url, generated_image_url, **status** (`pending|processing|completed|failed`), error_message |
| `ai_photo_credits` | โควตาเจนภาพ (donation_id UNIQUE, free_quota, used_count) — **เลิกใช้แล้ว** (ปลดลิมิต) ตารางคงอยู่แต่โค้ดไม่อ่าน/เขียน |
| `ai_photo_templates` | prompt template ภาพ AI (template_key UNIQUE, prompt_template, negative_prompt, is_active) — แก้ได้ที่ /dashboard/admin/ai-prompts |
| `memorial_persons` | บุคคลฝั่งเจ้าภาพสำหรับภาพ AI | memorial_id (FK), display_name, relationship, role_in_photo, photo_url, allow_in_sim, is_primary, sort_order |
| `slip_submissions` | ประวัติสลิป + ตรวจซ้ำ | memorial_id (FK), slip_hash, duplicate_detected, duplicate_of (self FK), review_status (`none|needs_review|reviewed|ignored`) |
| `audit_logs` | บันทึกกิจกรรมเรื่องเงิน | user_id, action (`verify_host_bank`/`close_memorial`/`confirm_transfer`/`edit_memorial_info`), table_name, record_id, old_value/new_value (jsonb), ip_address (+ actor_user_id, actor_role, center_id จาก iam migration) |
| `center_report_submissions` | ศูนย์ทำเครื่องหมาย "ส่งรายงานงวดนี้ให้ อปท. แล้ว" | center_id, period_type (`month|year`), period_key ('YYYY-MM'/'YYYY'), UNIQUE 3 ตัว |
| `ceremony_stats` / `tenant_stats` | สถิติ denormalized ราย memorial/center (refresh ผ่าน cron) | total/confirmed/pending/rejected donations, total_amount, wreaths_reduced |
| `outbox_jobs` | คิวงานเบื้องหลัง (status `pending|processing|completed|failed`, dedupe_key UNIQUE) — ประมวลผลโดย `/api/worker` | |
| `site_settings` | key-value ตั้งค่าเว็บ (เช่น รูป/แคปชันบอร์ดหน้าแรก) | key PK, value |
| `equipment` | อุปกรณ์ศูนย์ (board/printer/flower_box) — มี schema แต่การใช้งานใน UI จำกัด | type, status (`available|in_use|maintenance|returned`), current_memorial_id |
| `reports` | สรุปยอดปิดงาน (total, donor_count, service_fee, net, wreaths_reduced, waste_reduced_kg) | |

## ความสัมพันธ์หลัก

```
centers 1 ─── n memorials 1 ─── n donations 1 ─── n payments
   │              │                  │ 1
   │              │                  └── n ai_photo_requests (โยงด้วย donation_id เป็น text)
   │              ├── n nameplates ─── n print_jobs
   │              ├── n memorial_persons
   │              ├── n slip_submissions
   │              └── 1 ceremony_stats
   ├── n host_otp_requests
   ├── n center_memberships ─── app_users (─ app_user_sessions)
   ├── n center_report_submissions
   └── 1 tenant_stats
```

## RLS (Row Level Security)

จาก `supabase/schema.sql` — เปิด RLS เฉพาะ 2 ตาราง แบบ public พื้นฐาน:
- `memorials`: policy "Public read active memorials"
- `donations`: policy "Public read confirmed donations" + "Public insert donations"

**ในทางปฏิบัติ** ทุก query ของแอพวิ่งผ่าน API routes ด้วย service role (bypass RLS) — การควบคุมสิทธิ์จริงทำที่ชั้นแอพ (`lib/iam.ts`) ไม่ใช่ RLS

## Storage buckets
- `memorials` — **public** (รูปผู้วายชนม์, QR, แบนเนอร์, ภาพ AI ที่เจนเสร็จ, PDF ป้าย)
- `donations` — **private** ตั้งแต่ migration `20260615001000` (สลิป + รูปอ้างอิงผู้มอบสำหรับ AI) → เสิร์ฟผ่าน signed URL/service role เท่านั้น

## RPC / ฟังก์ชันฐานข้อมูล
- `confirm_donation(p_donation_id, p_provider, p_provider_ref, p_amount, p_metadata)` — ยืนยัน donation แบบ idempotent (ใช้โดย webhook payment; migration 20260616)

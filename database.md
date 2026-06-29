# Database Design — หรีดร่วมบุญ Zero Waste

> วิเคราะห์จาก feature จริงทั้งหมดในแอปพลิเคชัน ณ วันที่ 26 พฤษภาคม 2569

---

## ภาพรวม (Overview)

แอปพลิเคชัน **หรีดร่วมบุญ** เป็นระบบจัดการการมอบหรีดในงานศพแบบ Zero Waste
แทนที่ผู้ร่วมงานจะมอบหรีดดอกไม้จริง (สิ้นเปลือง) ก็โอนเงินผ่านระบบแทน
ระบบจะพิมพ์ป้ายชื่อ ติดบอร์ด อ่านชื่อในพิธี และออก E-card ขอบคุณให้ผู้มอบ

### ผู้ใช้งาน 4 ประเภท
| ประเภท | หน้าที่ | การเข้าถึง |
|--------|---------|-----------|
| **ผู้มอบหรีด (Donor)** | โอนเงิน แนบสลิป กรอกชื่อ รับ E-card | Public |
| **เจ้าภาพ (Host)** | ดูรายชื่อ สรุปยอด ดาวน์โหลด | รหัสเจ้าภาพ (host_code) |
| **ศูนย์บริหาร (Center)** | จัดการงาน อนุมัติสลิป พิมพ์ป้าย | Subdomain แยก |
| **แอดมิน (Admin)** | จัดการระบบ ศูนย์ ESG รายงาน | Subdomain แยก |

---

## ตาราง (Tables)

### 1. `centers` — ศูนย์บริหารหรีดร่วมบุญ

ศูนย์บริหารในแต่ละพื้นที่/เทศบาล รับผิดชอบงานศพในพื้นที่ของตน

```sql
CREATE TABLE centers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                          -- ชื่อศูนย์ เช่น "ศูนย์บริหารหรีดร่วมบุญ เทศบาลเมืองกำแพงเพชร"
  municipality    TEXT,                                   -- เทศบาล
  tambon          TEXT,                                   -- ตำบล
  amphoe          TEXT,                                   -- อำเภอ
  province        TEXT,                                   -- จังหวัด
  manager_name    TEXT,                                   -- ชื่อผู้จัดการศูนย์
  phone           TEXT,                                   -- เบอร์ติดต่อ
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**ความสัมพันธ์:** 1 ศูนย์ → หลายงานศพ, หลายอุปกรณ์

---

### 2. `memorials` — งานศพ (หน่วยหลักของระบบ)

1 record = 1 งานศพ ผูกกับธนาคารและเจ้าภาพ

```sql
CREATE TABLE memorials (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE,                    -- URL-friendly identifier เช่น "supaporn-2567"
  center_id               UUID REFERENCES centers(id) ON DELETE SET NULL,

  -- ข้อมูลผู้เสียชีวิต
  name                    TEXT NOT NULL,                  -- ชื่อผู้เสียชีวิต
  birth_date              DATE,                           -- วันเกิด
  death_date              DATE,                           -- วันถึงแก่กรรม
  age                     INT,                            -- อายุ (ปี)
  photo_url               TEXT,                           -- URL รูปภาพผู้เสียชีวิต

  -- ข้อมูลพิธี
  ceremony_date           DATE NOT NULL,                  -- วันฌาปนกิจ
  ceremony_time           TEXT,                           -- เวลา เช่น "16.00"
  ceremony_location       TEXT NOT NULL,                  -- วัด/สถานที่
  ceremony_hall           TEXT,                           -- ที่อยู่/ศาลา
  prayer_date             DATE,                           -- วันสวดพระอภิธรรม
  prayer_location         TEXT,                           -- สถานที่สวด

  -- ข้อมูลเจ้าภาพ
  host_name               TEXT,                           -- ชื่อเจ้าภาพ
  host_phone              TEXT,                           -- เบอร์โทรเจ้าภาพ
  host_code               TEXT UNIQUE,                    -- รหัสสำหรับ dashboard เจ้าภาพ เช่น "H3K9AB"

  -- สถานะงาน
  funeral_status          TEXT NOT NULL DEFAULT 'active'
                            CHECK (funeral_status IN ('draft','active','closed')),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,

  -- ข้อมูลธนาคาร (ชำระผ่านบัญชีนี้)
  bank_name               TEXT NOT NULL,                  -- ชื่อธนาคาร + บรรทัดที่ 2 = ชื่อมูลนิธิ
  bank_account_number     TEXT NOT NULL,                  -- เลขบัญชี
  bank_account_name       TEXT NOT NULL,                  -- ชื่อบัญชี
  bank_account_image_url  TEXT,                           -- URL รูป QR Code

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**หมายเหตุ field `bank_name`:** เก็บ 2 บรรทัดคั่นด้วย `\n`
- บรรทัด 1: ชื่อมูลนิธิ เช่น `มูลนิธิหรีดร่วมบุญ ESG Zero Waste`
- บรรทัด 2: ชื่อธนาคาร เช่น `ธนาคารกรุงไทย`

**สถานะ `funeral_status`:**
| สถานะ | ความหมาย |
|-------|----------|
| `draft` | สร้างแล้ว ยังไม่เปิดรับเงิน |
| `active` | เปิดรับเงิน/ป้ายชื่ออยู่ |
| `closed` | จบพิธีแล้ว สรุปยอด |

---

### 3. `donations` — รายการร่วมบุญ

1 record = 1 การโอนเงินของผู้มอบหรีด 1 คน/องค์กร

```sql
CREATE TABLE donations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id       UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,

  -- ข้อมูลผู้มอบ
  donor_name        TEXT NOT NULL,                        -- ชื่อ หรือ ชื่อองค์กร
  donor_title       TEXT,                                 -- ตำแหน่ง / ข้อความแสดงอาลัย
  message           TEXT,                                 -- ข้อความอาลัย (optional)

  -- การเงิน
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0,     -- จำนวนเงินที่โอน (บาท)

  -- หลักฐาน
  slip_url          TEXT,                                 -- URL สลิปการโอน (Supabase Storage)

  -- สถานะการตรวจสอบ
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','rejected')),

  -- สถานะป้ายชื่อ (denormalized จาก nameplates เพื่อ query ง่าย)
  nameplate_status  TEXT NOT NULL DEFAULT 'pending'
                      CHECK (nameplate_status IN ('pending','queued','printed','posted')),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**สถานะ `status`:**
| สถานะ | ความหมาย |
|-------|----------|
| `pending` | รอตรวจสอบสลิป |
| `confirmed` | อนุมัติแล้ว นับเงิน |
| `rejected` | ปฏิเสธ (สลิปผิด/ซ้ำ) |

**สถานะ `nameplate_status`:**
| สถานะ | ความหมาย | UI Badge |
|-------|----------|---------|
| `pending` | รอกรอกข้อมูลป้าย | สีเทา |
| `queued` | ส่งคิวพิมพ์แล้ว | สีน้ำเงิน |
| `printed` | พิมพ์ออกมาแล้ว | สีเขียว |
| `posted` | ติดบอร์ดแล้ว | สีทอง |

---

### 4. `nameplates` — ป้ายชื่อผู้มอบหรีด

ป้ายกระดาษขนาด 288×80 (ตามสัดส่วน SignPreview) ที่พิมพ์ติดบอร์ดในพิธี

```sql
CREATE TABLE nameplates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id     UUID REFERENCES donations(id) ON DELETE SET NULL,
  memorial_id     UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,

  -- ข้อมูลบนป้าย
  donor_name      TEXT NOT NULL,
  donor_title     TEXT,
  message         TEXT,

  -- ไฟล์พิมพ์
  pdf_url         TEXT,                                   -- URL PDF สำหรับส่งเครื่องพิมพ์

  -- สถานะการพิมพ์
  print_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (print_status IN ('pending','queued','printing','printed','error','reprint')),
  board_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (board_status IN ('pending','posted')),

  print_job_id    UUID REFERENCES print_jobs(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 5. `print_jobs` — คิวการพิมพ์

จัดการคิวส่งงานพิมพ์ไปยังเครื่องพิมพ์ในศูนย์บริหาร

```sql
CREATE TABLE print_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nameplate_id    UUID NOT NULL REFERENCES nameplates(id) ON DELETE CASCADE,
  printer_id      TEXT,                                   -- รหัสเครื่องพิมพ์ปลายทาง

  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','printing','printed','error')),

  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at      TIMESTAMPTZ,
  printed_by      TEXT,                                   -- ชื่อเจ้าหน้าที่ที่กดพิมพ์
  error_message   TEXT
);
```

---

### 6. `equipment` — อุปกรณ์

ติดตามอุปกรณ์ประจำศูนย์ (บอร์ด, เครื่องพิมพ์, กล่องดอกไม้)

```sql
CREATE TABLE equipment (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id             UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL
                          CHECK (type IN ('board','printer','flower_box','other')),
  name                  TEXT NOT NULL,                    -- เช่น "เครื่องพิมพ์ HP LaserJet 1"
  status                TEXT NOT NULL DEFAULT 'available'
                          CHECK (status IN ('available','in_use','maintenance','returned')),
  current_memorial_id   UUID REFERENCES memorials(id) ON DELETE SET NULL,
  location              TEXT,                             -- ตำแหน่งปัจจุบัน
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 7. `reports` — รายงานสรุปงานศพ

สร้างเมื่องานปิด (`funeral_status = 'closed'`) บันทึกผลลัพธ์ทั้งด้านการเงินและสิ่งแวดล้อม

```sql
CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id       UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  center_id         UUID REFERENCES centers(id) ON DELETE SET NULL,

  -- สรุปการเงิน
  total_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,     -- ยอดรวมทั้งหมด
  donor_count       INT NOT NULL DEFAULT 0,               -- จำนวนผู้ร่วมบุญ
  service_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,     -- ค่าดำเนินการ (total_amount × 10%)
  net_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,     -- ยอดสุทธิที่เจ้าภาพรับ

  -- ผลลัพธ์ด้านสิ่งแวดล้อม (Zero Waste)
  wreaths_reduced   INT NOT NULL DEFAULT 0,               -- จำนวนหรีดที่ลดได้ (= donor_count)
  waste_reduced_kg  NUMERIC(8,2) NOT NULL DEFAULT 0,      -- น้ำหนักขยะดอกไม้ที่ลดได้ (ประมาณ 5 กก./หรีด)

  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**สูตรคำนวณ:**
- `service_fee` = `ROUND(total_amount × 0.1)`
- `net_amount` = `total_amount − service_fee` (≈ 90%)
- `wreaths_reduced` = `donor_count`
- `waste_reduced_kg` = `donor_count × 5`

---

### 8. `audit_logs` — บันทึกการเปลี่ยนแปลง

ติดตามทุก action สำคัญในระบบ (อนุมัติสลิป, แก้ไขยอด, ปิดงาน)

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,                                       -- รหัสเจ้าหน้าที่ (null = ผู้ใช้ทั่วไป)
  action      TEXT NOT NULL,                              -- เช่น "confirm_donation", "close_memorial"
  table_name  TEXT,                                       -- ตารางที่ถูกแก้ไข
  record_id   TEXT,                                       -- UUID ของ record ที่ถูกแก้ไข
  old_value   JSONB,                                      -- ค่าเก่า
  new_value   JSONB,                                      -- ค่าใหม่
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## ความสัมพันธ์ (Entity Relationship)

```
centers (1)
  ├── memorials (Many)     center_id → centers.id
  └── equipment (Many)     center_id → centers.id

memorials (1)
  ├── donations (Many)     memorial_id → memorials.id CASCADE
  ├── nameplates (Many)    memorial_id → memorials.id CASCADE
  ├── reports (1)          memorial_id → memorials.id CASCADE
  └── equipment (Many)     current_memorial_id → memorials.id SET NULL

donations (1)
  └── nameplates (0..1)    donation_id → donations.id SET NULL

nameplates (1)
  └── print_jobs (1)       nameplate_id → nameplates.id CASCADE

audit_logs                 ติดตามทุกตาราง (ไม่มี FK)
```

---

## Indexes

```sql
-- memorials
CREATE INDEX idx_memorials_center_id       ON memorials(center_id);
CREATE INDEX idx_memorials_funeral_status  ON memorials(funeral_status);
CREATE INDEX idx_memorials_is_active       ON memorials(is_active);
CREATE INDEX idx_memorials_host_code       ON memorials(host_code);  -- สำหรับ login เจ้าภาพ

-- donations
CREATE INDEX idx_donations_memorial_id     ON donations(memorial_id);
CREATE INDEX idx_donations_status          ON donations(status);
CREATE INDEX idx_donations_created_at      ON donations(created_at DESC);

-- nameplates
CREATE INDEX idx_nameplates_memorial_id    ON nameplates(memorial_id);
CREATE INDEX idx_nameplates_print_status   ON nameplates(print_status);

-- print_jobs
CREATE INDEX idx_print_jobs_nameplate_id   ON print_jobs(nameplate_id);
CREATE INDEX idx_print_jobs_status         ON print_jobs(status);

-- equipment
CREATE INDEX idx_equipment_center_id       ON equipment(center_id);

-- reports
CREATE INDEX idx_reports_memorial_id       ON reports(memorial_id);

-- audit_logs
CREATE INDEX idx_audit_logs_created_at     ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_record_id      ON audit_logs(record_id);
```

---

## Row Level Security (RLS)

```sql
-- ผู้ใช้ทั่วไป: อ่านงานที่ active เท่านั้น
CREATE POLICY "public_read_active_memorials"
  ON memorials FOR SELECT
  USING (is_active = TRUE AND funeral_status = 'active');

-- ผู้ใช้ทั่วไป: อ่านเฉพาะ donation ที่ confirmed
CREATE POLICY "public_read_confirmed_donations"
  ON donations FOR SELECT
  USING (status = 'confirmed');

-- ผู้ใช้ทั่วไป: สร้าง donation ใหม่ได้ (pending เท่านั้น)
CREATE POLICY "public_insert_donations"
  ON donations FOR INSERT
  WITH CHECK (status = 'pending');

-- เจ้าหน้าที่ศูนย์: อ่าน/แก้ไขได้ทุก record ในพื้นที่ตัวเอง
-- (ต้องมี Auth ก่อน — ใช้ Supabase Auth หรือ service_role_key)
```

---

## Supabase Storage

### Bucket: `donations`
| Path | เนื้อหา |
|------|--------|
| `slips/{memorial_id}/{timestamp}.{ext}` | สลิปการโอนเงิน (JPG/PNG) |

**Policies:**
- Public upload (เพื่อให้ผู้มอบแนบสลิปได้โดยไม่ต้อง login)
- Public read (เพื่อแสดงใน dashboard เจ้าภาพ)

### Bucket: `memorials` *(แนะนำเพิ่ม)*
| Path | เนื้อหา |
|------|--------|
| `photos/{memorial_id}.jpg` | รูปผู้เสียชีวิต |
| `qr/{memorial_id}.png` | QR Code บัญชีธนาคาร |

---

## API Routes ปัจจุบัน

| Method | Path | Input | Output | ใช้งาน |
|--------|------|-------|--------|-------|
| GET | `/api/memorial` | — | Memorial object | หน้าหลัก, payment, ecard |
| PATCH | `/api/memorial` | fields | Memorial | แก้ไขข้อมูลงาน |
| GET | `/api/memorial/host?code=` | host_code | `{id, name}` | Login เจ้าภาพ |
| GET | `/api/donations?memorial_id=` | memorial_id? | Donation[] | Dashboard |
| POST | `/api/donations` | FormData | Donation | แนบสลิป |
| PATCH | `/api/donations/[id]` | status fields | Donation | อนุมัติสลิป |
| POST | `/api/generate-wreath` | pose, name, title | `{url}` | AI ภาพมอบหรีด |

---

## User Flow → Data Flow

### ผู้มอบหรีด (Donor Journey)
```
หน้าแรก (/)
  └─→ โอนเงิน/แนบสลิป (/payment)
        POST /api/donations {slip, donor_name="ผู้ร่วมบุญ", amount=0}
        └─→ สร้าง donations record (status=pending)
  └─→ กรอกชื่อป้าย (/print-name?amount=&name=&title=)
  └─→ ส่งพิมพ์ (/printing?name=&title=&amount=)
        [ระบบรอ animation แล้ว redirect]
  └─→ E-card ขอบคุณ (/ecard?name=&title=&amount=)
        บันทึกเป็นรูปภาพ 3:4 ผ่าน html2canvas
```

### เจ้าภาพ (Host Journey)
```
Login ด้วย host_code (/dashboard/host)
  GET /api/memorial/host?code=DEMO001
  └─→ Dashboard งาน (/dashboard/host/[id])
        ดูสรุปยอด, สถานะป้าย, รายชื่อล่าสุด
  └─→ รายชื่อทั้งหมด (/dashboard/host/[id]/donors)
        GET /api/donations?memorial_id=[id]
  └─→ สรุปพิธีกร (/dashboard/host/[id]/summary)
        พิมพ์เป็น PDF (window.print())
```

### ศูนย์บริหาร (Center — Subdomain แยก)
```
ตรวจสอบสลิป → PATCH /api/donations/[id] {status: "confirmed"}
  └─→ ส่งพิมพ์ป้าย → สร้าง nameplates + print_jobs
  └─→ ติดบอร์ด → อัพเดท nameplate_status = "posted"
  └─→ ปิดงาน → สร้าง reports record
```

---

## Service Fee Logic

```
ค่าดำเนินการ = ยอดรวม × 10%
ยอดสุทธิ = ยอดรวม − ค่าดำเนินการ (= 90%)

ตัวอย่าง:
  ผู้ร่วมบุญ 50 คน, ยอดเฉลี่ย 500 บาท/คน
  ยอดรวม = 25,000 บาท
  ค่าดำเนินการ = 25,000 × 10% = 2,500 บาท
  เจ้าภาพรับ = 22,500 บาท
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...           # Public (ใช้ client-side ได้)
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # Secret (server-side เท่านั้น)

# OpenAI (สำหรับ DALL-E 3 สร้างภาพมอบหรีด)
OPENAI_API_KEY=sk-...
```

---

## แนะนำ: ตารางที่ควรเพิ่มในอนาคต

### `users` — บัญชีเจ้าหน้าที่ศูนย์ (ใช้ Supabase Auth)
```sql
-- ใช้ auth.users ของ Supabase โดยตรง
-- เพิ่ม profile table:
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  center_id   UUID REFERENCES centers(id),
  role        TEXT CHECK (role IN ('center_staff','center_manager','admin')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `announcements` — ประกาศอ่านชื่อในพิธี
```sql
CREATE TABLE announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  donor_name    TEXT NOT NULL,
  donor_title   TEXT,
  amount        NUMERIC(10,2),
  announced_at  TIMESTAMPTZ,                             -- เวลาที่อ่านชื่อจริง
  announced_by  TEXT                                     -- พิธีกรที่อ่าน
);
```

### `esg_metrics` — ตัวชี้วัด ESG รวมทั้งระบบ
```sql
CREATE TABLE esg_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  total_memorials     INT NOT NULL DEFAULT 0,
  total_donors        INT NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  wreaths_reduced     INT NOT NULL DEFAULT 0,
  co2_reduced_kg      NUMERIC(10,2) NOT NULL DEFAULT 0,  -- ลดการปล่อย CO2
  waste_reduced_kg    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

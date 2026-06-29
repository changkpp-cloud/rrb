# Reet Ruam Boon (RRB) — System Documentation & Workflows

> Last updated: 2026-06-22  
> Source of truth: live codebase at `e:\Projects\หรีดร่วมบุญ`

---

## 1. System Architecture & Integrations

### 1.1 Overview — "Phygital" Architecture

Reet Ruam Boon bridges a **digital donation experience** with a **physical printed nameplate** at the funeral venue. Donors never send a physical wreath; instead they transfer money online, upload a slip, enter their name, and a thermal/A4 nameplate is printed at the funeral hall in seconds.

```
[Donor Phone]                   [Funeral Hall]
     │                               │
     │  Scan QR → Transfer → Upload  │
     │  Slip → Enter Name            │
     │         │                     │
     │         ▼                     │
     │  [Vercel / Next.js 16]        │
     │         │                     │
     │    Supabase (DB + Storage)    │
     │         │                     │
     │    PrintNode Cloud Print ─────► Physical Printer
     │         │                     │  (A6 PDF, nameplate)
     │    AI Service (OpenAI) ───────► Mock Wreath Image
     │                               │
[Center Dashboard]         [Host Dashboard]
  (Center Manager)           (Host/Family)
```

**Phygital = Physical nameplate produced entirely from a digital-only donor action.**  
No center staff touch is required in the standard donor flow. The system is designed to be zero-latency between payment and print trigger.

---

### 1.2 Infrastructure Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend / BFF | Next.js 16 App Router | Vercel deployment, auto-deploy from `main` |
| Language | TypeScript strict | `npx tsc --noEmit` must pass before push |
| Styling | Tailwind CSS v4 | Custom `gold-*` / `cream-*` palette |
| Database | Supabase PostgreSQL | Row-Level Security disabled; server-side service-role key only |
| File Storage | Supabase Storage | Buckets: `memorials` (nameplates, photos), `donations` (slips) |
| Auth | Cookie-based (no JWT) | `admin_session`, `center_session`, `center_user_session`, `host_session` |
| Cloud Print | PrintNode API | PRINTNODE_API_KEY + per-memorial `printer_id` |
| Alternate Print | Custom `PRINT_SERVICE_URL` | Outbox worker pattern (optional, separate deploy) |
| AI Images | OpenAI `gpt-image-1.5` | Mock wreath backgrounds + AI photo simulations |
| AI Service | Standalone Node.js (Express) | Deployed on Railway/Render; called by Next.js via `AI_SERVICE_URL` |
| QR Payments | `promptpay-qr` + `qrcode.react` | Generated from center phone number |
| Notifications | Twilio SMS (optional) + LINE Notify (optional) | Triggered on new donation |

---

### 1.3 PrintNode Integration (Primary Cloud Print Path)

**Trigger:** Center Manager manually confirms a pending donation (PATCH `/api/donations/[id]` with `status: "confirmed"`) **and** the memorial has a `printer_id` field set.

**Flow:**

```
Center confirms donation
        │
        ▼
lib/printnode.ts → sendPrintJob({printerId, donorName, donorTitle, amount, memorialName})
        │
        ├─ 1. Generate A6 PDF (148mm × 105mm) with pdf-lib
        │      • Font: Sarabun (Thai) fetched from Google Fonts
        │      • Border: Gold #c9a03b, Background: Cream #fef9ee
        │      • Content: Header / Memorial name / Divider / Donor name (22pt bold)
        │                 Donor title (11pt) / Amount (gold, bold) / Footer
        │
        ├─ 2. Upload PDF to Supabase Storage
        │      Path: nameplates/{donationId}.pdf
        │      Signed URL valid for 30 minutes
        │
        └─ 3. POST https://api.printnode.com/printjobs
               {
                 "printerId": <number>,
                 "title": "ป้าย: {donorName}",
                 "contentType": "pdf_uri",
                 "content": "<signed_url>",
                 "source": "หรีดร่วมบุญ",
                 "options": { "copies": 1 }
               }
```

**Result mapping:**

| PrintNode response | `nameplate_status` set to |
|---|---|
| `ok: true` | `"queued"` |
| Error / timeout | `"error"` |

**Environment variable required:** `PRINTNODE_API_KEY`

---

### 1.4 Alternate Print Path — Outbox / PRINT_SERVICE_URL

A second, **fully automated** print path is triggered by the **donor** (not center) immediately after the donation is created, via `POST /api/print-nameplate`.

```
Donor submits name (print-name page)
        │
        ├─ POST /api/donations → donation created (status: "pending")
        │
        └─ POST /api/print-nameplate (fire-and-forget)
                │
                ├─ Upload PNG canvas (1440×400) to Storage
                │  Path: nameplates/{donationId}.png
                │
                ├─ UPDATE donations SET nameplate_status = "queued"
                │
                ├─ enqueue("dispatch_print", payload, { maxAttempts: 5 })
                │  → inserts row in outbox_jobs table
                │
                └─ quickDispatchPrint (1.2 s timeout)
                   → POST {PRINT_SERVICE_URL}/print
                   → If PRINT_SERVICE_URL not configured: skip (no-op)
```

**Outbox Worker** (`GET /api/worker`, cron-triggered):
- Claims up to **10 jobs** per run via `claim_outbox_jobs(10)` (SELECT FOR UPDATE SKIP LOCKED)
- Processes `dispatch_print` jobs with **10-second timeout**
- On success: `nameplate_status = "printed"`
- On failure: reschedule after **60 seconds**, `attempts++`
- After **max_attempts (5)**: `status = "failed"` (no further retry)

**Environment variable required:** `PRINT_SERVICE_URL` (optional — omitting disables this path entirely)

---

### 1.5 OpenAI DALL-E 3 / GPT Image Integration

**Two separate AI image features:**

#### A. Mock Wreath (`/mock-wreath`)
- Generates a decorative wreath background image (text-to-image)
- Route: `POST /api/generate-wreath`
- Uses `generateOpenAIImage()` from `lib/openai-image.ts`
- Model: `gpt-image-1.5` (configurable via `OPENAI_IMAGE_MODEL`)
- Size: configurable via `OPENAI_IMAGE_SIZE` (default `1024x1024`)

#### B. AI Photo Simulation (`/ai-photo/jobs/[id]`)
- Creates composite images of donors with host/family at the funeral
- Requires donor to upload their own photo
- Memorial must have registered `memorial_persons` (host/family photos)
- Route: `POST /api/ai-photo/generate` → async job in `ai_photo_requests` table
- Poll: `GET /api/ai-photo/jobs/[id]`
- Model: `gpt-image-1.5` (edit mode when photo provided, generate mode without)
- Credits: 1 free generation per donation (`ai_photo_credits` table)
- Actual API call forwarded to standalone **AI Service** (`AI_SERVICE_URL`)

**Environment variables required:** `OPENAI_API_KEY`, `AI_SERVICE_URL`, `AI_SERVICE_SECRET`

---

## 2. Step-by-Step Workflows (Auto vs. Manual Logic)

### A. Donor Flow — STRICTLY AUTOMATED

> No center staff action is required for any step in this flow.

#### Step 1 — Enter Event Page

```
Donor opens: https://ruamboon.online/{slug}
→ Server fetches memorial by slug (revalidate: 60s ISR)
→ Displays:
    • Deceased name, photo, birth/death dates, age
    • Ceremony date, time, location, hall
    • Prayer schedule (if set)
    • Live list of confirmed donors (HomeScrollClient)
→ If funeral_status = "closed": page still accessible (read-only)
```

#### Step 2 — Payment

```
Donor navigates: /{slug}/payment
→ System loads center.phone → generates PromptPay QR (promptpay-qr library)
   Fallback 1: memorial.bank_account_image_url (pre-uploaded QR image)
   Fallback 2: Placeholder SVG
→ Bank deep-links shown:
    K PLUS (kplus://), SCB Easy (scbeasy://), KTB (ktbstb://),
    BBL (bbl://), BAY (bayapp://), TTB (ttbapp://)
→ Donor performs bank transfer externally (system has no direct API integration)
```

**⚠️ CODE NOTE:** No minimum donation amount is enforced in the codebase. The documented business requirement of 500 THB is NOT validated server-side. `amount = parseFloat(body.amount) || 0` accepts any value.

#### Step 3 — Upload Slip

```
Donor uploads slip image on /{slug}/payment
→ POST /api/upload-slip (or inline in POST /api/donations)
→ Server:
    1. Validates file: max 5 MB, types: jpeg/png/webp/pdf
    2. Computes SHA-256 hash of file bytes
    3. Queries slip_submissions WHERE memorial_id=? AND slip_hash=?
       → If match found: duplicate_detected = true
                         duplicate_of = <first_submission.id>
                         review_status = "needs_review"
       → If no match:    duplicate_detected = false
                         review_status = "none"
    4. Inserts row into slip_submissions (reserve record)
    5. Uploads file to Supabase Storage: donations/slips/{memorial_id}/{uuid}.{ext}
    6. Updates slip_submissions.slip_url
→ Returns: { slip_url, slip_hash, duplicate: bool }
→ If duplicate=true: UI shows yellow warning banner
  Donor MAY still proceed (duplicate is a flag, NOT a hard block)
```

#### Step 4 — Verifying Screen

```
/{slug}/verifying (auto-redirect, no user action)
→ Animated 3-step progress (1.2s per step):
    Step 1: "รับสลิปเรียบร้อย"
    Step 2: "บันทึกข้อมูลการร่วมบุญ"
    Step 3: "เตรียมพิมพ์ป้ายชื่อ"
→ Total duration: 3.8 seconds
→ Auto-redirects to /{slug}/print-name?{amount}&{memorial_id}&{slip_url}&{slip_hash}&{duplicate}
```

#### Step 5 — Enter Name → Create Donation

```
Donor fills: ชื่อจริง (required) + ตำแหน่ง/คำนำหน้า (optional)
→ POST /api/donations (JSON)
   Body: { memorial_id, donor_name, donor_title, amount, slip_url, slip_hash,
           slip_duplicate_warning }
→ Server validates:
    • memorial exists (404 if not)
    • center daily limit check (default: 1,000 donations/day per center)
      Window: Bangkok time (UTC+7) midnight to midnight
      If limit reached: 429 Too Many Requests
→ INSERT INTO donations:
    status: "pending"          ← NOT auto-confirmed
    nameplate_status: "pending"
    slip_duplicate_warning: <from upload>
→ DB trigger sync_donation_center_id: auto-fills center_id from memorial
→ DB trigger trg_donations_ceremony_stats: updates ceremony_stats totals
→ notifyHost(): fire-and-forget SMS to host_phone via Twilio (if configured)
→ Returns: { success: true, donation: { id, ... } }
```

**⚠️ IMPORTANT:** Donation is created with `status: "pending"`. It does **NOT** count toward financial totals until center confirms it. Donor name is locked at creation — no PATCH of donor_name is allowed after this point.

#### Step 6 — AUTO-PRINT TRIGGER

```
Immediately after donation creation (fire-and-forget):
→ generateNameplatePng(donorName, donorTitle)
   • Canvas 1440×400 px, gold border, cream background
   • Font: Sarabun (auto-fit up to 168px, shrinks to fit)
→ POST /api/print-nameplate { donationId, donorName, donorTitle, imageDataUrl }
→ Server:
    1. Decodes base64 PNG → uploads to Storage: memorials/nameplates/{donationId}.png
    2. UPDATE donations SET nameplate_status = "queued"
    3. INSERT INTO outbox_jobs: type="dispatch_print", maxAttempts=5
    4. Quick dispatch attempt (1.2s timeout) to PRINT_SERVICE_URL/print
       → If PRINT_SERVICE_URL not set: skipped silently
       → If timeout: falls back to outbox worker
```

**Print path decision:**

| PRINT_SERVICE_URL | PrintNode printer_id | Print trigger |
|---|---|---|
| ✅ Configured | Any | Auto-print via outbox on donor submit |
| ❌ Not configured | ✅ Set on memorial | Print on center confirmation (MANUAL) |
| ❌ Not configured | ❌ Not set | Stays "queued" indefinitely |

#### Step 7 — E-Card Display

```
/{slug}/ecard?name=&title=&amount=&donation_id=
→ Displays digital condolence card
→ Donor can save/share e-card image
→ AI Photo section (AiPhotoSection) allows optional photo upload for AI simulation
```

---

### B. Center & Admin Flow — MANUAL APPROVAL REQUIRED

#### B1. Center Registration (Super Admin Only)

```
Super Admin logs in: POST /api/admin/login { password: ADMIN_PASSWORD }
→ Sets admin_session=ok cookie (8 hours)

→ /dashboard/admin/centers/new → POST /api/centers
   Required: name
   Optional: center_code, province, amphoe, tambon, municipality,
             manager_name, phone (used for PromptPay QR)
→ auto-generates center_code (CEN-XXXXXX) if not provided
→ access_code for center login: set separately in settings
```

**⚠️ Manual step:** Creating a center requires Super Admin credentials. No self-registration for centers.

#### B2. Center Staff Registration & IAM

Two login modes at `/dashboard/center`:

**Mode A — access_code (legacy, whole-center login):**
```
POST /api/center/login { access_code }
→ Finds center by centers.access_code
→ Sets center_session={centerId} cookie (8 hours)
→ All staff share the same cookie → no audit trail per user
```

**Mode B — User account (IAM, per-person login):**
```
Staff self-registers: POST /api/center/register
   { center_id, display_name, email, phone?, password (min 8 chars) }
→ Creates pending center_user_request
→ MANUAL APPROVAL REQUIRED by Super Admin at /dashboard/admin/users:
    Admin selects role: center_manager | center_staff | center_viewer
    Admin clicks "อนุมัติ"
    → Creates app_users record (scrypt-hashed password)
    → Creates center_memberships { user_id, center_id, role: "active" }
→ Staff can now login: POST /api/center/user-login { email, password }
    → Verifies scrypt hash
    → Checks active center_memberships
    → Sets center_user_session cookie (8 hours, token in app_user_sessions table)
    → If multiple centers: returns center list for selection
```

**Role permissions:**

| Role | Create Memorial | Edit Memorial | Confirm Donations | Close Memorial | Manage Settings |
|---|---|---|---|---|---|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `center_manager` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `center_staff` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `center_viewer` | ❌ | ❌ | ❌ | ❌ | ❌ |

#### B3. Event Creation

```
Center Manager: /dashboard/center/{id}/create
→ POST /api/memorials/create
   Required: name (deceased), birth_date, death_date, age, ceremony_date,
             ceremony_time, ceremony_location, bank_name, bank_account_number,
             bank_account_name, slug
   Optional: ceremony_hall, prayer_date, prayer_location, host_name,
             host_phone, host_relationship, host_code (auto-generated if omitted),
             photo_url, printer_id ← CRITICAL for PrintNode integration
→ funeral_status defaults to "active"
→ slug must be globally unique (URL of event)
```

**Binding the Printer:**
- `printer_id` is a **numeric string** (PrintNode printer ID)
- Set on the memorial at creation or via Edit page
- Without `printer_id`: PrintNode path is skipped; center must rely on PRINT_SERVICE_URL

#### B4. Donation Review & Confirmation

```
Center Dashboard: /dashboard/center/{id}/memorial/{memId}
→ Section "รอตรวจสอบสลิป" shows donations WHERE status = "pending"
→ For each pending donation:
    Center views: donor name, amount, slip image
    
    ACTION: "ยืนยัน" (Confirm)
    → PATCH /api/donations/{id} { status: "confirmed" }
    → Server: UPDATE SET status="confirmed", confirmed_at=NOW()
    → IF memorial.printer_id exists:
         sendPrintJob() → PrintNode → PDF generated → physical printer
         nameplate_status = "queued" (or "error" on failure)
    → DB triggers: ceremony_stats + tenant_stats updated
    
    ACTION: "ปฏิเสธ" (Reject)
    → PATCH /api/donations/{id} { status: "rejected" }
    → nameplate NOT printed
```

**⚠️ MANUAL APPROVAL:** Every donation starts as `"pending"`. Center must manually confirm each one for:
1. The donation to count in financial totals
2. PrintNode to trigger physical printing (if printer_id set)

#### B5. Event Closure & Payout

```
Prerequisites visible to Center Manager:
  ✓ All nameplates in desired state (warn if pending/queued remain)
  ✓ Host bank account filled in
  ✓ Host identity verified (host_verified = true)

ACTION: "ปิดงาน" button (CloseMemorialButton)
→ Shows confirmation modal with financial summary:
    Total received:  Σ(confirmed donations.amount)
    System fee:      − 100 THB × count(confirmed donations)
    Net to host:     max(total − fee, 0)
    Host bank:       [bank name / account number / account name]
    
→ POST /api/memorials/{id}/close
   → Validates funeral_status ≠ "closed" already
   → UPDATE memorials SET
       funeral_status = "closed",
       host_expires_at = NOW() + 30 days
   → No automatic money transfer — system records the decision only
```

**Transfer Confirmation (separate manual step):**
```
After center physically transfers funds to host:
→ "ยืนยันว่าโอนเงินให้เจ้าภาพแล้ว" button (TransferConfirmButton)
   → 2-step confirm dialog
   → POST /api/memorials/{id}/confirm-transfer
      Validates:
        • memorial.funeral_status = "closed" (must be closed first)
        • host_bank_account_number is set
        • transfer_confirmed_at is NULL (idempotent, rejects double-confirm)
      → UPDATE memorials SET
          transfer_confirmed_at = NOW(),
          transfer_confirmed_by = {user display_name or "center"}
→ Transfer page (/dashboard/center/{id}/transfers) shows "โอนแล้ว ✓" badge
```

**⚠️ MANUAL:** The system does NOT initiate the bank transfer. The Center Manager must transfer funds manually via their banking app, then mark as confirmed in RRB.

**System fee calculation:**
```
System fee per event = 100 THB × number_of_confirmed_donations
Net amount = max(sum_of_confirmed_amounts − system_fee, 0)
```

---

### C. Host Flow

#### C1. Access — Host Login

```
Host receives host_code from Center Manager (e.g., "HABCD")
→ POST /api/memorial/host?code={host_code}
   → Finds memorial WHERE host_code = code
   → Validates host_expires_at: IF memorial.funeral_status = "closed"
       AND NOW() > host_expires_at: returns 403 (access expired)
   → Sets host_session cookie (8 hours, HMAC-SHA256 token)
   → Returns memorial info + hostExpiresInDays
→ Redirects to /dashboard/host/{memorialId}
```

**Access expiry:**
- While funeral is `active`: no expiry (host always has access)
- After `funeral_status = "closed"`: host_expires_at = close_time + **30 days**
- Dashboard shows banner: "สิทธิ์เจ้าภาพหมดอายุใน X วัน" (red if ≤ 7 days)

#### C2. Identity Verification (MANUAL, Center-Gated)

**3-phase gate before bank account input:**

```
Phase 1 — Upload Documents (HOST action)
  Tab "บัญชีรับเงิน" shows HostVerificationGate component
  Host uploads:
    • ใบมรณะบัตร (death_certificate_url) ← REQUIRED to unlock Phase 2
    • บัตรประชาชน (host_id_card_url) ← optional but recommended
  → PATCH /api/memorials/{id}
    { death_certificate_url, host_id_card_url }
    (multipart/form-data upload to Supabase Storage)
  → host_verified remains FALSE → host sees "รอเจ้าหน้าที่ตรวจสอบ"

Phase 2 — Center Review (CENTER action, MANUAL APPROVAL)
  Center sees HostVerificationReview in memorial detail page (tab "เจ้าภาพ")
  Shows: death cert link + ID card link
  
  "อนุมัติ" button:
    → PATCH /api/memorials/{id} { host_verified: "true" }
    → UPDATE memorials SET host_verified = TRUE
  
  "ไม่อนุมัติ" button:
    → PATCH /api/memorials/{id} { host_verified: "false" }
    → UPDATE memorials SET host_verified = FALSE

Phase 3 — Bank Account Input (HOST action, unlocked after host_verified=true)
  HostBankForm is rendered (replaces gate)
  Host fills:
    • ธนาคาร (host_bank_name)
    • เลขบัญชี (host_bank_account_number)
    • ชื่อบัญชี (host_bank_account_name)
  → PATCH /api/memorials/{id} with bank fields
```

#### C3. Host Dashboard Tabs

| Tab | Content | Update frequency |
|---|---|---|
| สรุปยอด | Total donations, system fee, net amount, slip warnings | On load |
| รายชื่อ | Confirmed donors (newest first), slip links | On load |
| รายงาน | Print-ready donor list (oldest first) | On load |
| บัญชีรับเงิน | HostVerificationGate / HostBankForm | On load |
| ภาพจำลอง | MemorialPersonManager (AI photo persons) | Client fetch |

---

## 3. Hard Conditions & Validation Rules

### 3.1 Financial Constraints

| Rule | Value | Enforced at |
|---|---|---|
| System fee per donation | **100 THB** (hardcoded) | Center dashboard, close button, transfers page |
| Net amount formula | `max(total_confirmed − (100 × count_confirmed), 0)` | Client-side display only |
| Daily donation limit per center | **1,000 donations** (env: `CENTER_DAILY_DONATION_LIMIT`) | `POST /api/donations` → 429 |
| Daily limit window | Bangkok time midnight-to-midnight (UTC+7) | `bangkokDateWindow()` in `lib/donation-policy.ts` |
| Minimum donation amount | **NOT ENFORCED IN CODE** | — |
| Slip file size limit | **5 MB** | `POST /api/upload-slip` + `POST /api/donations` → 413 |
| Allowed slip types | `image/jpeg, image/png, image/webp, application/pdf` | Server-side → 415 |
| AI photo upload limit | **4 MB**, max dimension 1024px (auto-compressed) | Client-side (Canvas resize) |
| PrintNode signed URL TTL | **30 minutes** | `lib/printnode.ts` |

### 3.2 Identity & Verification Constraints

| Rule | Enforced by |
|---|---|
| Host must upload death certificate before center can approve | `host_verified = false` until cert uploaded; `HostVerificationGate` Phase 1 gate |
| Center must approve identity before host can enter bank account | `host_verified = true` required to render `HostBankForm` |
| Host bank account required before memorial can be closed | `CloseMemorialButton` shows amber warning if `host_bank_account_number` is null |
| Host bank account required for transfer confirmation | `POST /api/memorials/[id]/confirm-transfer` → 400 if bank missing |
| Memorial must be closed before transfer confirmation | `confirm-transfer` route → 400 if `funeral_status ≠ "closed"` |
| Transfer confirmation is idempotent (one-way) | Returns 409 if `transfer_confirmed_at` already set |
| `printer_id` must be set on memorial for PrintNode to fire | Checked at runtime in `PATCH /api/donations/[id]` |
| Password minimum length | **8 characters** | `/api/center/register` + `ChangePasswordForm` client validation |

### 3.3 State Machine: Donation Status

```
         POST /api/donations
               │
               ▼
           "pending"  ◄──────────────────────────────┐
               │                                      │
     ┌─────────┴──────────┐                          │
     │ PATCH status=confirmed │ PATCH status=rejected  │
     ▼                    ▼                          │
"confirmed"          "rejected"                      │
     │                    │                          │
 Counts in totals    Excluded                        │
 PrintNode fires     from totals                     │
 (if printer_id)                                     │
                                                     │
Note: rejected → can be re-confirmed manually ───────┘
(no hard state lock on rejection)
```

**What "confirmed" unlocks:**
- Counted in `ceremony_stats.total_amount`
- Counted in `ceremony_stats.confirmed_donations`
- PrintNode print job triggered (if `printer_id` set)
- `confirmed_at` timestamp written

### 3.4 State Machine: Nameplate Status

```
Donation created
      │
      ▼
  "pending"
      │
      │ (print-nameplate API called — fire-and-forget)
      ▼
  "queued"  ◄──────────────────────────────────────────┐
      │                                                 │
      │ Outbox worker / PrintNode dispatches           │
      ▼                                                 │
  "printed"  (dispatch_print success)                  │
      │                                                 │
      │ Center manually updates on physical board       │
      ▼                                                 │
   "posted"                                            │
                                                       │
  ERROR PATH:                                          │
  PrintNode fails → "error"                            │
  Can be retried → reset to "queued" ─────────────────┘
```

**Valid transitions (no DB CHECK constraint on transitions, only on values):**
- `CHECK (nameplate_status IN ('pending','queued','printed','posted'))`
- `"error"` is set via raw UPDATE (bypasses CHECK on older schema migrations)

### 3.5 State Machine: Memorial Status

```
           POST /api/memorials/create
                     │
                     ▼
               funeral_status = "active"    (draft status exists but rarely used)
                     │
                     │ POST /api/memorials/{id}/close (Center Manager, MANUAL)
                     ▼
               funeral_status = "closed"
               host_expires_at = NOW() + 30 days
                     │
                     │ (no reopen functionality; closed is permanent)
                     ▼
                  [FINAL]
```

**Blocking conditions for `close`:**
- Already closed (400: "งานนี้ถูกปิดไปแล้ว")
- Code warns but does NOT hard-block if nameplates still pending/queued

### 3.6 PrintNode Failure Handling

```
Center confirms donation
        │
        ▼
sendPrintJob() called
        │
   ┌────┴────┐
   │ Success │  → nameplate_status = "queued"
   │         │  → PrintNode handles delivery to printer
   └────┬────┘
        │
   ┌────┴────┐
   │ Failure │  → nameplate_status = "error"
   │         │  → Error visible in Center dashboard "พิมพ์ไม่สำเร็จ" list
   └────┬────┘
        │
Center sees error list → manually resets nameplate_status = "queued"
→ This re-triggers print on next confirmation action
```

**Outbox Worker failure handling (`dispatch_print`):**

| Attempt | Behavior |
|---|---|
| 1–4 failures | `scheduled_at += 60s`, `attempts++`, stays `"pending"` |
| 5th failure (max) | `status = "failed"`, no further retry |
| Success (any attempt) | `nameplate_status = "printed"`, `status = "completed"` |

### 3.7 Slip Duplicate Detection

```
SHA-256 hash computed server-side from raw file bytes
→ Check slip_submissions WHERE memorial_id = ? AND slip_hash = ?
→ If match:
    slip_duplicate_warning = TRUE on donation record
    review_status = "needs_review" in slip_submissions
    duplicate_of = <first_submission.id>
    UI shows yellow warning to donor (not a hard block)
    Center sees warning count in dashboard stats
    Host sees flagged items in "สรุปยอด" tab
→ If no match:
    Accepted normally, review_status = "none"
```

**Important:** Duplicate detection is per-memorial, not system-wide. Same slip on two different memorials is allowed.

### 3.8 Host Session & Access Expiry

```
host_session cookie: HMAC-SHA256 token (lib/host-session.ts)
  Payload: "host:{memorialId}:{expiresTimestamp}"
  Signed with: HOST_SESSION_SECRET (fallback: ADMIN_SESSION_SECRET)
  Cookie maxAge: 8 hours

host_expires_at (DB field on memorials):
  Set when memorial closes: NOW() + 30 days
  Checked on every host API call
  If exceeded: 403 "Host access has expired"
  Dashboard shows countdown banner (red if ≤ 7 days)
```

### 3.9 Center Staff Password Requirements

```
Password rules (lib/iam.ts):
  Algorithm: scrypt (Node.js native crypto)
  Salt: 16 bytes random hex
  Key length: 64 bytes
  Stored as: "scrypt:{salt}:{hash}"
  Minimum length: 8 characters (validated at register + change-password)
  Case normalization: password trimmed + lowercased before hashing
    (both normalized and raw are attempted on verify for backwards compatibility)
```

---

## 4. Database Key Relationships

```
centers (1)
  └── memorials (N)          center_id FK
        └── donations (N)    memorial_id FK
              └── slip_submissions (1:1 or N)  memorial_id FK
        └── outbox_jobs      payload.memorial_id
        └── ceremony_stats   memorial_id (trigger-maintained)

centers (1)
  └── tenant_stats           center_id (trigger-maintained)
  └── center_daily_stats     center_id (function: refresh_center_daily_stats)
  └── center_memberships     center_id FK → app_users FK

app_users (1)
  └── center_memberships (N)
  └── app_user_sessions (N)
  └── center_user_requests (N)
```

---

## 5. Environment Variables Reference

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side admin access (bypasses RLS) |
| `ADMIN_PASSWORD` | ✅ | Super Admin login (default: ESG2025) |
| `OPENAI_API_KEY` | For AI photos | DALL-E / GPT Image via AI Service |
| `PRINTNODE_API_KEY` | For PrintNode | Cloud printing to physical printer |
| `PRINT_SERVICE_URL` | For outbox print | Custom print service (alternate path) |
| `AI_SERVICE_URL` | For AI photos | Standalone AI microservice URL |
| `AI_SERVICE_SECRET` | For AI photos | HMAC key for AI service auth |
| `HOST_SESSION_SECRET` | For host auth | Signs host_session tokens |
| `CRON_SECRET` | For worker | Authorizes `GET /api/worker` cron calls |
| `PAYMENT_WEBHOOK_SECRET` | For webhooks | HMAC-SHA256 verify payment webhooks |
| `NEXT_PUBLIC_SITE_URL` | For links | Base URL (default: https://ruamboon.online) |
| `CENTER_DAILY_DONATION_LIMIT` | Optional | Override default limit of 1,000/day |
| `OPENAI_IMAGE_MODEL` | Optional | Override image model (default: gpt-image-1.5) |
| `OPENAI_IMAGE_SIZE` | Optional | Override image size (default: 1024x1024) |
| `OPENAI_IMAGE_QUALITY` | Optional | Override quality (default: high) |
| `TWILIO_ACCOUNT_SID` | Optional | SMS notifications |
| `TWILIO_AUTH_TOKEN` | Optional | SMS notifications |
| `TWILIO_FROM_NUMBER` | Optional | SMS sender number |
| `LINE_NOTIFY_TOKEN` | Optional | LINE group notifications |

---

## 6. Critical Caveats & Known Gaps

| # | Issue | Impact | Location |
|---|---|---|---|
| 1 | **No minimum donation amount enforced** | Fraudulent 0-baht donations possible | `POST /api/donations` |
| 2 | **PRINT_SERVICE_URL not deployed** in production | Nameplates stay "queued"; must rely on PrintNode | `app/api/print-nameplate/route.ts` |
| 3 | **center_daily_stats not auto-refreshed** | Analytics may show stale data | Requires `refresh_center_daily_stats()` RPC call |
| 4 | **PAYMENT_WEBHOOK_SECRET not set** | Payment webhook rejects all requests | `app/api/webhooks/payment/route.ts` |
| 5 | **Duplicate slip is warning-only** | No hard block on duplicate slips | `POST /api/upload-slip` |
| 6 | **No reopen for closed memorials** | Once closed, funeral_status cannot be reversed | `app/api/memorials/[id]/close/route.ts` |
| 7 | **System fee is 5% of total donations** | Single source of truth `lib/fee.ts` (`FEE_RATE = 0.05`); host nets 95% | `lib/fee.ts` |
| 8 | **`nameplate_status = "error"` bypasses DB CHECK** | Requires DB migration to add "error" to CHECK constraint | `supabase/setup-fresh.sql` |
| 9 | **Transfer confirmation cannot be undone** | Returns 409 if already confirmed | `POST /api/memorials/[id]/confirm-transfer` |
| 10 | **Host session tied to memorialId in token** | Compromise of one token only exposes one event | Acceptable by design |

---

*Generated from live code analysis — always verify against source files for authoritative behavior.*

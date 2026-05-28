create table if not exists public.ai_photo_templates (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  template_key text not null unique,
  description text,
  prompt_template text not null,
  negative_prompt text,
  required_inputs jsonb not null default '[]'::jsonb,
  preview_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.ai_photo_templates (
  template_name,
  template_key,
  description,
  prompt_template,
  negative_prompt,
  required_inputs,
  sort_order
) values
(
  'ยืนถือป้ายหรีดร่วมบุญ',
  'standing_with_label',
  'ภาพหลักสำหรับผู้มอบ ยืนถือป้ายแนวยาวในงานศพไทย',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้หน้าตาใกล้เคียงรูปอ้างอิงอย่างสุภาพ
ผู้มอบยืนตรง ถือป้ายหรีดร่วมบุญแนวยาวสองมือ ขนาดเท่าป้ายพวงหรีดจริง ไม่ใหญ่เกินจริง
บนป้ายเขียนข้อความไทยให้ชัดเจน:
[wreath_label_text]
ฉากหลังเป็นบอร์ดหรีดร่วมบุญดอกไม้แห้ง ใช้ซ้ำได้ มีบรรยากาศศาลางานศพไทย
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
สีหน้าผู้มอบสงบ อาลัย สุภาพ ไม่ยิ้ม',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางร่าเริง, ห้ามเพิ่มคนจำนวนมาก, ห้ามโลโก้ปลอม, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::jsonb,
  1
),
(
  'ไหว้อาลัยหน้าบอร์ด',
  'mourning_wai',
  'ภาพสุภาพ ผู้มอบไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สงบ เรียบหรู สมเกียรติ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ
มีป้ายชื่อผู้มอบติดอยู่บนบอร์ดด้านหลังอย่างสุภาพ ข้อความบนป้าย:
[wreath_label_text]
บรรยากาศเป็นศาลางานศพไทย มีดอกไม้แห้งสีขาวและทองอย่างพอดี
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
สีหน้าผู้มอบสงบ อาลัย ไม่ยิ้ม ไม่มองกล้องมากเกินไป',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามท่าทางร่าเริง, ห้ามบอร์ดรก, ห้ามเพิ่มคนจำนวนมาก, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::jsonb,
  2
),
(
  'เจ้าภาพรับมอบ',
  'host_receiving',
  'ภาพจำลองการมอบป้ายระหว่างผู้มอบและเจ้าภาพ',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ สมเกียรติ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนมอบป้ายหรีดร่วมบุญให้เจ้าภาพหนึ่งคน
เจ้าภาพรับป้ายด้วยท่าทางสุภาพ สงบ และขอบคุณ
ป้ายเป็นแนวยาว ขนาดเท่าป้ายพวงหรีดเดิม ไม่ใหญ่เกินจริง ข้อความบนป้าย:
[wreath_label_text]
ฉากหลังเป็นศาลางานศพไทยและบอร์ดหรีดร่วมบุญดอกไม้แห้ง
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
ทุกคนมีสีหน้าสงบ อาลัย ไม่ยิ้มกว้าง',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางรื่นเริง, ห้ามเพิ่มฝูงชน, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::jsonb,
  3
)
on conflict (template_key) do update set
  template_name = excluded.template_name,
  description = excluded.description,
  prompt_template = excluded.prompt_template,
  negative_prompt = excluded.negative_prompt,
  required_inputs = excluded.required_inputs,
  sort_order = excluded.sort_order,
  is_active = true;

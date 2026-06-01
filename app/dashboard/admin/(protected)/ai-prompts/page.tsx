import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AI_PHOTO_TEMPLATES, type AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

export const dynamic = "force-dynamic";

const TEMPLATE_LABELS: Record<AiPhotoTemplateKey, string> = {
  standing_with_label: "ยืนถือป้าย",
  mourning_wai: "ไหว้อาลัย",
  host_receiving: "เจ้าภาพรับมอบ",
  organization_board: "ในนามองค์กร",
};

type SavedPrompt = {
  template_key: AiPhotoTemplateKey;
  prompt_template: string;
};

async function getPromptRows() {
  const supabase = createAdminClient();
  const { data } = await (supabase.from("ai_photo_templates") as any)
    .select("template_key, prompt_template")
    .in("template_key", AI_PHOTO_TEMPLATES.map((template) => template.templateKey));

  const saved = new Map(
    ((data ?? []) as SavedPrompt[]).map((row) => [row.template_key, row.prompt_template])
  );

  return AI_PHOTO_TEMPLATES.map((template) => ({
    ...template,
    displayLabel: TEMPLATE_LABELS[template.templateKey],
    promptTemplate: saved.get(template.templateKey) ?? template.promptTemplate,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function savePrompts(formData: FormData) {
  "use server";

  const supabase = createAdminClient();
  const rows = AI_PHOTO_TEMPLATES.map((template) => {
    const prompt = String(formData.get(`prompt_${template.templateKey}`) ?? "").trim();
    return {
      template_name: TEMPLATE_LABELS[template.templateKey],
      template_key: template.templateKey,
      description: template.description,
      prompt_template: prompt || template.promptTemplate,
      negative_prompt: template.negativePrompt,
      required_inputs: template.requiredInputs,
      sort_order: template.sortOrder,
      is_active: true,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("ai_photo_templates") as any).upsert(rows, {
    onConflict: "template_key",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/ai-prompts");
}

export default async function AdminAiPromptsPage() {
  const templates = await getPromptRows();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xl font-bold text-gold-800">แก้พรอมต์เจนรูป AI</p>
        <p className="text-xs text-gold-500 mt-1">
          ปรับคำสั่งภาพสำหรับ 4 เมนู ผู้ใช้กดสร้างรูปครั้งถัดไปจะใช้พรอมต์ล่าสุดนี้ทันที
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-700">ตัวแปรที่ใช้ได้ในพรอมต์</p>
        <p className="text-[11px] text-blue-600 mt-1 leading-relaxed">
          [wreath_label_text], [donor_name], [donor_position], [condolence_text],
          [deceased_name], [funeral_place]
        </p>
      </div>

      <form action={savePrompts} className="space-y-4">
        {templates.map((template) => (
          <section
            key={template.templateKey}
            className="rounded-2xl border border-gold-200 bg-cream-50 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gold-800">{template.displayLabel}</p>
                <p className="text-[11px] text-gold-500 mt-0.5">
                  key: {template.templateKey}
                </p>
              </div>
              <span className="rounded-full bg-white border border-gold-200 px-2 py-1 text-[10px] font-semibold text-gold-600">
                แบบที่ {template.sortOrder}
              </span>
            </div>

            <textarea
              name={`prompt_${template.templateKey}`}
              defaultValue={template.promptTemplate}
              rows={9}
              className="w-full rounded-xl border border-gold-200 bg-white px-3 py-2 text-xs leading-relaxed text-gold-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100"
            />
          </section>
        ))}

        <div className="sticky bottom-3 z-10">
          <button
            type="submit"
            className="w-full rounded-xl gold-gradient px-4 py-3 text-sm font-bold text-white shadow-md active:scale-[0.99]"
          >
            บันทึกพรอมต์ทั้ง 4 แบบ
          </button>
        </div>
      </form>
    </div>
  );
}

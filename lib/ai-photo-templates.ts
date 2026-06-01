export type AiPhotoTemplateKey =
  | "standing_with_label"
  | "mourning_wai"
  | "host_receiving"
  | "organization_board";

export type AiPhotoTemplate = {
  templateName: string;
  templateKey: AiPhotoTemplateKey;
  description: string;
  requiredInputs: string[];
  promptTemplate: string;
  negativePrompt: string;
  sortOrder: number;
};

export type AiPhotoPromptInput = {
  templateKey: AiPhotoTemplateKey;
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
  deceasedName?: string;
  funeralPlace?: string;
  wreathLabelText?: string;
};

export const AI_PHOTO_TEMPLATES: AiPhotoTemplate[] = [
  {
    templateName: "ยืนถือป้ายหรีดร่วมบุญ",
    templateKey: "standing_with_label",
    description: "ภาพหลักสำหรับผู้มอบ ยืนถือป้ายแนวยาวในงานศพไทย",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 1,
    promptTemplate: [
      "สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ โทนครีม เบจ ทอง",
      "ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้หน้าตาใกล้เคียงรูปอ้างอิงอย่างสุภาพ",
      "ผู้มอบยืนตรง ถือป้ายหรีดร่วมบุญแนวยาวสองมือ ขนาดเท่าป้ายพวงหรีดจริง ไม่ใหญ่เกินจริง",
      "บนป้ายเขียนข้อความไทยให้ชัดเจน:",
      "[wreath_label_text]",
      "ฉากหลังเป็นบอร์ดหรีดร่วมบุญดอกไม้แห้ง ใช้ซ้ำได้ มีบรรยากาศศาลางานศพไทย",
      "งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]",
      "สีหน้าผู้มอบสงบ อาลัย สุภาพ ไม่ยิ้ม",
    ].join("\n"),
    negativePrompt:
      "ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางร่าเริง, ห้ามเพิ่มคนจำนวนมาก, ห้ามโลโก้ปลอม, ห้ามข้อความมั่วหรือภาษาเพี้ยน",
  },
  {
    templateName: "ไหว้อาลัยหน้าบอร์ด",
    templateKey: "mourning_wai",
    description: "ภาพสุภาพ ผู้มอบไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 2,
    promptTemplate: [
      "สร้างภาพถ่ายสมจริงในงานศพไทยที่สงบ เรียบหรู สมเกียรติ โทนครีม เบจ ทอง",
      "ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ",
      "มีป้ายชื่อผู้มอบติดอยู่บนบอร์ดด้านหลังอย่างสุภาพ ข้อความบนป้าย:",
      "[wreath_label_text]",
      "บรรยากาศเป็นศาลางานศพไทย มีดอกไม้แห้งสีขาวและทองอย่างพอดี",
      "งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]",
      "สีหน้าผู้มอบสงบ อาลัย ไม่ยิ้ม ไม่มองกล้องมากเกินไป",
    ].join("\n"),
    negativePrompt:
      "ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามท่าทางร่าเริง, ห้ามบอร์ดรก, ห้ามเพิ่มคนจำนวนมาก, ห้ามข้อความมั่วหรือภาษาเพี้ยน",
  },
  {
    templateName: "เจ้าภาพรับมอบ",
    templateKey: "host_receiving",
    description: "ภาพจำลองการมอบป้ายระหว่างผู้มอบและเจ้าภาพ",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 3,
    promptTemplate: [
      "สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ สมเกียรติ โทนครีม เบจ ทอง",
      "ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนมอบป้ายหรีดร่วมบุญให้เจ้าภาพหนึ่งคน",
      "เจ้าภาพรับป้ายด้วยท่าทางสุภาพ สงบ และขอบคุณ",
      "ป้ายเป็นแนวยาว ขนาดเท่าป้ายพวงหรีดเดิม ไม่ใหญ่เกินจริง ข้อความบนป้าย:",
      "[wreath_label_text]",
      "ฉากหลังเป็นศาลางานศพไทยและบอร์ดหรีดร่วมบุญดอกไม้แห้ง",
      "งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]",
      "ทุกคนมีสีหน้าสงบ อาลัย ไม่ยิ้มกว้าง",
    ].join("\n"),
    negativePrompt:
      "ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางรื่นเริง, ห้ามเพิ่มฝูงชน, ห้ามข้อความมั่วหรือภาษาเพี้ยน",
  },
  {
    templateName: "ในนามองค์กร / บริษัท",
    templateKey: "organization_board",
    description: "ภาพป้ายหรีดในนามหน่วยงาน บริษัท หรือกลุ่มเพื่อนร่วมงาน เน้นป้ายชื่อองค์กรชัดเจน",
    requiredInputs: [
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 4,
    promptTemplate: [
      "สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ สงบ เป็นทางการ โทนครีม เบจ ทอง",
      "ไม่จำเป็นต้องมีบุคคลในภาพ หรือมีตัวแทนองค์กร 1–2 คน แต่งชุดสุภาพสีดำ",
      "จุดเด่นคือป้ายหรีดร่วมบุญแนวยาว ขนาดมาตรฐาน วางตรงกลางภาพอย่างสง่า",
      "บนป้ายเขียนข้อความในนามองค์กรให้ชัดเจน อ่านออก:",
      "[wreath_label_text]",
      "ฉากหลังเป็นศาลางานศพไทย มีบอร์ดดอกไม้แห้งโทนครีมและทอง",
      "งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]",
      "บรรยากาศเป็นทางการ สุภาพ สมเกียรติ ไม่มีสีสด ไม่มีโบ ไม่มีโลโก้บริษัทจริง",
    ].join("\n"),
    negativePrompt:
      "ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามใส่โลโก้บริษัทจริง, ห้ามภาพหมู่หลายสิบคน, ห้ามท่าทางร่าเริง, ห้ามข้อความมั่วหรือผิดภาษา",
  },
];

export function getAiPhotoTemplate(key: string | null | undefined) {
  return (
    AI_PHOTO_TEMPLATES.find((template) => template.templateKey === key) ??
    AI_PHOTO_TEMPLATES[0]
  );
}

export function buildWreathLabelText(input: {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
}) {
  return [
    input.donorName.trim() || "ผู้ร่วมบุญ",
    input.donorPosition?.trim(),
    input.condolenceText?.trim() || "ร่วมอาลัยและร่วมทำบุญ",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAiPhotoPrompt(input: AiPhotoPromptInput) {
  const template = getAiPhotoTemplate(input.templateKey);
  const wreathLabelText =
    input.wreathLabelText ??
    buildWreathLabelText({
      donorName: input.donorName,
      donorPosition: input.donorPosition,
      condolenceText: input.condolenceText,
    });

  const replacements: Record<string, string> = {
    "[donor_name]": input.donorName.trim() || "ผู้ร่วมบุญ",
    "[donor_position]": input.donorPosition?.trim() || "",
    "[condolence_text]": input.condolenceText?.trim() || "ร่วมอาลัยและร่วมทำบุญ",
    "[deceased_name]": input.deceasedName?.trim() || "ผู้วายชนม์",
    "[funeral_place]": input.funeralPlace?.trim() || "ศาลางานศพไทย",
    "[wreath_label_text]": wreathLabelText,
  };

  let prompt = template.promptTemplate;
  for (const [token, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(token, value);
  }

  return [
    prompt,
    "",
    "ข้อกำกับสไตล์:",
    "ภาพถ่ายสมจริง, แสงนุ่ม, องค์ประกอบสุภาพ, ไม่มีความหวือหวา, ไม่ละเมิดกาลเทศะ, โทนสีสอดคล้องแบรนด์หรีดร่วมบุญ",
    "",
    `ข้อห้าม: ${template.negativePrompt}`,
  ].join("\n");
}

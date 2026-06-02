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
  promptTemplate?: string;
  negativePrompt?: string;
};

const COMMON_SCENE = [
  "Create a respectful photorealistic vertical image for a Thai Buddhist funeral memorial.",
  "The mood must be calm, dignified, elegant, and suitable for sharing with family.",
  "Use a cream, white, beige, and soft gold palette with gentle natural lighting.",
  "Show a reusable dried-flower condolence wreath board or memorial board in the scene.",
  "The board surface must be completely blank and empty — absolutely no text, no letters, no characters, no inscription of any kind on the board.",
  "Avoid festive expressions. Faces should look calm and respectful.",
].join(" ");

export const AI_PHOTO_TEMPLATES: AiPhotoTemplate[] = [
  {
    templateName: "ยืนถือป้ายหรีดร่วมบุญ",
    templateKey: "standing_with_label",
    description: "ผู้มอบยืนถือป้ายหรีดร่วมบุญในงานศพไทยอย่างสุภาพ",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 1,
    promptTemplate: [
      COMMON_SCENE,
      "Use the uploaded donor photo as the main person reference. Preserve the donor's identity, face shape, age, and general appearance as much as possible.",
      "The donor stands upright holding a modest horizontal condolence board with both hands.",
      "The board is completely blank with a clean cream or white surface and an elegant gold border — no text, no writing, no markings on the board at all.",
      "The background is a Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, smiling broadly, distorted face, extra fingers, extra limbs, text on board, writing on board, letters on board, Thai characters on board, inscription, fake logos, crowded scene, disrespectful pose",
  },
  {
    templateName: "ไหว้อาลัย",
    templateKey: "mourning_wai",
    description: "ผู้มอบไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 2,
    promptTemplate: [
      COMMON_SCENE,
      "Use the uploaded donor photo as the main person reference. Preserve the donor's identity, face shape, age, and general appearance as much as possible.",
      "The donor performs a respectful Thai wai in front of a condolence wreath board.",
      "The condolence board is entirely blank with a clean cream or white surface and gold trim — no text, no writing, no markings on the board at all.",
      "The background is a Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, smiling broadly, distorted face, extra fingers, extra limbs, text on board, writing on board, letters on board, Thai characters on board, inscription, fake logos, crowded scene, disrespectful pose",
  },
  {
    templateName: "เจ้าภาพรับมอบ",
    templateKey: "host_receiving",
    description: "จำลองภาพผู้มอบส่งมอบป้ายให้เจ้าภาพอย่างสุภาพ",
    requiredInputs: [
      "donor_photo",
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 3,
    promptTemplate: [
      COMMON_SCENE,
      "Use the uploaded donor photo as the donor reference. Preserve the donor's identity, face shape, age, and general appearance as much as possible.",
      "Show the donor respectfully presenting a modest condolence board to one host representative.",
      "The host looks calm and appreciative. Both people wear formal dark clothing.",
      "The board is entirely blank with a clean cream or white surface and elegant gold border — no text, no writing, no markings on the board at all.",
      "The background is a Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, smiling broadly, distorted face, extra fingers, extra limbs, text on board, writing on board, letters on board, Thai characters on board, inscription, fake logos, large crowd, disrespectful pose",
  },
  {
    templateName: "ในนามองค์กร / บริษัท",
    templateKey: "organization_board",
    description: "ภาพป้ายหรีดในนามองค์กรหรือกลุ่มผู้ร่วมงาน",
    requiredInputs: [
      "donor_name",
      "donor_position",
      "condolence_text",
      "funeral_place",
    ],
    sortOrder: 4,
    promptTemplate: [
      COMMON_SCENE,
      "Focus on an elegant central condolence board for an organization or group. People are optional and should be subtle if included.",
      "The board surface must be completely blank and clean — no text, no writing, no characters, no inscription whatsoever on the board.",
      "The background is a Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
      "Do not add real company logos.",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, fake company logos, crowded group photo, text on board, writing on board, letters on board, Thai characters on board, inscription, disrespectful pose",
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

  // Only inject scene/location context — never inject donor text into prompt
  // (Thai text is overlaid on the image client-side after generation)
  const replacements: Record<string, string> = {
    "[deceased_name]": input.deceasedName?.trim() || "ผู้วายชนม์",
    "[funeral_place]": input.funeralPlace?.trim() || "ศาลางานศพไทย",
  };

  let prompt = input.promptTemplate?.trim() || template.promptTemplate;
  for (const [token, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(token, value);
  }

  return [
    prompt,
    "",
    "Style requirements:",
    "Photorealistic, vertical 2:3 composition, soft light, respectful Thai funeral atmosphere, premium but understated design.",
    "",
    `Negative requirements: ${input.negativePrompt?.trim() || template.negativePrompt}`,
  ].join("\n");
}

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
  hostPersonName?: string;
  hostPersonRole?: string;
  donorGender?: string;
  donorAgeRange?: string;
  recipientGender?: string;
};

// Added to prompt when a host/family reference photo is included
export function buildHostPersonInstruction(name: string, role: string): string {
  return [
    "SECOND PERSON — HOST / FAMILY REPRESENTATIVE:",
    `The second uploaded reference photo shows "${name}" (${role}).`,
    "Their face and appearance MUST match the second reference photo with the same maximum accuracy as the donor.",
    "Preserve exactly: face shape, skin tone, age, eye shape, hair color and style.",
    "Do NOT alter, idealize, or change this person's appearance in any way.",
  ].join(" ");
}

// Placed FIRST in every template that includes a donor photo.
// GPT-Image-1 weighs early instructions most heavily.
const FACE_IDENTITY = [
  "HIGHEST PRIORITY — FACE IDENTITY:",
  "The uploaded reference photo shows the REAL person who must appear in this image.",
  "You MUST reproduce this person's face with the maximum possible accuracy.",
  "Preserve exactly: face shape, eye shape and color, nose shape, mouth and lips, jawline, cheekbones, skin tone and complexion, age, hair color, hair length and texture, hair style, eyebrows, and any distinctive features (scars, moles, glasses, etc.).",
  "Do NOT change their ethnicity, gender, approximate age, or any facial feature.",
  "Do NOT idealize, smooth, beautify, slim, or generalize the face in any way.",
  "The person in the output must be immediately recognizable as the same individual from the reference photo.",
  "Facial likeness to the reference photo overrides all other stylistic considerations.",
].join(" ");

const COMMON_SCENE = [
  "Create a respectful photorealistic vertical portrait image for a Thai Buddhist funeral memorial.",
  "The mood must be calm, dignified, elegant, and suitable for sharing with family.",
  "Use a cream, white, beige, and soft gold palette with gentle, soft, flattering natural lighting.",
  "Show a reusable dried-flower condolence wreath board or memorial board in the scene.",
  "The board surface must be completely blank and empty — absolutely no text, no letters, no characters, no inscription of any kind on the board.",
  "Avoid festive expressions. The donor's face should look calm, composed, and respectful.",
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
      "donor_gender",
      "donor_age_range",
    ],
    sortOrder: 1,
    promptTemplate: `{DONOR_NAME}
{DONOR_POSITION}
{CONDOLENCE_TEXT}

Create a highly realistic ceremonial Thai funeral memorial photo for the "หรีดร่วมบุญ Zero Waste" project.

Scene:
A respectful Thai funeral hall during an evening Buddhist memorial ceremony. The atmosphere is calm, elegant, dignified, and solemn. The color tone is warm ivory, cream, beige, soft gold, and natural dried flowers. In the background, there is a luxurious reusable memorial board decorated with premium dried flowers in cream and gold tones. The board contains multiple long horizontal condolence name plaques, arranged neatly and beautifully.

Main subject:
A {DONOR_GENDER} Thai person, age around {DONOR_AGE_RANGE}, standing in front of the memorial board and holding one long horizontal condolence plaque. Use {DONOR_FACE_REFERENCE} as the face reference. Preserve the person's real facial identity, facial structure, hairstyle, skin tone, age, and natural expression as closely as possible.

Clothing:
The person wears formal black funeral attire, elegant and respectful. No colorful clothing.

Plaque:
The person is holding a realistic long horizontal Thai condolence plaque, similar in size to a traditional wreath name tag, not oversized. The plaque is ivory cream with a thin gold border and small dried floral decorations at the corners. The Thai text must be clear, centered, elegant, and readable.

Text on plaque:
"{DONOR_NAME}
{DONOR_POSITION}
{CONDOLENCE_TEXT}"

Composition:
Vertical portrait image, professional event photography style, full upper body visible, the plaque clearly visible, memorial board visible behind the subject. Soft natural lighting, shallow depth of field, realistic skin texture, realistic hands and fingers.

Mood:
Respectful, calm, solemn, sincere, not smiling, not dramatic, not fantasy.

Negative constraints:
No cartoon, no illustration, no anime, no exaggerated smile, no distorted face, no extra fingers, no wrong hands, no oversized sign, no messy background, no bright party colors, no horror mood, no fake plastic look, no unreadable Thai text, no random English text, no commercial logos.

Refine this image while keeping the same composition, background, lighting, clothing, plaque, and funeral atmosphere.

Improve only the face identity of the main person using the provided face reference. Preserve the real facial structure, hairstyle, age, skin tone, jawline, eyes, nose, and natural expression more accurately.

Do not change the pose, clothing, plaque, Thai funeral background, color tone, or overall composition. Keep the image realistic, solemn, elegant, and respectful.

Keep the same image, same person, same pose, same lighting, and same funeral background.

Fix only the long horizontal condolence plaque. Make the plaque ivory cream with a thin gold border and elegant Thai typography. The text must be centered, clear, and readable.

Correct plaque text:
"{DONOR_NAME}
{DONOR_POSITION}
{CONDOLENCE_TEXT}"

Do not change the person's face, body, clothing, pose, or background.`,
    negativePrompt: "",
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
      FACE_IDENTITY,
      COMMON_SCENE,
      "The donor performs a respectful Thai wai gesture (hands pressed together at chest) in front of a condolence wreath board.",
      "The condolence board is entirely blank with a clean cream or white surface and gold trim — no text, no writing, no markings on the board at all.",
      "The donor wears formal dark attire appropriate for a Thai Buddhist funeral.",
      "The background is a softly blurred Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, smiling broadly, distorted face, changed face, different person, idealized face, different ethnicity, different age, extra fingers, extra limbs, text on board, writing on board, letters on board, Thai characters on board, inscription, fake logos, crowded scene, disrespectful pose",
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
      FACE_IDENTITY,
      COMMON_SCENE,
      "Show the donor respectfully presenting a modest condolence board to one host representative.",
      "Both the donor and the host wear formal dark attire. The host looks calm and appreciative.",
      "The board is entirely blank with a clean cream or white surface and elegant gold border — no text, no writing, no markings on the board at all.",
      "The background is a softly blurred Thai funeral hall at [funeral_place], arranged in memory of [deceased_name].",
    ].join("\n"),
    negativePrompt:
      "cartoon, anime, caricature, party mood, bright festive colors, smiling broadly, distorted face, changed face, different person, idealized face, different ethnicity, different age, extra fingers, extra limbs, text on board, writing on board, letters on board, Thai characters on board, inscription, fake logos, large crowd, disrespectful pose",
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

  const donorGender = input.donorGender?.trim() || "female";
  const donorAgeRange = input.donorAgeRange?.trim() || "35–50 years old";

  // Build plaque text (skip empty position line)
  const plaqueLines = [
    input.donorName?.trim() || "ผู้ร่วมบุญ",
    input.donorPosition?.trim() || "",
    input.condolenceText?.trim() || "ร่วมอาลัยและร่วมทำบุญ",
  ].filter(Boolean).join("\n");

  const replacements: Record<string, string> = {
    // Old-style [token] — backward-compat with templates 2–4
    "[deceased_name]": input.deceasedName?.trim() || "ผู้วายชนม์",
    "[funeral_place]": input.funeralPlace?.trim() || "ศาลางานศพไทย",
    // New-style {TOKEN} — used in template 1
    "{DONOR_NAME}": input.donorName?.trim() || "ผู้ร่วมบุญ",
    "{DONOR_POSITION}": input.donorPosition?.trim() || "",
    "{CONDOLENCE_TEXT}": input.condolenceText?.trim() || "ร่วมอาลัยและร่วมทำบุญ",
    "{DECEASED_NAME}": input.deceasedName?.trim() || "ผู้วายชนม์",
    "{TEMPLE_NAME}": input.funeralPlace?.trim() || "ศาลางานศพไทย",
    "{DONOR_GENDER}": donorGender,
    "{DONOR_AGE_RANGE}": donorAgeRange,
    "{DONOR_FACE_REFERENCE}": "the uploaded reference photo",
    "{RECIPIENT_FACE_REFERENCE}": "the second uploaded reference photo",
    "{RECIPIENT_GENDER}": input.recipientGender?.trim() || "female",
  };

  let prompt = input.promptTemplate?.trim() || template.promptTemplate;
  for (const [token, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(token, value);
  }

  // Clean up consecutive blank lines that may appear when {DONOR_POSITION} is empty
  prompt = prompt.replace(/\n{3,}/g, "\n\n");

  // New-style prompts (template 1) already include negative constraints and mood
  // in the body — skip appending the generic suffix to avoid duplication.
  const isNewStyle = template.promptTemplate.includes("{DONOR_NAME}");

  if (isNewStyle) {
    // Append host person instruction if provided
    if (input.hostPersonName && input.hostPersonRole) {
      prompt += `\n\n${buildHostPersonInstruction(input.hostPersonName, input.hostPersonRole)}`;
    }
    return prompt.trim();
  }

  // Old-style templates: append generic style + negative suffix
  const parts = [
    prompt,
    "",
    "Style requirements:",
    "Photorealistic, vertical 2:3 composition, soft light, respectful Thai funeral atmosphere, premium but understated design.",
  ];

  if (input.hostPersonName && input.hostPersonRole) {
    parts.push("", buildHostPersonInstruction(input.hostPersonName, input.hostPersonRole));
  }

  const negativePrompt = input.negativePrompt?.trim() || template.negativePrompt;
  if (negativePrompt) {
    parts.push("", `Negative requirements: ${negativePrompt}`);
  }

  return parts.join("\n");
}

// Build plaque text for display outside of prompt building
export function buildPlaqueText(input: {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
}) {
  return [
    input.donorName?.trim() || "ผู้ร่วมบุญ",
    input.donorPosition?.trim() || "",
    input.condolenceText?.trim() || "ร่วมอาลัยและร่วมทำบุญ",
  ].filter(Boolean).join("\n");
}

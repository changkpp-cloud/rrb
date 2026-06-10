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
    promptTemplate: `Create a highly realistic ceremonial Thai funeral memorial photo for the "หรีดร่วมบุญ Zero Waste" project.

Generate a vertical portrait image of a {DONOR_GENDER} Thai person, around {DONOR_AGE_RANGE}, standing in front of a public memorial profile display for {DECEASED_NAME} inside a respectful Thai funeral hall during an evening Buddhist memorial ceremony. Use {DONOR_FACE_REFERENCE} as the face reference and preserve the real facial identity, facial structure, hairstyle, skin tone, age, and natural expression as closely as possible.

The atmosphere must be calm, elegant, dignified, solemn, and respectful. Use warm ivory, cream, beige, soft gold, and natural dried flower tones. In the background, show a memorial profile backdrop similar to the first public donation page: a framed deceased portrait, cream and gold information area for {DECEASED_NAME}, Buddhist funeral venue details at {TEMPLE_NAME}, and premium dried flowers in cream and gold tones. This background must be a real physical funeral display behind the person, not a digital overlay.

The main subject wears formal black funeral attire, elegant and respectful, with no colorful clothing. Show the person holding one realistic long horizontal Thai condolence plaque. The plaque must be similar in size to a traditional Thai wreath name tag, not oversized. The plaque must have an ivory cream background, a thin gold border, and small dried floral decorations at the corners.

The text on the held plaque must come only from {PLAQUE_PRINT_TEXT}. This is the exact text that was sent to the printer for the real condolence plaque. Do not create, add, summarize, translate, rewrite, decorate, or invent any extra text. Do not add condolence wording unless it already exists inside {PLAQUE_PRINT_TEXT}.

The held plaque must contain only this exact printed plaque text:

{PLAQUE_PRINT_TEXT}

Very important:
Show text only on the physical plaque being held by the person.
Do not add any subtitle, floating text, text overlay, lower-third title, black rectangle, dark transparent text panel, caption box, poster text, duplicated text, or any graphic text element anywhere else in the image.
Do not place any text at the bottom of the image, in front of the person, over the body, over the plaque, or over the photo.
Do not repeat the plaque text outside the plaque.
Do not show any black box or dark text background.
Keep the memorial profile information in the background soft, distant, and secondary. It may suggest the deceased portrait and memorial information layout, but it must not create a readable foreground caption or any overlay text.
This must look like a real event photograph, not a poster, not a banner, and not a graphic design layout.

Use a professional event photography style. Show full upper body, with the plaque clearly visible and the memorial board visible behind the subject. Use soft natural lighting, shallow depth of field, realistic skin texture, realistic hands and fingers. The mood must be sincere, calm, solemn, and respectful. The subject should not smile broadly.

Negative constraints:
no cartoon, no illustration, no anime, no exaggerated smile, no distorted face, no extra fingers, no wrong hands, no oversized sign, no messy background, no bright party colors, no horror mood, no fake plastic look, no unreadable Thai text, no random English text, no commercial logos, no subtitle overlay, no caption box, no black text panel, no extra typography outside the held plaque, no duplicated plaque text, no added condolence message outside {PLAQUE_PRINT_TEXT}, no black rectangle, no dark overlay box.

If needed, refine the result while keeping the same person, pose, clothing, lighting, funeral atmosphere, plaque, and overall composition. Improve only the face identity using the provided face reference and make the face more accurate while preserving the real jawline, eyes, nose, hairstyle, age, and skin tone. Also ensure the plaque text is clean, centered, elegant, readable, and appears only on the held plaque. Do not change the background, pose, clothing, or composition. Remove any black box, dark overlay, caption box, or extra text outside the physical plaque.`,
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

function buildStandingWithLabelMandatoryRules(input: {
  deceasedName?: string;
  funeralPlace?: string;
  plaqueText: string;
}) {
  const deceasedName = input.deceasedName?.trim() || "the deceased person";
  const funeralPlace = input.funeralPlace?.trim() || "the Thai funeral hall";

  return `
MANDATORY FINAL COMPOSITION RULES FOR THE STANDING PLAQUE PHOTO:
The final image must be a real event-style photograph only. It must not look like a poster, edited social graphic, e-card, app screen, or design mockup.

There must be exactly one readable text area in the whole image: the physical cream-and-gold condolence plaque held by the person. That held plaque must contain only this exact printed text:
${input.plaqueText}

Never create a black rectangle, dark translucent bar, lower-third caption, subtitle panel, name caption, title card, sticker, floating label, app overlay, or any graphic text box anywhere in the image. Do not duplicate the plaque text over the person's body, over the bottom of the image, or over the plaque.
The held plaque itself must stay ivory or cream with a thin gold border. Never cover the held plaque with a black strip, dark transparent strip, shadow label, or any dark backing behind the plaque text.

The background behind the standing person must resemble the public memorial profile area from the first donation page: a calm Thai Buddhist memorial display for ${deceasedName}, with a framed deceased portrait, cream/gold memorial information board, flower arrangements, and funeral venue context at ${funeralPlace}. The memorial information display must be a real physical background element, not a digital overlay. Keep any background writing soft, distant, blurred, or unreadable so it does not compete with the held plaque.

If the model tries to add any text outside the held plaque, remove it. If the model tries to add a black or dark caption box, remove it completely.`;
}

function buildDonorDemographicInstruction(gender: string, ageRange: string) {
  const normalizedGender = gender.toLowerCase();
  const clothing =
    normalizedGender === "male"
      ? "The donor must present as male and wear male formal Thai funeral attire only: a black suit jacket or black formal shirt with black trousers. Do not use a dress, blouse, skirt, feminine blazer cut, feminine accessories, or feminine hairstyle."
      : normalizedGender === "female"
      ? "The donor must present as female and wear female formal Thai funeral attire only: a modest black dress, black blouse with skirt, or black formal women's suit. Do not use male suit proportions, masculine haircut, or masculine body shape unless present in the reference photo."
      : "The donor must use neutral formal black Thai funeral attire and must follow the gender presentation visible in the reference photo. Do not force male or female clothing that contradicts the reference photo.";

  return [
    "DONOR DEMOGRAPHICS AND CLOTHING ARE MANDATORY:",
    `Declared donor gender: ${gender}.`,
    `Declared donor age range: ${ageRange}.`,
    clothing,
    "Keep the donor's apparent age consistent with the declared age range and the reference photo.",
    "Never change the donor's gender presentation, age group, body type, or funeral clothing category.",
  ].join("\n");
}

export function buildAiPhotoPrompt(input: AiPhotoPromptInput) {
  const template = getAiPhotoTemplate(input.templateKey);

  const donorGender = input.donorGender?.trim() || "male";
  const donorAgeRange = input.donorAgeRange?.trim() || "46-60 years old";

  // Build plaque text from the 2 printed fields only
  // Field 1: ชื่อ หรือ หน่วยงาน → donorName
  // Field 2: ตำแหน่ง หรือ ข้อความอาลัย → donorPosition
  const plaqueLines = [
    input.donorName?.trim() || "ผู้ร่วมบุญ",
    input.donorPosition?.trim(),
  ].filter(Boolean).join("\n");

  const replacements: Record<string, string> = {
    // Old-style [token] — backward-compat with templates 2–4
    "[deceased_name]": input.deceasedName?.trim() || "ผู้วายชนม์",
    "[funeral_place]": input.funeralPlace?.trim() || "ศาลางานศพไทย",
    // New-style {TOKEN}
    "{PLAQUE_PRINT_TEXT}": plaqueLines,
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
  const isNewStyle =
    template.promptTemplate.includes("{PLAQUE_PRINT_TEXT}") ||
    template.promptTemplate.includes("{DONOR_GENDER}");

  if (isNewStyle) {
    prompt += `\n\n${buildDonorDemographicInstruction(donorGender, donorAgeRange)}`;

    if (template.templateKey === "standing_with_label") {
      prompt += `\n\n${buildStandingWithLabelMandatoryRules({
        deceasedName: input.deceasedName,
        funeralPlace: input.funeralPlace,
        plaqueText: plaqueLines,
      })}`;
    }

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

  parts.push("", buildDonorDemographicInstruction(donorGender, donorAgeRange));

  return parts.join("\n");
}

// Build plaque text (2 fields only — matches the print-name form)
export function buildPlaqueText(input: {
  donorName: string;
  donorPosition?: string;
}) {
  return [
    input.donorName?.trim() || "ผู้ร่วมบุญ",
    input.donorPosition?.trim(),
  ].filter(Boolean).join("\n");
}

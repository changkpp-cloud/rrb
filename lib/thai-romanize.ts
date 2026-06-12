/**
 * Best-effort RTGS-based Thai to ASCII romanization for URL slugs.
 * Handles consonants, leading vowels, following vowels, tone marks (stripped),
 * and silent-hor (อักษรนำ ห) clusters.
 */

const CONSONANT: Record<string, string> = {
  "ก": "k",   "ข": "kh",  "ฃ": "kh",  "ค": "kh",  // ก ข ฃ ค
  "ฅ": "kh",  "ฆ": "kh",                                       // ฅ ฆ
  "ง": "ng",                                                         // ง
  "จ": "ch",  "ฉ": "ch",  "ช": "ch",  "ซ": "s",    // จ ฉ ช ซ
  "ฌ": "ch",  "ญ": "y",                                        // ฌ ญ
  "ฎ": "d",   "ฏ": "t",   "ฐ": "th",  "ฑ": "th",   // ฎ ฏ ฐ ฑ
  "ฒ": "th",  "ณ": "n",                                        // ฒ ณ
  "ด": "d",   "ต": "t",   "ถ": "th",  "ท": "th",   // ด ต ถ ท
  "ธ": "th",  "น": "n",                                        // ธ น
  "บ": "b",   "ป": "p",   "ผ": "ph",  "ฝ": "f",    // บ ป ผ ฝ
  "พ": "ph",  "ฟ": "f",   "ภ": "ph",  "ม": "m",    // พ ฟ ภ ม
  "ย": "y",   "ร": "r",   "ล": "l",   "ว": "w",    // ย ร ล ว
  "ศ": "s",   "ษ": "s",   "ส": "s",   "ห": "h",    // ศ ษ ส ห
  "ฬ": "l",   "อ": "",    "ฮ": "h",                      // ฬ อ ฮ
};

// ห before these consonants = silent tone marker (อักษรนำ ห)
const H_CLUSTER = new Set([
  "ง", // ง
  "น", // น
  "ม", // ม
  "ย", // ย
  "ร", // ร
  "ล", // ล
  "ว", // ว
]);

// Vowels that appear BEFORE the consonant in writing
const LEAD_VOWEL: Record<string, string> = {
  "เ": "e",   // เ
  "แ": "ae",  // แ
  "โ": "o",   // โ
  "ใ": "ai",  // ใ
  "ไ": "ai",  // ไ
};

// Vowels that appear after/above/below the consonant + tone marks (stripped)
const FOLLOW_VOWEL: Record<string, string> = {
  "ั": "a",   // ั  sara a (mai han akat)
  "า": "a",   // า  sara aa
  "ำ": "am",  // ำ  sara am
  "ิ": "i",   // ิ  sara i
  "ี": "i",   // ี  sara ii
  "ึ": "ue",  // ึ  sara ue
  "ื": "ue",  // ื  sara uee
  "ุ": "u",   // ุ  sara u
  "ู": "u",   // ู  sara uu
  "็": "",    // ็  maitaikhu (short vowel)
  "ะ": "a",   // ะ  sara a
  // tone marks → silent
  "่": "",    // ่  mai ek
  "้": "",    // ้  mai tho
  "๊": "",    // ๊  mai tri
  "๋": "",    // ๋  mai jat
  "์": "",    // ์  thanthakat
  "ํ": "",    // ํ  nikhahit
  "๎": "",    // ๎  yamakkan
};

/**
 * Romanize the first word of a Thai name into a lowercase URL-safe ASCII string.
 *
 * Examples:
 *   "สุภาพร รัตนา"  →  "suphaphr"
 *   "สมชาย"         →  "smchay"
 *   "วิชัย"          →  "wichay"
 */
export function romanizeThaiFirstName(thaiName: string): string {
  const firstName = thaiName.trim().split(/\s+/)[0] ?? "";
  const chars = [...firstName]; // spread handles multi-codepoint correctly
  let out = "";
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    // Silent-ห cluster: ห before ง น ม ย ร ล ว → skip ห, handle next char normally
    if (ch === "ห" && i + 1 < chars.length && H_CLUSTER.has(chars[i + 1])) {
      i++;
      continue;
    }

    // Leading vowel: written before consonant, but consonant sound comes first
    if (ch in LEAD_VOWEL) {
      const vowelSound = LEAD_VOWEL[ch];
      i++;
      if (i < chars.length && chars[i] in CONSONANT) {
        out += (CONSONANT[chars[i]] ?? "") + vowelSound;
        i++;
        while (i < chars.length && chars[i] in FOLLOW_VOWEL) {
          out += FOLLOW_VOWEL[chars[i]] ?? "";
          i++;
        }
      } else {
        out += vowelSound;
      }
      continue;
    }

    if (ch in CONSONANT) {
      out += CONSONANT[ch] ?? "";
      i++;
      while (i < chars.length && chars[i] in FOLLOW_VOWEL) {
        out += FOLLOW_VOWEL[chars[i]] ?? "";
        i++;
      }
      continue;
    }

    if (ch in FOLLOW_VOWEL) {
      out += FOLLOW_VOWEL[ch] ?? "";
      i++;
      continue;
    }

    // ASCII passthrough (name might contain English letters)
    if (/[a-z0-9]/i.test(ch)) out += ch.toLowerCase();
    i++;
  }

  return out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

/**
 * Best-effort RTGS-based Thai to ASCII romanization for URL slugs.
 * Handles consonants, leading vowels, following vowels, tone marks, and
 * silent ho hip clusters. This is intentionally simple and slug-focused.
 */

const CONSONANT: Record<string, string> = {
  "\u0e01": "k", "\u0e02": "kh", "\u0e03": "kh", "\u0e04": "kh", "\u0e05": "kh", "\u0e06": "kh",
  "\u0e07": "ng",
  "\u0e08": "ch", "\u0e09": "ch", "\u0e0a": "ch", "\u0e0b": "s", "\u0e0c": "ch", "\u0e0d": "y",
  "\u0e0e": "d", "\u0e0f": "t", "\u0e10": "th", "\u0e11": "th", "\u0e12": "th", "\u0e13": "n",
  "\u0e14": "d", "\u0e15": "t", "\u0e16": "th", "\u0e17": "th", "\u0e18": "th", "\u0e19": "n",
  "\u0e1a": "b", "\u0e1b": "p", "\u0e1c": "ph", "\u0e1d": "f", "\u0e1e": "ph", "\u0e1f": "f",
  "\u0e20": "ph", "\u0e21": "m",
  "\u0e22": "y", "\u0e23": "r", "\u0e25": "l", "\u0e27": "w",
  "\u0e28": "s", "\u0e29": "s", "\u0e2a": "s", "\u0e2b": "h", "\u0e2c": "l", "\u0e2d": "", "\u0e2e": "h",
};

// Ho hip before these consonants acts as a silent tone marker.
const H_CLUSTER = new Set([
  "\u0e07",
  "\u0e19",
  "\u0e21",
  "\u0e22",
  "\u0e23",
  "\u0e25",
  "\u0e27",
]);

const LEAD_VOWEL: Record<string, string> = {
  "\u0e40": "e",
  "\u0e41": "ae",
  "\u0e42": "o",
  "\u0e43": "ai",
  "\u0e44": "ai",
};

const FOLLOW_VOWEL: Record<string, string> = {
  "\u0e31": "a",
  "\u0e32": "a",
  "\u0e33": "am",
  "\u0e34": "i",
  "\u0e35": "i",
  "\u0e36": "ue",
  "\u0e37": "ue",
  "\u0e38": "u",
  "\u0e39": "u",
  "\u0e30": "a",
  "\u0e47": "",
  "\u0e48": "",
  "\u0e49": "",
  "\u0e4a": "",
  "\u0e4b": "",
  // \u0e4c (\u0e01\u0e32\u0e23\u0e31\u0e19\u0e15\u0e4c/\u0e17\u0e31\u0e13\u0e11\u0e06\u0e32\u0e15) \u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e41\u0e22\u0e01\u0e43\u0e19 loop \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e25\u0e1a\u0e1e\u0e22\u0e31\u0e0d\u0e0a\u0e19\u0e30\u0e17\u0e35\u0e48\u0e16\u0e39\u0e01\u0e17\u0e33\u0e43\u0e2b\u0e49\u0e40\u0e07\u0e35\u0e22\u0e1a
  "\u0e4d": "",
  "\u0e4e": "",
};

// \u0e01\u0e32\u0e23\u0e31\u0e19\u0e15\u0e4c \u2014 \u0e17\u0e33\u0e43\u0e2b\u0e49\u0e1e\u0e22\u0e31\u0e0d\u0e0a\u0e19\u0e30\u0e15\u0e31\u0e27\u0e2b\u0e19\u0e49\u0e32\u0e40\u0e07\u0e35\u0e22\u0e1a
const THANTHAKHAT = "\u0e4c";

// คำนำหน้าชื่อ (title) ที่ต้องตัดออกก่อนหา "ชื่อจริง" สำหรับตั้ง slug
// เรียงจากยาว→สั้น เพื่อให้ "นางสาว" ถูกตัดก่อน "นาง"/"นาย"
const THAI_TITLES = [
  "นางสาว", "เด็กชาย", "เด็กหญิง", "สามเณร", "แม่ชี",
  "นาง", "นาย", "น.ส.", "ด.ช.", "ด.ญ.", "คุณ", "พระ",
  "ดร.", "ศ.", "รศ.", "ผศ.",
  "นพ.", "พญ.", "ทพ.", "ทพญ.", "ภก.", "ภญ.",
  "พล.อ.", "พล.ท.", "พล.ต.", "พ.อ.", "พ.ท.", "พ.ต.", "ร.อ.", "ร.ท.", "ร.ต.",
  "พล.ต.อ.", "พล.ต.ท.", "พล.ต.ต.", "พ.ต.อ.", "พ.ต.ท.", "พ.ต.ต.",
  "จ.ส.อ.", "จ.ส.ท.", "จ.ส.ต.", "ส.อ.", "ส.ท.", "ส.ต.",
].sort((a, b) => b.length - a.length);

/** ตัดคำนำหน้าชื่อออกจากต้นชื่อ (วนตัดกรณีมีหลายคำนำหน้า เช่น "พล.อ. ดร.") */
function stripThaiTitles(name: string): string {
  let s = name.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of THAI_TITLES) {
      if (s.startsWith(t)) {
        s = s.slice(t.length).trim();
        changed = true;
        break;
      }
    }
  }
  return s || name.trim();
}

/**
 * Romanize the first word of a Thai name into a URL-safe ASCII string.
 * ตัดคำนำหน้า (นางสาว/นาย/…) ออกก่อน เพื่อให้ slug เป็นชื่อจริงไม่ใช่คำนำหน้า
 */
export function romanizeThaiFirstName(thaiName: string): string {
  const firstName = stripThaiTitles(thaiName).split(/\s+/)[0] ?? "";
  const chars = [...firstName];
  // \u0e40\u0e01\u0e47\u0e1a\u0e40\u0e1b\u0e47\u0e19\u0e0a\u0e34\u0e49\u0e19\u0e46 \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e43\u0e2b\u0e49\u0e01\u0e32\u0e23\u0e31\u0e19\u0e15\u0e4c\u0e25\u0e1a\u0e40\u0e2a\u0e35\u0e22\u0e07\u0e1e\u0e22\u0e31\u0e0d\u0e0a\u0e19\u0e30\u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14\u0e44\u0e14\u0e49
  const pieces: string[] = [];
  let lastConsonant = -1;
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    // \u0e01\u0e32\u0e23\u0e31\u0e19\u0e15\u0e4c (\u0e4c) \u2192 \u0e17\u0e33\u0e43\u0e2b\u0e49\u0e1e\u0e22\u0e31\u0e0d\u0e0a\u0e19\u0e30\u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14\u0e40\u0e07\u0e35\u0e22\u0e1a \u0e40\u0e0a\u0e48\u0e19 \u0e1b\u0e23\u0e30\u0e22\u0e38\u0e17\u0e18\u0e4c \u2192 prayut
    if (ch === THANTHAKHAT) {
      if (lastConsonant >= 0) {
        pieces.splice(lastConsonant, 1);
        lastConsonant = -1;
      }
      i++;
      continue;
    }

    if (ch === "\u0e2b" && i + 1 < chars.length && H_CLUSTER.has(chars[i + 1])) {
      i++;
      continue;
    }

    if (ch in LEAD_VOWEL) {
      const vowelSound = LEAD_VOWEL[ch];
      i++;
      if (i < chars.length && chars[i] in CONSONANT) {
        pieces.push(CONSONANT[chars[i]] ?? "");
        lastConsonant = pieces.length - 1;
        pieces.push(vowelSound);
        i++;
        while (i < chars.length && chars[i] in FOLLOW_VOWEL) {
          pieces.push(FOLLOW_VOWEL[chars[i]] ?? "");
          i++;
        }
      } else {
        pieces.push(vowelSound);
      }
      continue;
    }

    if (ch in CONSONANT) {
      pieces.push(CONSONANT[ch] ?? "");
      lastConsonant = pieces.length - 1;
      i++;
      while (i < chars.length && chars[i] in FOLLOW_VOWEL) {
        pieces.push(FOLLOW_VOWEL[chars[i]] ?? "");
        i++;
      }
      continue;
    }

    if (ch in FOLLOW_VOWEL) {
      pieces.push(FOLLOW_VOWEL[ch] ?? "");
      i++;
      continue;
    }

    if (/[a-z0-9]/i.test(ch)) pieces.push(ch.toLowerCase());
    i++;
  }

  return pieces
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

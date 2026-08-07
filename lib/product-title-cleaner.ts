const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bplayer\s+version\b/gi, "Player"],
  [/\bfans?\s+version\b/gi, "Fan"],
  [/\bhome\b/gi, "Local"],
  [/\baway\b/gi, "Visitante"],
  [/\bthird\b/gi, "Tercera"],
  [/\bfourth\b/gi, "Cuarta"],
  [/\bgoalkeeper\b/gi, "Portero"],
  [/\bGK\b/g, "Portero"],
  [/\bwomen'?s?\b/gi, "Mujer"],
  [/\bladies\b/gi, "Mujer"],
  [/\bchildren\b/gi, "Niño"],
  [/\bkids?\b/gi, "Niño"],
  [/\blong\s+sleeve\b/gi, "Manga larga"],
  [/\bshort\s+sleeve\b/gi, "Manga corta"],
  [/\bpre[-\s]?match\b/gi, "Prepartido"],
  [/\btraining\b/gi, "Entrenamiento"],
  [/\bchampion\s+edition\b/gi, "Edición Campeón"],
  [/\bspecial\s+edition\b/gi, "Edición Especial"],
  [/\b2[-\s]?star\b/gi, "2 Estrellas"],
  [/\b3[-\s]?star\b/gi, "3 Estrellas"],
  [/\b4[-\s]?star\b/gi, "4 Estrellas"],
  [/\b5[-\s]?star\b/gi, "5 Estrellas"],

  [/\bunited\s+states\b/gi, "Estados Unidos"],
  [/\bUSA\b/g, "Estados Unidos"],
  [/\bnetherlands\b/gi, "Países Bajos"],
  [/\bengland\b/gi, "Inglaterra"],
  [/\bgermany\b/gi, "Alemania"],
  [/\bfrance\b/gi, "Francia"],
  [/\bbrazil\b/gi, "Brasil"],
  [/\bspain\b/gi, "España"],
  [/\bitaly\b/gi, "Italia"],
  [/\bportugal\b/gi, "Portugal"],
  [/\bargentina\b/gi, "Argentina"],
  [/\bnorway\b/gi, "Noruega"],
  [/\bjapan\b/gi, "Japón"],
  [/\bmexico\b/gi, "México"],
  [/\bbelgium\b/gi, "Bélgica"],
  [/\bcroatia\b/gi, "Croacia"],
  [/\bcolombia\b/gi, "Colombia"],
];

const REMOVE_PATTERNS: RegExp[] = [
  /\b1\s*:\s*1\b/gi,
  /\bAAA\b/gi,
  /\btop\s+quality\b/gi,
  /\bthailand\s+quality\b/gi,
  /\bthai\s+(?:quality|version)\b/gi,
  /\bproduction\s+(?:is\s+)?underway\b/gi,
  /\bproduction\s+has\s+begun\b/gi,
  /\bpre[-\s]?orders?\s+are\s+now\s+being\s+accept(?:ed)?\b/gi,
  /\borders?\s+are\s+now\s+being\s+accepted\b/gi,
  /\bnow\s+being\s+accepted\b/gi,
  /\bpre[-\s]?(?:order|sale)s?\b/gi,
  /\bready\s+to\s+order\b/gi,
  /\bin\s+stock\b/gi,
  /\bnew\s+arrival\b/gi,
  /\bsoccer\s+jersey\b/gi,
  /\bfootball\s+(?:jersey|shirt)\b/gi,
  /\bcamiseta\s+de\s+f[uú]tbol\b/gi,
  /\bshirt\s+only\b/gi,
  /\bwithout\s+sponsors?\b/gi,
  /\bwith\s+sponsors?\b/gi,
  /\bjersey\b/gi,
  /\bsizes?\b/gi,

  /\b(?:XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\s*[-–—]\s*(?:XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\b/gi,
  /#\s*[A-Z0-9-]{4,}/gi,
  /\b(?:SKU|CODE|ITEM)\s*:\s*[A-Z0-9-]+\b/gi,
  /\b\d{10,}\b/g,
  /\[\s*[A-Z0-9_-]{4,}\s*\]/gi,
];

const REMOVE_PARENTHESIS_PATTERN =
  /\((?=[^)]*\b(?:production|pre[-\s]?order|accepted|underway|stock|quality|supplier)\b)[^)]*\)/gi;

function removeConsecutiveDuplicateWords(value: string) {
  const words = value.split(/\s+/);
  const result: string[] = [];

  for (const word of words) {
    const previous = result[result.length - 1];
    if (
      previous &&
      previous.localeCompare(word, "es", { sensitivity: "base" }) === 0
    ) {
      continue;
    }

    result.push(word);
  }

  return result.join(" ");
}

export function cleanProductTitle(value: string): string {
  const original = String(value ?? "").trim();

  if (!original) return original;

  let cleaned = original.replace(REMOVE_PARENTHESIS_PATTERN, " ");

  for (const pattern of REMOVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  for (const [pattern, replacement] of REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\s+([,.;:/)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/^[\s,.;:/|_\-–—]+|[\s,.;:/|_\-–—]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = removeConsecutiveDuplicateWords(cleaned)
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 3 ? cleaned : original;
}

export function createProductSlug(value: string): string {
  return cleanProductTitle(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

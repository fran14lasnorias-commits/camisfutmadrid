import { z } from "zod";
import { slugify } from "@/lib/admin-products";

export const ImportRequestSchema = z.object({
  url: z.string().url(),
});

export type ImportDraft = {
  sourceUrl: string;
  name: string;
  slug: string;
  team: string;
  season: string;
  type: "fan" | "player" | "retro" | "kids";
  suggestedPriceEur: number;
  supplierCostUsd: number;
  description: string;
  images: string[];
  confidence: number;
  warnings: string[];
};

function detectTeam(text: string) {
  const teams = [
    "Real Madrid","Barcelona","Atlético","Arsenal","Chelsea","Liverpool",
    "Manchester United","Manchester City","PSG","Juventus","Milan","Inter",
    "Dortmund","Argentina","España","Brasil","Portugal"
  ];
  return teams.find(team=>text.toLowerCase().includes(team.toLowerCase())) ?? "Equipo por revisar";
}

function detectType(text: string): ImportDraft["type"] {
  const value = text.toLowerCase();
  if (value.includes("player")) return "player";
  if (value.includes("retro")) return "retro";
  if (value.includes("kids") || value.includes("kid")) return "kids";
  return "fan";
}

function supplierCostFor(type: ImportDraft["type"]) {
  if (type === "player") return 15;
  if (type === "retro") return 14;
  if (type === "kids") return 13;
  return 10;
}

function sellingPriceFor(type: ImportDraft["type"]) {
  if (type === "player") return 27;
  if (type === "retro") return 28;
  if (type === "kids") return 27;
  return 25;
}

export async function buildImportDraft(url: string): Promise<ImportDraft> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 CamisfutMadrid Importer",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`El proveedor respondió con estado ${response.status}`);
  }

  const html = await response.text();
  const title =
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() ??
    "Producto importado";

  const ogImages = Array.from(
    html.matchAll(/property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)
  ).map(match=>match[1]);

  const jpgs = Array.from(
    html.matchAll(/https?:\\?\/\\?\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi)
  )
    .map(match=>match[0].replaceAll("\\",""))
    .filter((value,index,array)=>array.indexOf(value)===index)
    .slice(0,12);

  const images = [...ogImages,...jpgs]
    .filter((value,index,array)=>array.indexOf(value)===index)
    .slice(0,8);

  const team = detectTeam(`${title} ${html.slice(0,25000)}`);
  const type = detectType(`${title} ${html.slice(0,25000)}`);
  const seasonMatch = `${title} ${html}`.match(/20\d{2}\s*[\/-]\s*\d{2,4}|20\d{2}/);
  const season = seasonMatch?.[0]?.replace(/\s/g,"") ?? "";

  const cleanName = [team,season,type==="fan"?"Fan":type==="player"?"Player":type==="retro"?"Retro":"Kids"]
    .filter(Boolean)
    .join(" ");

  const warnings = [];
  if (!images.length) warnings.push("No se detectaron imágenes automáticamente.");
  if (team === "Equipo por revisar") warnings.push("Revisa el equipo.");
  if (!season) warnings.push("Revisa la temporada.");

  return {
    sourceUrl: url,
    name: cleanName,
    slug: slugify(cleanName),
    team,
    season,
    type,
    suggestedPriceEur: sellingPriceFor(type),
    supplierCostUsd: supplierCostFor(type),
    description: `${cleanName}. Producto pendiente de revisión antes de publicar.`,
    images,
    confidence: Math.max(40, 95 - warnings.length * 20),
    warnings,
  };
}

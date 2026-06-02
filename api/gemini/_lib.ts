/**
 * Shared Gemini AI utilities — used by all api/gemini/* handlers.
 *
 * To add your API key:
 *   • Local dev  → create a .env file:  GEMINI_API_KEY=your_key_here
 *   • Vercel     → Settings → Environment Variables → GEMINI_API_KEY
 */

import { GoogleGenAI } from "@google/genai";

// ── Model ─────────────────────────────────────────────────────────────────────
export const GEMINI_MODEL = "gemini-2.0-flash";

// ── API key resolution ────────────────────────────────────────────────────────
function resolveApiKey(req: any): string {
  // 1. Per-request override header (used by admin panel)
  const headerKey = (req?.headers?.["x-gemini-key"] as string | undefined)?.trim();
  if (headerKey) return headerKey;
  // 2. Environment variable
  return (process.env.GEMINI_API_KEY || "").trim();
}

export function createClient(req: any): GoogleGenAI {
  return new GoogleGenAI({ apiKey: resolveApiKey(req) });
}

/** Returns an error message string if the key is missing, null otherwise. */
export function checkApiKey(req: any): string | null {
  if (!resolveApiKey(req)) {
    return "GEMINI_API_KEY muhit o'zgaruvchisi sozlanmagan. Vercel → Settings → Environment Variables da o'rnating.";
  }
  return null;
}

// ── CORS ─────────────────────────────────────────────────────────────────────
export function applyCors(res: any): void {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Gemini-Key, X-AI-Provider, Accept"
  );
}

/** Returns true if the request was an OPTIONS preflight (caller should return). */
export function handlePreflight(req: any, res: any): boolean {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

// ── Response helper ───────────────────────────────────────────────────────────
export function extractText(response: any): string {
  // .text is a getter in @google/genai that returns the first text part
  if (typeof response?.text === "string") return response.text;
  // Fallback: navigate the candidates structure manually
  return (
    response?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  );
}

// ── Error classifier ──────────────────────────────────────────────────────────
export function classifyError(err: any): { status: number; message: string } {
  const httpStatus: number = err?.status ?? err?.httpStatus ?? 0;
  const msg: string = (err?.message ?? String(err)).toLowerCase();

  if (httpStatus === 429 || msg.includes("quota") || msg.includes("rate")) {
    return { status: 429, message: "So'rovlar limiti tugadi. Bir oz kuting va qayta urinib ko'ring." };
  }
  if (httpStatus === 403 || msg.includes("api key") || msg.includes("permission")) {
    return { status: 403, message: "API kalit noto'g'ri yoki ruxsat yo'q. Kalitni tekshiring." };
  }
  if (httpStatus === 400 || msg.includes("invalid")) {
    return { status: 400, message: "So'rov ma'lumotlari noto'g'ri." };
  }
  return { status: 500, message: "AI xizmati vaqtincha ishlamayapti. Keyinroq urinib ko'ring." };
}

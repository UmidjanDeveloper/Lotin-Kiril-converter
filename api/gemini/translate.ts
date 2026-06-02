import { handlePreflight, checkApiKey, createClient, extractText, classifyError, GEMINI_MODEL } from "./_lib";

const LANG_NAMES: Record<string, string> = {
  uz:  "O'zbek tili (lotin alifbosi)",
  ru:  "Rus tili",
  en:  "Ingliz tili",
  kk:  "Qozoq tili",
  tr:  "Turk tili",
  ar:  "Arab tili",
  auto: "Avtomatik aniqlash",
};

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovlari qabul qilinadi." });
  }

  const keyError = checkApiKey(req);
  if (keyError) {
    return res.status(503).json({ error: keyError, code: "NO_API_KEY" });
  }

  try {
    const { text, sourceLang, targetLang } = req.body ?? {};

    if (!text?.trim()) {
      return res.status(400).json({ error: "Tarjima qilinadigan matn kiritilmadi." });
    }
    if (text.trim().length > 10000) {
      return res.status(400).json({ error: "Matn juda uzun (maksimal 10 000 belgi)." });
    }

    const srcLabel = LANG_NAMES[sourceLang] ?? "Avtomatik aniqlash";
    const tgtLabel = LANG_NAMES[targetLang] ?? LANG_NAMES.ru;

    const prompt = `Siz professional ko'p tilli tarjimonsiz.

Manba tili: ${srcLabel}
Maqsad tili: ${tgtLabel}

Qoidalar:
• Faqat tarjimani qaytaring — hech qanday kirish gaplari, izohlar yo'q
• Asl formatlash (qatorlar, paragraflar, tinish belgilari) saqlansin
• O'zbek tilida: rasmiy lotin imlosidan foydalaning (o', g', sh, ch, ng, ...)
• Atamalar va maxsus nomlar to'g'ri o'girilsin

Tarjima qilinadigan matn:
---
${text.trim()}
---`;

    const ai = createClient(req);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    });

    const output = extractText(response);
    if (!output) {
      return res.status(502).json({ error: "AI bo'sh javob qaytardi." });
    }

    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("[translate] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

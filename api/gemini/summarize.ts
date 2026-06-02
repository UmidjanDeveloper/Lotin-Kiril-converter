import { handlePreflight, checkApiKey, createClient, extractText, classifyError, GEMINI_MODEL } from "./_lib";

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
    const { text, lang } = req.body ?? {};

    if (!text?.trim()) {
      return res.status(400).json({ error: "Konspektlanadigan matn kiritilmadi." });
    }
    if (text.trim().length > 20000) {
      return res.status(400).json({ error: "Matn juda uzun (maksimal 20 000 belgi)." });
    }

    const langLabel =
      lang === "ru" ? "Rus tili" : lang === "en" ? "Ingliz tili" : "O'zbek tili (lotin)";

    const prompt = `Siz professional hujjat tahlilchisi va konspektlovchisiz.

Vazifa: Quyidagi matnni professional tarzda konspektlang.
Javob tili: ${langLabel}

Konspekt strukturasi:
1. **Asosiy g'oya** — 1-2 jumla (matnning mohiyati)
2. **Muhim nuqtalar** — 3-7 ta qisqa band (bullet) shaklida
3. **Xulosa** — 1-2 jumla (yakuniy fikr yoki tavsiya)

Qoidalar:
• Markdown formatlash ishlatilsin (**, •, 1. 2. 3.)
• Faqat matn asosida — o'z fikringizni qo'shmang
• Muhim raqamlar, sanalar, ismlar saqlansin

Matn:
---
${text.trim()}
---`;

    const ai = createClient(req);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 2048,
        temperature: 0.3,
      },
    });

    const output = extractText(response);
    if (!output) {
      return res.status(502).json({ error: "AI bo'sh javob qaytardi." });
    }

    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("[summarize] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

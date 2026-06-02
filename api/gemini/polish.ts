import { handlePreflight, checkApiKey, createClient, extractText, classifyError, GEMINI_MODEL } from "./_lib";

type PolishStyle = "official" | "literary" | "conversational" | "spellcheck";

const STYLE_PROMPTS: Record<PolishStyle, string> = {
  official:
    "Rasmiy-idoraviy uslubda qayta tahrirla. Norasmiy so'zlarni va iboralarni professional huquqiy/idoraviy atamalarga almashtir. Hujjat standartlariga to'liq mos keltir.",
  literary:
    "Adabiy-badiiy uslubda boyit. O'zbek tilining so'z boyligidan foydalanib, matnni go'zal, jozibali va ta'sirchan qil. Badiiy tasviriy vositalarni qo'shing.",
  conversational:
    "Samimiy va do'stona suhbat ohangiga o'tkazib tahrirla. Og'ir konstruksiyalarni soddalashtir, tabiiy va yoqimli til ishlet.",
  spellcheck:
    "Faqat imlo, punktuatsiya va grammatika xatolarini to'g'irla. Asl uslub, so'z tanlovi va mazmunni TO'LIQ SAQLASHINGIZ SHART — hech nima o'zgartirmang, faqat xato tuzat.",
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
    const { text, style } = req.body ?? {};

    if (!text?.trim()) {
      return res.status(400).json({ error: "Sayqallanadigan matn kiritilmadi." });
    }
    if (text.trim().length > 10000) {
      return res.status(400).json({ error: "Matn juda uzun (maksimal 10 000 belgi)." });
    }

    const styleKey: PolishStyle =
      (["official", "literary", "conversational", "spellcheck"] as PolishStyle[]).includes(style)
        ? (style as PolishStyle)
        : "spellcheck";

    const styleInstruction = STYLE_PROMPTS[styleKey];

    const prompt = `Siz professional matn tahrirchisi, korrektor va o'zbek tili filologisiz.

Vazifa: ${styleInstruction}

Qoidalar:
• Faqat tahrirlangan matnni qaytaring — hech qanday izoh, tushuntirish yoki kirish gaplari yozmang
• Fikrning asl ma'nosini buzmang
• Formatlash (qatorlar, paragraflar) saqlansin

Matn:
---
${text.trim()}
---`;

    const ai = createClient(req);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 4096,
        temperature: styleKey === "spellcheck" ? 0.1 : 0.5,
      },
    });

    const output = extractText(response);
    if (!output) {
      return res.status(502).json({ error: "AI bo'sh javob qaytardi." });
    }

    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("[polish] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

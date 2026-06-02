import { handlePreflight, checkApiKey, createClient, extractText, classifyError, GEMINI_MODEL } from "./_lib";

const TEMPLATE_LABELS: Record<string, string> = {
  ariza:        "Ariza (mehnat ta'tili, shaxsiy masala)",
  tushuntirish: "Tushuntirish xati",
  tavsifnoma:   "Tavsifnoma (xarakteristika)",
  shartnoma:    "Ikki tomonlama oldi-sotdi shartnomasi",
  bildirgi:     "Bildirgi / Dokladnaya xati",
  malumotnoma:  "Ma'lumotnoma",
  free:         "Erkin rasmiy murojaat",
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
    const { templateType, to, from, detail } = req.body ?? {};

    const typeLabel = TEMPLATE_LABELS[templateType] ?? TEMPLATE_LABELS.free;

    const prompt = `Siz professional hujjatchi, yurist va o'zbek tili rasmiy-idoraviy uslub mutaxassisiz.

Hujjat turi: ${typeLabel}
Kimga: ${to || "Tegishli mas'ul shaxs/rahbariyatga"}
Kimdan: ${from || "Murojaat etuvchi"}
Tafsilot/sabab: ${detail || "Shaxsiy masalalar yuzasidan"}

Qoidalar (MAJBURIY):
1. Hujjatning to'liq rasmiy andozasini saqlang:
   - Yuqori o'ng burchak: kimga va kimdan (shlyapka) — har satr o'ngga tekislangan
   - Markaz: sarlavha KATTA HARFLAR bilan ("ARIZA", "SHARTNOMA", va h.k.)
   - Asosiy matn: rasmiy-idoraviy uslubda, aniq va bexato
   - Quyi qism: imzo va sana joylashtirish uchun ("Imzo: ___________", "Sana: ___________")
2. Markdown belgilari (#, **, *, _) QATIY TAQIQLANADI — faqat toza oddiy matn
3. Kirish so'zlari ("Mana sizning arizangiz:", "Albatta!" va h.k.) YOZMANG — faqat hujjat matni
4. Shartnomada: 2 tomonning huquq, majburiyat, to'lov shartlari alohida bandlarda
5. Imlo va tinish belgilari to'g'ri, so'zlar orasida keraksiz bo'shliq yo'q`;

    const ai = createClient(req);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 3000,
        temperature: 0.4,
      },
    });

    const output = extractText(response);
    if (!output) {
      return res.status(502).json({ error: "AI bo'sh javob qaytardi." });
    }

    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("[document] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

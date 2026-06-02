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
    const { messages, query, lang } = req.body ?? {};

    if (!query?.trim()) {
      return res.status(400).json({ error: "Xabar matni kiritilmadi." });
    }

    const ai = createClient(req);

    const systemInstruction = [
      "Siz Hujjat.uz platformasining aqlli AI yordamchisisiz.",
      "Quyidagi sohalarda yordam berasiz:",
      "• O'zbek Lotin ↔ Kirill transliteratsiyasi",
      "• Rasmiy o'zbek hujjatlari (ariza, shartnoma, tavsifnoma, tushuntirish xati)",
      "• PDF birlashtirish, bo'lish, siqish va boshqa PDF amallar",
      "• Matn tarjimasi, sayqallash va konspektlash",
      "Muloqot tili: " + (lang ?? "uz"),
      "Javoblar qisqa, aniq va professional bo'lsin. Markdown formatidan foydalaning.",
    ].join("\n");

    // Build proper multi-turn contents array
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const text = String(msg?.text ?? "").trim();
        if (!text) continue;
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text }],
        });
      }
    }

    // Always end with the current user query
    contents.push({ role: "user", parts: [{ text: query.trim() }] });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const text = extractText(response);
    if (!text) {
      return res.status(502).json({ error: "AI bo'sh javob qaytardi. Qayta urinib ko'ring." });
    }

    return res.status(200).json({ text });
  } catch (err: any) {
    console.error("[chat] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

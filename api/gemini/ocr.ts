import { handlePreflight, checkApiKey, createClient, extractText, classifyError, GEMINI_MODEL } from "./_lib";

const SUPPORTED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/bmp", "image/tiff",
]);

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
    const { image } = req.body ?? {};

    if (!image) {
      return res.status(400).json({ error: "Rasm ma'lumotlari yuborilmadi." });
    }

    // Parse data-URL: "data:<mimeType>;base64,<data>"
    const match = (image as string).match(/^data:([\w/+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Rasm formati noto'g'ri (base64 data-URL kutiladi)." });
    }

    const [, mimeType, base64Data] = match;

    if (!SUPPORTED_MIME.has(mimeType.toLowerCase())) {
      return res.status(400).json({ error: `Qo'llab-quvvatlanmaydigan rasm formati: ${mimeType}` });
    }

    const prompt = `Bu rasmdan barcha matnlarni yuqori aniqlikda o'qib bering (OCR).

Ko'rsatmalar:
• Matn o'zbek (lotin/kirill), rus yoki ingliz tilida bo'lishi mumkin
• Kirill harflarni to'g'ri o'qing: ў, қ, ғ, ҳ, ё, ъ kabilar
• Asl qatorlar va paragraf tuzilmasini saqlang
• Jadvallar, ro'yxatlar va sarlavhalarni ko'rinishiga mos formatlang
• Hech qanday kirish gaplari yoki tushuntirish yozmang — faqat o'qilgan matn
• Matnni o'qib bo'lmasa: "(O'qib bo'lmadi)" deb yozing`;

    const ai = createClient(req);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        } as any,
        prompt,
      ],
      config: {
        maxOutputTokens: 4096,
        temperature: 0.1,
      },
    });

    const output = extractText(response);
    if (!output) {
      return res.status(502).json({ error: "Rasmdan matn o'qib bo'lmadi." });
    }

    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("[ocr] Gemini error:", err?.message ?? err);
    const { status, message } = classifyError(err);
    return res.status(status === 429 || status === 403 ? status : 500).json({ error: message });
  }
}

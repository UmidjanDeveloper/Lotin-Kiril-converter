import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6JV49tQwhqdKI-1YZT4YerX2LMMK8ZH6B_uv7exn03l6w";
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: "Rasm ma'lumotlari yuborilmadi" });
    }

    // Extract mimeType and base64 string
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Rasm formati mos kelmadi" });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Quyidagi rasm (tasvir) ichidagi barcha matnlarni juda yuqori aniqlikda va to'liq o'qib bering (OCR).
Matn o'zbek (lotin yoki kirill), rus, yoki ingliz tillarida bo'lishi mumkin. Kirill tilidagi 'ў', 'қ', 'ғ', 'ҳ' kabi harflarni to'g'ri o'qing.
Matndagi qatorma-qator tuzilmani saqlab qolishga harakat qiling. Doimiy ma'lumotlarni tushirib qoldirmang.
Hech qanday qo'shimcha tsentzura, sarlavha, kirish gaplari yoki tushuntirishlar qo'shmang. Faqatgina rasmdan o'qilgan matnning o'zini qaytaring.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        prompt,
      ],
    });

    return res.status(200).json({ output: response.text });
  } catch (error: any) {
    console.error("OCR Vercel Error:", error);
    return res.status(500).json({ 
      error: "Skanerdan matn o'qish (OCR) xizmati vaqtincha band, iltimos birozdan keyin qayta urinib ko'ring." 
    });
  }
}

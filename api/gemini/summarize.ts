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
    const { text, lang } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Matn kiritilmadi" });
    }

    const prompt = `System instruction: Siz professional o'zbek va rus tillari tahlilchisi hamda hujjatchisiz. Berilgan o'zbekcha, ruscha yoki inglizcha matnni juda professional tilda batafsil tahlil qiling va uning muhim mazmunini konspektlashtirib bering. Konspekt muloqot tiliga mos ravishda tayyorlansin.
Muloqot tili / Qaytarilishi kerak bo'lgan til shablonlari: ${lang || 'uz'}.
Matn:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ output: response.text });
  } catch (error: any) {
    console.error("Summarize Vercel Error:", error);
    return res.status(500).json({ 
      error: "Konspektlash xizmati vaqtincha band, iltimos birozdan keyin qayta urinib ko'ring." 
    });
  }
}

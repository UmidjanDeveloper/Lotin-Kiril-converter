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
    const { messages, query, lang } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Xabar matni topilmadi" });
    }

    // Convert messages array to Gemini contents or build a combined chat prompt
    let context = "Siz aqlli va muloyim hujjatchilik hamda lotin-kirill transliteratsiyasi bo'yicha mutaxassis AI yordamchisiz. Foydalanuvchi taqdim etgan savollarga aniq, lisoniy to'g'ri va professional tarzda javob bering.\n";
    context += "Muloqot tili: " + (lang || 'uz') + "\n\n";

    if (messages && Array.isArray(messages)) {
      messages.forEach((msg: any) => {
        if (msg.text) {
          context += `${msg.sender === 'user' ? 'Foydalanuvchi' : 'AI yordamchi'}: ${msg.text}\n`;
        }
      });
    }
    context += `Foydalanuvchi: ${query}\n`;
    context += `AI yordamchi:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: context,
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Chat Vercel Error:", error);
    return res.status(500).json({ 
      error: "Muloqot xizmati vaqtincha band, iltimos birozdan keyin qayta urinib ko'ring." 
    });
  }
}

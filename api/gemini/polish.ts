import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
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
    const { text, style } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Matn kiritilmadi" });
    }

    let styleInstruction = "";
    if (style === 'official') {
      styleInstruction = "Rasmiy-idoraviy uslubda, hujjatlar talablariga mos muomalada tahrirla. Norasmiy jumlalarni va kamsitishlarni professional huquqiy va idoraviy atamalarga almashtir.";
    } else if (style === 'literary') {
      styleInstruction = "Adabiy-badiiy uslubda, badiiylik, jozibadorlik va o'zbek tili so'z boyligi bilan boyitib tahrirla.";
    } else if (style === 'conversational') {
      styleInstruction = "Samimiy, do'stona va norasmiy suhbat ohangiga moslab tahrirla.";
    } else {
      styleInstruction = "Faqat imlo va punktuatsiya xatolarini to'g'irla. Asl ma'nosini va uslubini to'liq saqlab qol.";
    }

    const prompt = `Siz professional matn tahrirchisi, korrektor va o'zbek tili filologi yordamchisiz. Quyidagi matnni berilgan uslubiy ko'rsatmaga asosan qayta tahrirlab bering (Sayqallashtiring). Fikrning asl ma'nosini buzmagan holda, lisoniy hamda imlo tuzatishlar qiling. Hech qanday tushuntirishsiz va izohlarsiz, faqatgina tahrirlangan tayyor matnni qaytaring.

Uslubiy ko'rsatma: ${styleInstruction}

Matn:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ output: response.text });
  } catch (error: any) {
    console.error("Polish Vercel Error:", error);
    return res.status(500).json({ 
      error: "Matnni sayqallash xizmati vaqtincha band, iltimos birozdan keyin qayta urinib ko'ring." 
    });
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use larger limits for image processing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Helper to retrieve the active API Key / Token
  const getActiveApiKey = () => {
    let key = (process.env.GEMINI_API_KEY || process.env.VERCEL_OIDC_TOKEN || "").trim();
    if (
      !key || 
      key === "AIzaSyBdhZjynoq3RvuX3cU0g6yep_t_7HRkqTE" || 
      key === "MY_GEMINI_API_KEY" || 
      key === "PLACEholder"
    ) {
      throw new Error("GEMINI_KEY_MISSING_OR_LEAKED");
    }
    return key;
  };

  const getGeminiClient = () => {
    const key = getActiveApiKey();
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Dynamic AI Executor that handles Google Gen AI
  const executeAiCall = async (options: {
    prompt: string;
    image?: { mimeType: string; data: string }; // base64 string
    isChat?: boolean;
    messages?: { sender: 'user' | 'bot'; text: string }[];
  }): Promise<string> => {
    const ai = getGeminiClient();

    if (options.image) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: options.image.mimeType,
              data: options.image.data,
            },
          },
          options.prompt,
        ],
      });
      return response.text || "";
    } else if (options.isChat && options.messages) {
      // Build standard Gemini structured content history
      const contents = options.messages
        .filter(msg => msg.text && msg.text.trim())
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      contents.push({
        role: "user",
        parts: [{ text: options.prompt }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
      });
      return response.text || "";
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: options.prompt,
      });
      return response.text || "";
    }
  };

  const formatGeminiError = (error: any): string => {
    const errMsg = error?.message || String(error);
    if (
      errMsg.includes("leaked") || 
      errMsg.includes("permission_denied") || 
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("Key not found") || 
      errMsg.includes("API key") ||
      errMsg.includes("API_KEY") ||
      errMsg.includes("GEMINI_KEY_MISSING_OR_LEAKED")
    ) {
      return "DIQQAT: GEMINI_API_KEY o'rnatilmagan yoki eskirgan (leaked). Tizim to'laqonli ishlashi uchun iltimos, AI Studio platformasining Sozlamalar (Settings/Secrets) bo'limida o'zingizning shaxsiy GEMINI_API_KEY kalitingizni kiriting. Tizim sozlanguniga qadar, 'OS Labs' bo'limidagi offline mantiqiy yordamchidan foydalanib turishingiz mumkin.";
    }
    return error?.message || "Tizimli xatolik yuz berdi. Iltimos birozdan keyin qayta urinib ko'ring.";
  };

  // Express middleware to ensure the key exists
  const geminiGuard = (req: any, res: any, next: any) => {
    try {
      getActiveApiKey();
      next();
    } catch (err) {
      console.warn("Gemini Guard triggered: Token or key is missing / empty.");
      return res.status(403).json({ 
        error: "DIQQAT: GEMINI_API_KEY o'rnatilmagan yoki eskirgan (leaked). Tizim to'laqonli ishlashi uchun iltimos, AI Studio platformasining Sozlamalar (Settings/Secrets) bo'limida o'zingizning shaxsiy GEMINI_API_KEY kalitingizni kiriting. Tizim sozlanguniga qadar, 'OS Labs' bo'limidagi offline mantiqiy yordamchidan foydalanib turishingiz mumkin." 
      });
    }
  };

  // Apply the Gemini guard automatically to all /api/gemini routes
  app.use("/api/gemini", geminiGuard);

  // API Route for Translation
  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Matn kiritilmadi" });
      }

      const prompt = `Siz professional darajadagi ko'p tilli tarjimonsiz. Quyida taqdim etilgan matnni tushunarli, aniq va lisoniy til qoidalariga mos ravishda tarjima qilib bering. Hech qanday qo'shimcha tushuntirish, izoh yoki kirish so'zlarisiz faqat tarjima qilingan natijani qaytaring. Turli xil maxsus belgilar, yangi qatorlar va paragraflarni aslholicha qoldiring.

Manba tili: ${sourceLang || 'auto'}
Mo'ljallangan maqsad tili: ${targetLang || 'ru'}

Tarjima qilinadigan matn:
"${text}"`;

      const output = await executeAiCall({ prompt });
      res.json({ output });
    } catch (error: any) {
      console.error("Translate Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // API Route for Text Polish / Styling
  app.post("/api/gemini/polish", async (req, res) => {
    try {
      const { text, style } = req.body;
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

      const output = await executeAiCall({ prompt });
      res.json({ output });
    } catch (error: any) {
      console.error("Polish Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // API Route for Image OCR (Optical Character Recognition)
  app.post("/api/gemini/ocr", async (req, res) => {
    try {
      const { image } = req.body;
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

      const output = await executeAiCall({
        prompt,
        image: { mimeType, data: base64Data }
      });

      res.json({ output });
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // API Route for Summarization
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { text, lang } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const prompt = `System instruction: Siz professional o'zbek tili tahlilchisi va hujjatchisiz. Berilgan o'zbekcha yoki ruscha matnni juda professional tilda batafsil tahlil qiling va uning muhim mazmunini konspektlashtirib bering. Konspekt o'zbek tilida bo'lsin.
Muloqot tili / Qaytarilishi kerak bo'lgan til shablonlari: ${lang || 'uz'}.
Matn:
${text}`;

      const output = await executeAiCall({ prompt });
      res.json({ output });
    } catch (error: any) {
      console.error("Summarize Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // API Route for Document Templates Generation
  app.post("/api/gemini/document", async (req, res) => {
    try {
      const { templateType, to, from, detail } = req.body;
      
      let typeLabel = "";
      switch (templateType) {
        case "ariza": typeLabel = "Ariza (Zayavlenie)"; break;
        case "tushuntirish": typeLabel = "Tushuntirish xati (Obyasnitelnaya)"; break;
        case "tavsifnoma": typeLabel = "Tavsifnoma (Xarakteristika / tavsiyanoma)"; break;
        case "shartnoma": typeLabel = "Ikki tomonlama shartnoma (Yuridik shartnoma)"; break;
        case "bildirgi": typeLabel = "Bildirgi (Dokladnaya)"; break;
        case "malumotnoma": typeLabel = "Ma'lumotnoma berish so'rovi"; break;
        default: typeLabel = "Rasmiy hujjat (Erkin tur)"; break;
      }

      const prompt = `Siz professional hujjatchi, yurist va o'zbek tili rasmiy-idoraviy muloqot tizimi mutaxassisiz. Quyidagi parametrlarga asoslanib, rasmiy andozalarga mos keladigan o'zbek tilida (lotin alifbosida) professional hujjat tayyorlab bering.

Hujjat turi: ${typeLabel}
Kimga: ${to || 'Tegishli mas\'ul shaxs/rahbariyatga'}
Kimdan: ${from || 'Ariza beruvchi/Xodimgdan'}
Batafsil sabab/tafsilot (erkin matn): ${detail || 'Shaxsiy masalalar yuzasidan'}

Yo'riqnomalar:
1. Hujjatning rasmiy andozasini (strukturasini) to'liq saqlang:
   - Yuqori o'ng burchakda kimga berilganligi va kimdan yozilganligi (shlyapka qismi). Har bir satr boshi o'ng tomonga mos tushadigan qilib chiroyli joylashtirilsin.
   - O'rtada sarlavha ("ARIZA", "TUSHUNTIRISH XATI", "TAVSIFNOMA", "SHARTNOMA", "BILDIRGI" va hk.) katta harflar bilan sarlavha sifatida yozilsin.
   - Matn qismida bayon mazmuni oqlangan, tushunarli, aniq, bexato va rasmiy-idoraviy uslub qoidalariga rioya qilgan holda ifodalansin.
   - Agar shablon shartnoma bo'lsa, ikki tomonning huquq, majburiyatlari va to'lov shartlari aniq bandlarda yozilsin.
   - Pastki qismida imzo va joriy sana qo'yish uchun aniq joy ajrating (masalan: "Imzo: _____________", "Sana: [Sana]" yoki shunga o'xshash). Special placeholder for signature line like "Imzo: _______________" is required.
2. Hech qanday markdown belgilari, ya'ni sarlavha uchun hash (#) g'alamlari yoki qalin matn uchun yulduzchalar (**) MUTLAQO ishlatmang. Hujjatni toza, oddiy matn ko'rinishida yozing, bu bizga uni qo'lyozma va chop etishda chiroyli ko'rsatishga va chop etganda buzilmasligiga yordam beradi.
3. Kirish va xulosa izohlari (masalan "Mana siz so'ragan ariza:") umuman yozmang. Faqat hujjat matnining o'zini qaytaring.`;

      const output = await executeAiCall({ prompt });
      res.json({ output });
    } catch (error: any) {
      console.error("Document Template Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // API Route for Q&A Chat
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, query, lang } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: "Query is required" });
      }

      let prompt = "Siz aqlli va muloyim hujjatchilik hamda lotin-kirill transliteratsiyasi bo'yicha mutaxassis AI yordamchisiz. Foydalanuvchi taqdim etgan savollarga aniq, lisoniy to'g'ri va professional tarzda javob bering.\n";
      prompt += "Muloqot tili: " + (lang || 'uz') + "\n\n";

      const text = await executeAiCall({
        prompt: `${prompt}\nFoydalanuvchi: ${query}`,
        isChat: true,
        messages: messages && Array.isArray(messages) ? messages : []
      });

      res.json({ text });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

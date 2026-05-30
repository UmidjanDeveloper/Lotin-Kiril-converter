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

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBdhZjynoq3RvuX3cU0g6yep_t_7HRkqTE";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ output: response.text });
    } catch (error: any) {
      console.error("Translate Error:", error);
      res.status(500).json({ error: "Tarjima xizmati vaqtincha ishlamayapti, iltimos birozdan keyin qayta urinib ko'ring." });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ output: response.text });
    } catch (error: any) {
      console.error("Polish Error:", error);
      res.status(500).json({ error: "Matnni sayqallash xizmati vaqtincha ishlamayapti, iltimos birozdan keyin qayta urinib ko'ring." });
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

      res.json({ output: response.text });
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: "OCR tasvirlarni aniqlash xizmati vaqtincha ishlamayapti, birozdan keyin qayta urinib ko'ring." });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ output: response.text });
    } catch (error: any) {
      console.error("Summarize Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ output: response.text || "" });
    } catch (error: any) {
      console.error("Document Template Error:", error);
      res.status(500).json({ error: "Hujjat shablonini generatsiya qilish xizmata vaqtincha ishlamayapti, iltimos birozdan keyin qayta urinib ko'ring." });
    }
  });

  // API Route for Q&A Chat
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, query, lang } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Convert messages array to Gemini contents or build a combined chat prompt
      let context = "Siz aqlli va muloyim hujjatchilik hamda lotin-kirill transliteratsiyasi bo'yicha mutaxassis AI yordamchisiz. Foydalanuvchi taqdim etgan savollarga aniq, lisoniy to'g'ri va professional tarzda javob bering.\n";
      context += "Muloqot tili: " + (lang || 'uz') + "\n\n";

      if (messages && Array.isArray(messages)) {
        messages.forEach((msg: any) => {
          context += `${msg.sender === 'user' ? 'Foydalanuvchi' : 'AI yordamchi'}: ${msg.text}\n`;
        });
      }
      context += `Foydalanuvchi: ${query}\n`;
      context += `AI yordamchi:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: context,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
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

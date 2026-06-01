/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Ai as CloudflareAi } from "@cloudflare/ai";

dotenv.config();

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

const activeProvider = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
const isAzureProvider = activeProvider === "azure" || activeProvider === "ms" || activeProvider === "microsoft";
const isCloudflareProvider = activeProvider === "cloudflare" || activeProvider === "cf";
const isGeminiProvider = !isAzureProvider && !isCloudflareProvider;

const getCloudflareConfig = () => {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
  const model = (process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct").trim();
  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_AI configuration missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
  }
  return { accountId, apiToken, model };
};

const getAzureConfig = () => {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.AZURE_OPENAI_API_KEY || "").trim();
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT || "").trim();
  const apiVersion = (process.env.AZURE_OPENAI_API_VERSION || "2024-10-21").trim();
  if (!endpoint || !apiKey || !deployment) {
    throw new Error("AZURE_OPENAI configuration missing. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT.");
  }
  return { endpoint, apiKey, deployment, apiVersion };
};

const buildCloudflareResponse = (data: any): string => {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data
      .map(item => (typeof item === "string" ? item : JSON.stringify(item)))
      .join("\n");
  }
  if (data?.result) {
    if (typeof data.result === "string") return data.result;
    if (Array.isArray(data.result)) {
      const first = data.result[0];
      if (typeof first === "string") return first;
      if (first?.content) return first.content;
      return JSON.stringify(data.result);
    }
  }
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (data?.choices?.[0]?.text) return data.choices[0].text;
  if (data?.output) return typeof data.output === "string" ? data.output : JSON.stringify(data.output);
  if (data?.content) return data.content;
  return JSON.stringify(data, null, 2);
};

const createCloudflareBinding = () => {
  const binding = (globalThis as any).AI;
  if (binding && typeof binding.run === "function") {
    return binding;
  }

  const { accountId, apiToken } = getCloudflareConfig();
  return {
    lastRequestId: "",
    async run(model: string, inputs: any, options?: any) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeURIComponent(model)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          `Cloudflare AI error ${response.status}: ${response.statusText} - ${JSON.stringify(data)}`,
        );
      }

      return data;
    },
  };
};

const getCloudflareClient = () => {
  const binding = createCloudflareBinding();
  return new CloudflareAi(binding);
};

const getGeminiClient = () => {
  const apiKey = getActiveApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const executeAzureCall = async (options: {
  prompt: string;
  image?: { mimeType: string; data: string };
  isChat?: boolean;
  messages?: { sender: "user" | "bot"; text: string }[];
}): Promise<string> => {
  if (options.image) {
    throw new Error("Image OCR and image-based generation are only supported with the Gemini provider.");
  }

  const { endpoint, apiKey, deployment, apiVersion } = getAzureConfig();
  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const payload: any = {
    model: deployment,
    temperature: 0.2,
    max_tokens: 1024,
  };

  if (options.isChat && options.messages?.length) {
    payload.messages = options.messages
      .filter(msg => msg.text && msg.text.trim())
      .map(msg => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text }));
    payload.messages.push({ role: "user", content: options.prompt });
  } else {
    payload.messages = [{ role: "user", content: options.prompt }];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Azure OpenAI error ${response.status}: ${response.statusText} - ${JSON.stringify(data)}`);
  }

  return (
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.output?.[0]?.content ||
    data?.text ||
    JSON.stringify(data)
  );
};

const executeCloudflareCall = async (options: {
  prompt: string;
  image?: { mimeType: string; data: string };
  isChat?: boolean;
  messages?: { sender: "user" | "bot"; text: string }[];
}): Promise<string> => {
  if (options.image) {
    throw new Error("Image OCR and image-based generation are only supported with the Gemini provider.");
  }

  const model = (process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct").trim();
  const payload: any = options.isChat && options.messages?.length
    ? {
        messages: options.messages
          .filter(msg => msg.text && msg.text.trim())
          .map(msg => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
      }
    : { prompt: options.prompt };

  if (!payload.messages) {
    payload.messages = [{ role: "user", content: options.prompt }];
  }

  const client = getCloudflareClient();
  const data = await client.run(model as any, payload);

  return buildCloudflareResponse(data);
};

const executeGeminiCall = async (options: {
  prompt: string;
  image?: { mimeType: string; data: string };
  isChat?: boolean;
  messages?: { sender: "user" | "bot"; text: string }[];
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
  }

  if (options.isChat && options.messages) {
    const contents = options.messages
      .filter(msg => msg.text && msg.text.trim())
      .map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    contents.push({
      role: "user",
      parts: [{ text: options.prompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
    });
    return response.text || "";
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: options.prompt,
  });
  return response.text || "";
};

const executeAiCall = async (options: {
  prompt: string;
  image?: { mimeType: string; data: string };
  isChat?: boolean;
  messages?: { sender: "user" | "bot"; text: string }[];
  provider?: string;
}): Promise<string> => {
  const provider = (options.provider || activeProvider).toString().trim().toLowerCase();

  if (provider === 'azure' || provider === 'ms' || provider === 'microsoft') {
    return executeAzureCall(options);
  }
  if (provider === 'cloudflare' || provider === 'cf') {
    return executeCloudflareCall(options);
  }
  return executeGeminiCall(options);
};

const formatAiError = (error: any): string => {
    const errMsg = error?.message || String(error);
    if (
      errMsg.includes("leaked") ||
      errMsg.includes("permission_denied") ||
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("Key not found") ||
      errMsg.includes("API key") ||
      errMsg.includes("API_KEY")
    ) {
      return "DIQQAT: AI provayderining konfiguratsiyasi to'g'ri emas yoki API kaliti mavjud emas. Iltimos, kerakli muhit o'zgaruvchilarini tekshiring va qayta urinib ko'ring.";
    }
    return error?.message || "Tizimli xatolik yuz berdi. Iltimos birozdan keyin qayta urinib ko'ring.";
  };

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Active AI provider:", activeProvider);

  // Use larger limits for image processing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Express middleware to ensure the active AI provider is configured
  // Supports per-request override via `X-AI-Provider` header or `?provider=` query.
  const aiGuard = (req: any, res: any, next: any) => {
    try {
      const override = (req.headers['x-ai-provider'] || req.query?.provider || '').toString().trim().toLowerCase();
      const reqProvider = override || activeProvider;
      // Attach to request for downstream handlers
      req.aiProvider = reqProvider;

      if (reqProvider === 'azure' || reqProvider === 'ms' || reqProvider === 'microsoft') {
        getAzureConfig();
      } else if (reqProvider === 'cloudflare' || reqProvider === 'cf') {
        getCloudflareConfig();
      } else {
        getActiveApiKey();
      }
      next();
    } catch (err) {
      console.warn("AI Guard triggered: provider configuration missing.");
      return res.status(403).json({
        error: "DIQQAT: AI provayderi uchun zaruriy sozlamalar aniqlanmadi. Iltimos, muhit o'zgaruvchilaringizni tekshiring va kerakli API kalitlarini o'rnating."
      });
    }
  };

  // Apply the AI guard automatically to all /api/gemini routes
  app.use("/api/gemini", aiGuard);

  // Provider-agnostic alias: rewrite /api/ai/* to /api/gemini/* so existing
  // handlers are reused. Apply the same aiGuard first.
  app.use("/api/ai", (req: any, res: any, next: any) => {
    aiGuard(req, res, () => {
      // Rewrite the incoming URL path so Express routes under /api/gemini
      // will receive the request.
      if (req.url && typeof req.url === 'string') {
        req.url = req.url.replace(/^\/api\/ai/, '/api/gemini');
      }
      next();
    });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const output = await executeAiCall({ prompt, provider });
      res.json({ output });
    } catch (error: any) {
      console.error("Translate Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const output = await executeAiCall({ prompt, provider });
      res.json({ output });
    } catch (error: any) {
      console.error("Polish Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const output = await executeAiCall({
        prompt,
        image: { mimeType, data: base64Data },
        provider
      });

      res.json({ output });
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const output = await executeAiCall({ prompt, provider });
      res.json({ output });
    } catch (error: any) {
      console.error("Summarize Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const output = await executeAiCall({ prompt, provider });
      res.json({ output });
    } catch (error: any) {
      console.error("Document Template Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

      const provider = (req.headers['x-ai-provider'] || req.query?.provider || activeProvider).toString().trim().toLowerCase();
      const text = await executeAiCall({
        prompt: `${prompt}\nFoydalanuvchi: ${query}`,
        isChat: true,
        messages: messages && Array.isArray(messages) ? messages : [],
        provider
      });

      res.json({ text });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: formatAiError(error) });
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

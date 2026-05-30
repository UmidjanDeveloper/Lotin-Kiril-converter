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

  app.use(express.json());

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

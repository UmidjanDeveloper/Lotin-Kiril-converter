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
    const { templateType, to, from, detail } = req.body || {};
    
    let typeLabel = "";
    switch (templateType) {
      case "ariza": typeLabel = "Ariza (Zayavlenie)"; break;
      case "tushuntirish": typeLabel = "Tushuntirish xati (Obyasnitelnaya)"; break;
      case "tavsifnoma": typeLabel = "Tavsifnoma (Xarakteristika / tavsiyanoma)"; break;
      case "shartnoma": typeLabel = "Ikki tomonlama shartnoma (Yuridik shartnoma)"; break;
      case "bildirgi": typeLabel = "Bildirgi (Dokladnaya)"; break;
      case "malumotnoma": typeLabel = "Ma'lumotnoma berish so'rovi"; break;
      default: typeLabel = "Rasmiy Hujjat (Erkin shablon)"; break;
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
2. Hech qanday markdown belgilari, ya'ni sarlavha uchun hash (#) g'lamlari yoki qalin matn uchun yulduzchalar (**) MUTLAQO ishlatmang. Hujjatni toza, oddiy matn ko'rinishida yozing, bu bizga uni qo'lyozma va chop etishda chiroyli ko'rsatishga va chop etganda buzilmasligiga yordam beradi.
3. Kirish va xulosa izohlari (masalan "Mana siz so'ragan ariza:") umuman yozmang. Faqat hujjat matnining o'zini qaytaring.
4. Generatsiya natijasida so'zlar bir-biriga yopishib ketmasin. Bo'shliqlar va tinish belgilari toza bo'lishini ta'minlang.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ output: response.text || "" });
  } catch (error: any) {
    console.error("Document Template Vercel Error:", error);
    return res.status(500).json({ 
      error: "Hujjat shablonini generatsiya qilish xizmati vaqtincha band, iltimos birozdan keyin qayta urinib ko'ring." 
    });
  }
}

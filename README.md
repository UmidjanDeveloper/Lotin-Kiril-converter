# Hujjat.uz

O'zbekiston uchun yaratilgan to'liq hujjat platformasi. Kirill ↔ Lotin o'girish, 26+ PDF asboblar, rasmiy hujjat shablonlari, qo'lyozma studiyasi — barchasi brauzerda, hech narsa serverga yuklanmaydi.

---

## Nima qila oladi

**Til Markazi**
- O'zbek matnini Kirill ↔ Lotin yo'nalishlarida o'girish
- DOCX, PDF, XLSX, TXT fayllarini ham o'giradi
- AI orqali 5 tilda tarjima (O'zbek, Rus, Ingliz, Qozoq, Turk)
- Matnni sayqallash: rasmiy, adabiy, suhbat yoki faqat imlo tuzatish

**Hujjat Markazi**
- 26+ PDF asbob: birlashtirish, bo'lish, siqish, aylantirish, watermark, parol, raqamlash, OCR va boshqalar
- Word, Excel, PowerPoint → PDF (va teskari)
- Rasmiy o'zbek hujjat shablonlari: ariza, shartnoma, tavsifnoma, tushuntirish xati, ma'lumotnoma
- AI bilan bir necha soniyada professional hujjat yaratish

**AI Markazi**
- Hujjatlarni konspektlash
- AI chat — hujjatchilik, transliteratsiya, PDF bo'yicha savollar
- Rasmiy shablonlarni AI yordamida to'ldirish

**Qo'lyozma Studiyasi**
- 8 ta haqiqiy qo'l yozuvi shrifti (Caveat, Kalam, Patrick Hand, Indie Flower va boshqalar)
- Insoniy tebranish (Jitter) effekti — har bir harf biroz boshqacha, haqiqiy qo'l yozuvidek
- Chiziqli, katak, sariq, bo'sh qog'oz turlari
- PDF, PNG, Word (.docx) sifatida eksport

---

## Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Frontend | React 19, TypeScript, Vite 6 |
| Uslub | Tailwind CSS 4 |
| PDF | pdf-lib, jsPDF |
| Word / Excel | mammoth, xlsx, JSZip |
| OCR (brauzer) | Tesseract.js |
| AI backend | Google Gemini 2.0 Flash |
| Deploy | Vercel |

---

## Lokal ishga tushirish

```bash
git clone https://github.com/username/hujjat-uz.git
cd hujjat-uz
npm install
```

`.env` fayl yarating (root papkada):

```
GEMINI_API_KEY=your_key_here
```

Ishga tushiring:

```bash
npm run dev
```

Brauzer: `http://localhost:3000`

---

## Gemini API kaliti

1. [aistudio.google.com](https://aistudio.google.com) ga kiring
2. **Get API key** tugmasini bosing
3. Kalitni `.env` ga yozing yoki Vercel → Settings → Environment Variables ga qo'shing

Bepul tier kunlik limitlar uchun yetarli. AI funksiyalarsiz platforma to'liq ishlayveradi.

---

## Vercel ga deploy

GitHub reponi Vercel ga ulang. `GEMINI_API_KEY` muhit o'zgaruvchisini qo'shing. Hammasi shu.

Yoki qo'lda:

```bash
npm run build
vercel --prod
```

---

## Loyiha tuzilmasi

```
src/
  components/
    App.tsx               # Asosiy komponent, navigatsiya, home sahifa
    DocumentCenter.tsx    # 26+ PDF asboblar + hujjat shablonlari
    LanguageCenter.tsx    # Transliteratsiya + tarjima + sayqallash
    AiCenter.tsx          # AI chat + konspekt + OCR
    OpenSourceLabs.tsx    # Qo'lyozma studiyasi
  utils/
    translit.ts           # Kirill ↔ Lotin algoritmi
    fileProcessor.ts      # DOCX, XLSX ishlov berish
    translations.ts       # UI matnlari (uz / ru / en)

api/
  gemini/
    _lib.ts               # Umumiy Gemini utility (CORS, kalit, xato tasnifi)
    chat.ts               # AI chat
    document.ts           # Hujjat generatsiya
    translate.ts          # Tarjima
    summarize.ts          # Konspektlash
    polish.ts             # Matn sayqallash
    ocr.ts                # Rasm → matn (OCR)
```

---

## Texnik tafsilotlar

**Maxfiylik.** Fayllar serverga yuklanmaydi. PDF, Word, Excel bilan barcha operatsiyalar brauzer ichida bajariladi (`pdf-lib`, `mammoth`, `xlsx` orqali). Faqat AI funksiyalari (tarjima, konspekt, hujjat generatsiya) matn ko'rinishida serverga murojaat qiladi.

**Transliteratsiya.** `src/utils/translit.ts` da yozilgan. Istisno lug'atlar (oy nomlari, joy nomlari), ko'p harfli kombinatsiyalar (`sh`, `ch`, `ng`, `o'`, `g'`), tutuq belgisi (`ъ`) va katta-kichik harf saqlash uchun alohida qoidalar mavjud.

**Qo'lyozma PDF.** jsPDF standart PDF shriftlari bilan ishlaydi, shuning uchun haqiqiy Google Fonts ko'rinishi uchun Canvas API da render qilinib, keyin PDF ga JPEG rasm sifatida joylashtiriladi. `document.fonts.ready` bilan font yuklanganini kutib olinadi.

**Jitter effekti.** `OpenSourceLabs.tsx` da har bir harf uchun canvas renderida alohida `translate` + `rotate` + kichik hajm o'zgarishi qo'llaniladi. Live preview uchun SVG `feTurbulence` + `feDisplacementMap` CSS filtri ishlatiladi.

---

## Skriptlar

```bash
npm run dev      # Lokal server (tsx + Vite)
npm run build    # Production build
npm run lint     # TypeScript tekshiruv
npm start        # Production serverni ishga tushirish
```

---

## Litsenziya

Apache 2.0

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createSimpleDocx } from '../utils/fileProcessor';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { Sparkles, FileText, Bot, HelpCircle, Download, Check, RefreshCw, Send, BookOpen, AlertCircle, X } from 'lucide-react';

interface AiCenterProps {
  currentLang: Language;
  theme?: 'light' | 'dark';
}

export default function AiCenter({ currentLang, theme = 'dark' }: AiCenterProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [subTab, setSubTab] = useState<'summarize' | 'chat' | 'templates'>('templates');

  // Summarize state
  const [sumText, setSumText] = useState('');
  const [sumOutput, setSumOutput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: '' } // Localized dynamically at render-time using t.chatBotWelcome
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentReplying, setIsAgentReplying] = useState(false);

  // Document templates state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ariza');
  
  // Unified document outputs and controls
  const [docTo, setDocTo] = useState('"Mega Texnoloji" MCHJ direktori A.B. Toshmatovga');
  const [docFrom, setDocFrom] = useState('"Dasturchi" lavozimidagi Karimov Akmal tomonidan');
  const [docDetail, setDocDetail] = useState('oila sharoitim tufayli 5 kun muddatga oylik maosh saqlanmagan holda ish haqi saqlanmaydigan mehnat ta\'tili berishingizni so\'rayman');
  const [docPreviewMode, setDocPreviewMode] = useState<'computer' | 'handwriting'>('computer');
  const [handwritingStyle, setHandwritingStyle] = useState<'blue' | 'black'>('blue');
  const [generatedDocText, setGeneratedDocText] = useState<string>('');
  const [isGeneratingDocText, setIsGeneratingDocText] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Helper defaults & fallbacks defined inline or outside component
  const getTemplateDefaults = (type: string) => {
    switch (type) {
      case 'ariza':
        return {
          to: '"Mega Texnoloji" MCHJ direktori A.B. Toshmatovga',
          from: '"Dasturchi" lavozimidagi Karimov Akmal tomonidan',
          detail: 'oila sharoitim tufayli 5 kun muddatga oylik maosh saqlanmagan holda ish haqi saqlanmaydigan mehnat ta\'tili berishingizni so\'rayman'
        };
      case 'tushuntirish':
        return {
          to: '"Yuksak Parvoz" DUK rahbari S.S. Alimovga',
          from: '"Yetakchi mutaxassis" Rahimov Akmal',
          detail: '2026-yil 29-may kuni ertalabki soat 09:00 dagi majlisga 30 daqiqa kechikib keldim. Sababi uyim oldidagi yo\'lda avtotransport hodisasi tufayli katta tirbandlik yuzaga keldi.'
        };
      case 'tavsifnoma':
        return {
          to: 'Tegishli joyga taqdim etish uchun',
          from: '"Texno-Inovatika" MCHJ rahbariyati',
          detail: 'Xodim Salimov Umid o\'z faoliyati davomida o\'zini intizomli, bilimli va jamoada hurmatga sazovor mutaxassis sifatida ko\'rsatdi. Hech qanday intizomiy jazo choralariga tortilmagan.'
        };
      case 'shartnoma':
        return {
          to: 'Sotuvchi: Rahimov Sobir (Pasport AB 1234567, Toshkent sh.)',
          from: 'Sotib oluvchi: Karimov Akmal (Pasport AC 7654321, Toshkent sh.)',
          detail: 'Chevrolet Lacetti avtotransport vositasi (Davlat raqami 01 A 777 AA) jami 120,000,000 (bir yuz yirma million) so\'m evaziga sotilmoqda. To\'lov 3 ish kuni ichida amalga oshiriladi.'
        };
      case 'bildirgi':
        return {
          to: 'Kadrlar bo\'limi boshlig\'i M.V. Shohalilovaga',
          from: 'Guruh rahbari Soliyev Bobur',
          detail: 'Axborot xavfsizligi bo\'limi xodimi Ergashev G\'ayrat o\'z lavozim majburiyatlarini bir necha bor buzganligi va ish vaqtida asossiz yo\'q bo\'lganligi haqida bildirish xati.'
        };
      case 'malumotnoma':
        return {
          to: 'Chilonzor tumani hokimiyati bandlik bo\'limiga',
          from: 'Fuqaro Usmonova Laylo',
          detail: 'Fuqaro Usmonova Layloning ushbu tashkilotda 2024-yildan beri bosh hisobchi yordamchisi lavozimida haqiqatdan ham ishlab kelayotganligi va oylik o\'rtacha maoshi 4,500,000 so\'m ekanligi haqida ma\'lumotnoma'
        };
      case 'free':
      default:
        return {
          to: 'Bosh boshqarma boshlig\'iga',
          from: 'Fuqaro Yo\'ldoshev Nodir',
          detail: 'menga 3 kunlik oilaviy sabablarga ko\'ra mehnat ta\'tili berishingizni so\'rayman'
        };
    }
  };

  const getLocalDraftText = (type: string, to: string, from: string, detail: string) => {
    const cleanTo = to.trim();
    const cleanFrom = from.trim();
    const cleanDetail = detail.trim();
    const dateStr = new Date().toLocaleDateString('uz-UZ');

    switch (type) {
      case 'ariza':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                                   ARIZA

      Sizdan, ${cleanDetail} so'rayman.

      Ariza mazmuni qonuniy va rasmiy munosabatlar qoidalariga rioya qilgan holda tuzildi.

      Sana: ${dateStr}
      Imzo: _____________________`;
      case 'tushuntirish':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                             TUSHUNTIRISH XATI

      Men, ushbu tushuntirish xatini yozib shuni ma'lum qilamanki, ${cleanDetail}.

      Keltirilgan holatlar haqiqat ekanligini tasdiqlayman va kelgusida bunday kamchiliklar takrorlanmasligiga va'da beraman.

      Sana: ${dateStr}
      Imzo: _____________________`;
      case 'tavsifnoma':
        return `                                  TAVSIFNOMA
                              (Xodim tavsifnomasi)

      Ushbu tavsifnoma ${cleanTo} taqdim etish uchun ${cleanFrom} tomonidan berildi.

      Xodim to'g'risida ma'lumot: ${cleanDetail}.

      Mazkur tavsifnoma uning talabiga binoan berildi.

      Sana: ${dateStr}
      Boshqaruv imzosi: _____________________`;
      case 'shartnoma':
        return `                                  SHARTNOMA
                              (Oldi-sotdi bitimi)

      Toshkent shahri                                                   Sana: ${dateStr}

      Biz, bir tomondan ${cleanTo}, va ikkinchi tomondan ${cleanFrom}, kelishilgan holda ushbu shartnomani imzoladik:

      1. Shartnoma predmeti: ${cleanDetail}.

      2. Bitim bo'yicha majburiyatlar to'liq va o'z vaqtida bajarilishiga tomonlar kafolat beradilar.

      Tomonlar imzolari:
      Sotuvchi: _________________            Sotib oluvchi: _________________`;
      case 'bildirgi':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                                  BILDIRGI
                             (Doklad xati)

      Sizga shuni ma'lum qilamanki, ${cleanDetail}.

      Yuqoridagilarni inobatga olgan holda, zarur choralar ko'rishingizni so'rayman.

      Sana: ${dateStr}
      Xodim imzosi: _____________________`;
      case 'malumotnoma':
        return `                                  MA'LUMOTNOMA

      Ushbu ma'lumotnoma ${cleanTo} taqdim etish uchun ${cleanFrom} muomalasiga binoan berildi.

      Tarkibi: ${cleanDetail}.

      Sana: ${dateStr}
      Mas'ul xodim imzosi: _____________________
      M.O'. (Muhra o'rniga)`;
      case 'free':
      default:
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                               RASMIY HUJJAT

      Murojaat mazmuni:
      ${cleanDetail}

      Ushbu hujjat professional tarzda tizim yordamida shakllantirilgan.

      Sana: ${dateStr}
      Imzo: _____________________`;
    }
  };

  // Sync draft on load or template switch
  React.useEffect(() => {
    const defaults = getTemplateDefaults(selectedTemplate);
    setDocTo(defaults.to);
    setDocFrom(defaults.from);
    setDocDetail(defaults.detail);
    
    const draftText = getLocalDraftText(selectedTemplate, defaults.to, defaults.from, defaults.detail);
    setGeneratedDocText(draftText);
    setIsAiGenerated(false);
  }, [selectedTemplate]);

  // Sync draft when simple inputs change, only if it is NOT yet AI generated
  React.useEffect(() => {
    if (!isAiGenerated) {
      setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
    }
  }, [docTo, docFrom, docDetail, isAiGenerated, selectedTemplate]);

  // Connects directly to backend Gemini Document generation
  const handleGenerateTemplateWord = async () => {
    if (!generatedDocText) return;
    setGeneratingDoc(true);
    try {
      const docBlob = await createSimpleDocx(generatedDocText);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(docBlob);
      link.download = `${selectedTemplate}_hujjat_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleGenDoc = async () => {
    setIsGeneratingDocText(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/gemini/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          to: docTo,
          from: docFrom,
          detail: docDetail
        })
      });

      if (!res.ok) {
        throw new Error('AI Server call failed');
      }

      const data = await res.json();
      if (data.output) {
        setGeneratedDocText(data.output);
        setIsAiGenerated(true);
      } else {
        setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Gemini AI bilan ulanib bo'lmadi. Offline shablon shakllantirildi.");
      setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
    } finally {
      setIsGeneratingDocText(false);
    }
  };

  const handlePrint = () => {
    if (!generatedDocText) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Iltimos, qalqib chiquvchi oynalar (popup) ochilishiga ruxsat bering.");
      return;
    }
    
    const isHandwriting = docPreviewMode === 'handwriting';
    const penColor = handwritingStyle === 'blue' ? '#1d4ed8' : '#1e293b';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A4 Chop Etish - Hujjat.uz</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Marck+Script&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #fff;
              }
              .a4-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
              }
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              background-color: #f1f5f9;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .a4-container {
              background: white;
              width: 210mm;
              min-height: 297mm;
              padding: 20mm 25mm 20mm 25mm;
              box-sizing: border-box;
              border: 1px solid #cbd5e1;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              white-space: pre-wrap;
              word-wrap: break-word;
              position: relative;
            }
            .computer {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14pt;
              line-height: 1.6;
              color: #000;
            }
            .handwriting {
              font-family: 'Caveat', cursive;
              font-size: 20pt;
              line-height: 1.5;
              color: ${penColor};
              transform: rotate(-0.5deg);
              letter-spacing: 0.5px;
            }
            .lines-background {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: linear-gradient(#e2e8f0 1px, transparent 1px);
              background-size: 100% 32px;
              pointer-events: none;
              opacity: 0.15;
            }
          </style>
        </head>
        <body>
          <div class="a4-container \${isHandwriting ? 'handwriting' : 'computer'}">
            \${isHandwriting ? '<div class="lines-background"></div>' : ''}
            <div>\${generatedDocText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>')}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSummarize = async () => {
    if (!sumText.trim()) return;
    setIsSummarizing(true);
    setSumOutput('');
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sumText, lang: currentLang === 'uz' ? 'uz' : 'ru' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Tahlil xizmati muvaffaqiyatsiz tugadi");
      }
      const data = await res.json();
      setSumOutput(data.output || "Natija kutilmagan formatda qaytdi.");
    } catch (err: any) {
      console.error("Gemini summarization failed:", err);
      setSumOutput("Konspektlashtirish xizmati vaqtincha ishlamayapti. Iltimos, API kalitingiz to'g'riligini tekshiring va birozdan keyin qayta urinib ko'ring.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setIsAgentReplying(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-10),
          query: userQuery,
          lang: currentLang === 'uz' ? 'uz' : 'ru'
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Savolga javob berish muvaffaqiyatsiz bo'ldi");
      }
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.text || "Uzr, savolingizga javob olishda xatolik yuz berdi." }]);
    } catch (err: any) {
      console.error("Gemini chat failed:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Yordamchi vaqtincha offline rejimda. Iltimos, ulanish tarmoqlari va API kalit sozlamalarini tekshiring hamda birozdan keyin qayta yozib ko'ring." }]);
    } finally {
      setIsAgentReplying(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Title block */}
      <div>
        <h2 className={`text-xl sm:text-2xl font-black font-display tracking-wide ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          {t.aiCenterTitle}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-550'}`}>
          {t.aiCenterDesc}
        </p>
      </div>

      {/* AI Sub-navigation tabs */}
      <div className={`flex p-1 rounded-2xl border shadow-lg shrink-0 w-full md:w-auto self-start max-w-lg transition duration-200 ${
        theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setSubTab('templates')}
          className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            subTab === 'templates' 
              ? 'bg-indigo-600 text-white shadow' 
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.templates}
        </button>
        <button
          onClick={() => setSubTab('summarize')}
          className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            subTab === 'summarize' 
              ? 'bg-indigo-600 text-white shadow' 
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.summarize}
        </button>
        <button
          onClick={() => setSubTab('chat')}
          className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            subTab === 'chat' 
              ? 'bg-indigo-600 text-white shadow' 
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.docChat}
        </button>
      </div>

      {/* Sub-tab contexts */}
      <div className="min-h-[350px] transition-all duration-300">
        {/* Templates Panel - LIVE DOCX GENERATOR */}
        {subTab === 'templates' && (
          <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800 shadow-black/50' 
              : 'bg-white border-slate-200/80 shadow-slate-100/30'
          }`}>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Settings side */}
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-indigo-500/15 rounded-xl text-indigo-500 border border-indigo-500/10">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tizim Shablonlari</h3>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>Kerakli hujjat turini tanlang, malumotlarni kiritib AI yordamida rasmiylashtiring</p>
                  </div>
                </div>

                {/* Templates choices */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 'ariza', label: 'Ariza (Ta\'til, bo\'shash...)' },
                    { id: 'tushuntirish', label: 'Tushuntirish xati' },
                    { id: 'tavsifnoma', label: 'Tavsifnoma' },
                    { id: 'shartnoma', label: 'Shartnoma' },
                    { id: 'bildirgi', label: 'Bildirgi (Dokladная)' },
                    { id: 'malumotnoma', label: 'Ma\'lumotnoma berish' },
                    { id: 'free', label: 'Boshqa / Erkin tur (AI)' },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center duration-150 ${
                        selectedTemplate === tmpl.id 
                          ? 'bg-indigo-600 border border-indigo-650 text-white shadow shadow-indigo-600/20' 
                          : theme === 'dark' 
                            ? 'bg-slate-900 border border-slate-805 text-slate-400 hover:text-white hover:bg-slate-850' 
                            : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>

                {/* Unified inputs section */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">
                      {selectedTemplate === 'shartnoma' ? 'SOTUVCHI (Birinchi tomon)' : 'Kimga (Kompaniya nomi yoki rahbar lavozimi, ismi)'}
                    </label>
                    <input 
                      type="text" 
                      value={docTo} 
                      onChange={(e) => setDocTo(e.target.value)} 
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-550 focus:outline-none focus:border-indigo-550 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 font-medium'
                      }`} 
                      placeholder="Masalan: 'Mega Texnoloji' MCHJ direktori A.B. Toshmatovga"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold font-mono text-slate-505 uppercase tracking-widest block mb-1.5">
                      {selectedTemplate === 'shartnoma' ? 'SOTIB OLUVCHI (Ikkinchi tomon)' : 'Kimdan (Sizning ism-familiyangiz va lavozimingiz)'}
                    </label>
                    <input 
                      type="text" 
                      value={docFrom} 
                      onChange={(e) => setDocFrom(e.target.value)} 
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-550 focus:outline-none focus:border-indigo-550 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 font-medium'
                      }`} 
                      placeholder="Masalan: 'Dasturchi' lavozimidagi Karimov Akmal tomonidan"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold font-mono text-slate-505 uppercase tracking-widest block mb-1.5">
                      {selectedTemplate === 'free' ? 'Hujjat mazmuni va siz so\'rayotgan narsa (Erkin tilda yozing, AI o\'zi mukammal qiladi)' : 'Batafsil sabab yoki tafsilotlar'}
                    </label>
                    <textarea 
                      value={docDetail} 
                      onChange={(e) => setDocDetail(e.target.value)} 
                      rows={4} 
                      className={`w-full border rounded-xl p-3 text-xs resize-none focus:ring-1 focus:ring-indigo-550 focus:outline-none focus:border-indigo-550 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-905 font-medium'
                      }`} 
                      placeholder={selectedTemplate === 'free' ? "Masalan: menga 3 kun oilaviy sharoitimga ko'ra oyliksiz tatil berishlarini so'rab ariza yozib ber." : "Masalan: dushanba kuni oilaviy masalalar tufayli 1 soat kechikish yuz berganligi to'g'risida..."}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleGenDoc}
                    disabled={isGeneratingDocText || !docDetail.trim()}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-700 hover:to-indigo-700 font-bold text-white rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 duration-200 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingDocText ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>AI HUJJAT MATNINI SAYQALLAMOQDA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-violet-200" />
                        <span>HUJJATNI AI BILAN TAYYORLASH ✨</span>
                      </>
                    )}
                  </button>

                  {errorMessage && (
                    <div className="p-3 text-xs bg-red-500/10 border border-red-500/15 rounded-xl text-red-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right document layout visual preview */}
              <div className="flex-1 space-y-4">
                {/* Controls at top of preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-800">
                  <div className="flex p-0.5 rounded-xl bg-slate-950/60 border border-slate-850 gap-1">
                    <button
                      onClick={() => setDocPreviewMode('computer')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        docPreviewMode === 'computer' 
                          ? 'bg-indigo-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Kompyuter yozuvi
                    </button>
                    <button
                      onClick={() => setDocPreviewMode('handwriting')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        docPreviewMode === 'handwriting' 
                          ? 'bg-indigo-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Qo'l yozuvi (Ruchka)
                    </button>
                  </div>

                  {docPreviewMode === 'handwriting' && (
                    <div className="flex items-center gap-1.5 px-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Ruchka siyohi:</span>
                      <button
                        onClick={() => setHandwritingStyle('blue')}
                        className={`w-5 h-5 rounded-full bg-blue-600 border-2 transition cursor-pointer ${
                          handwritingStyle === 'blue' ? 'border-white scale-110' : 'border-transparent opacity-70'
                        }`}
                        title="Ko'k siyoh"
                      />
                      <button
                        onClick={() => setHandwritingStyle('black')}
                        className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition cursor-pointer ${
                          handwritingStyle === 'black' ? 'border-white scale-110' : 'border-transparent opacity-70'
                        }`}
                        title="Qora siyoh"
                      />
                    </div>
                  )}
                </div>

                {/* A4 Document sheet cardboard with aspect standard proportion */}
                <div className="relative w-full aspect-[1/1.4142] rounded-2xl border bg-white shadow-xl p-8 sm:p-10 flex flex-col overflow-hidden transition-all duration-300 border-slate-200 shadow-slate-100 bg-mesh-grid-light">
                  {/* Page Lines Background for Handwriting */}
                  {docPreviewMode === 'handwriting' && (
                    <div className="absolute inset-0 opacity-45 pointer-events-none" style={{
                      backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px)',
                      backgroundSize: '100% 30px',
                      marginTop: '34px'
                    }} />
                  )}

                  {/* Content editing Workspace */}
                  <textarea
                    value={generatedDocText}
                    onChange={(e) => {
                      setGeneratedDocText(e.target.value);
                      setIsAiGenerated(true); // Don't snap back when typed manually
                    }}
                    className={`w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0 focus:outline-none focus:border-transparent text-xs sm:text-sm leading-relaxed p-0 whitespace-pre-wrap ${
                      docPreviewMode === 'handwriting' 
                        ? 'font-handwriting font-bold tracking-wide italic text-lg sm:text-xl' 
                        : 'font-serif text-slate-900'
                    }`}
                    style={{
                      fontFamily: docPreviewMode === 'handwriting' ? '"Caveat", cursive' : '"Times New Roman", Times, serif',
                      color: docPreviewMode === 'handwriting' 
                        ? (handwritingStyle === 'blue' ? '#1d4ed8' : '#1e293b') 
                        : '#0f172a',
                      transform: docPreviewMode === 'handwriting' ? 'rotate(-0.5deg)' : 'none',
                      lineHeight: docPreviewMode === 'handwriting' ? '1.8' : '1.7'
                    }}
                    placeholder="Hujjat matni bu yerda shakllanadi..."
                  />

                  {/* Watermark badge or edit info */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                    {isAiGenerated ? (
                      <span className="flex items-center gap-1 text-violet-500 font-bold">
                        <Sparkles className="w-3 h-3" /> Gemini AI sayqallagan
                      </span>
                    ) : (
                      <span>Offline asofandiza (Tahrirlash mumkin)</span>
                    )}
                  </div>
                </div>

                {/* A4 Save and Print Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handlePrint}
                    className="py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 duration-150 flex flex-col items-center justify-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-indigo-650" />
                    <span>Printerda chop etish</span>
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    title="Hujjatni PDF shaklida kompyuterga saqlash"
                    className="py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/15 text-indigo-650 font-bold text-xs flex flex-col items-center justify-center gap-1 duration-150 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-650" />
                    <span>PDF saqlash</span>
                  </button>

                  <button
                    onClick={handleGenerateTemplateWord}
                    disabled={generatingDoc}
                    className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 duration-150 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-200" />
                    <span>Word (.docx) yuklash</span>
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-500 text-center leading-relaxed">
                  * <strong>PDF saqlash</strong> uchun chop etish ekranidan <strong>"Save as PDF"</strong> bandini tanlang. <br/>
                  Hujjat chop etilganda mukammal A4 formatda bo'ladi va uning eng pastida imzongiz uchun bo'sh joy qoldirilgan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summarization Panel */}
        {subTab === 'summarize' && (
          <div className={`border rounded-3xl p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800 shadow-black/50' 
              : 'bg-white border-slate-200 shadow-indigo-100/10'
          }`}>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x ${
              theme === 'dark' ? 'divide-slate-805' : 'divide-slate-200'
            }`}>
              <div className="space-y-4">
                <h3 className={`text-sm font-bold font-display uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>{t.sumSourceTitle}</h3>
                <textarea
                  value={sumText}
                  onChange={(e) => setSumText(e.target.value)}
                  placeholder={t.sumPlaceholder}
                  className={`w-full border rounded-2xl p-4 text-xs sm:text-sm resize-none min-h-[220px] focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    theme === 'dark' ? 'bg-slate-900/30 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-900 font-medium'
                  }`}
                />
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing || !sumText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95 duration-200 disabled:opacity-50 cursor-pointer shadow-indigo-600/10 shadow-md"
                >
                  {isSummarizing ? t.sumBtnActive : t.sumBtn}
                </button>
              </div>

              <div className="pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div>
                  <h3 className={`text-sm font-bold font-display uppercase tracking-wider block mb-3 ${
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                  }`}>{t.sumResultHeader}</h3>
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] ${
                    sumOutput 
                      ? theme === 'dark' ? 'text-slate-200 border-purple-500/15 bg-slate-950/20' : 'text-slate-900 font-medium border-purple-200 bg-purple-50/10'
                      : 'text-slate-500 italic border-slate-200'
                  }`}>
                    {sumOutput || t.sumResultPlaceholder}
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 block text-right mt-3">{t.aiFooterText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Q&A Chat Assistant */}
        {subTab === 'chat' && (
          <div className={`border rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[400px] transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800 shadow-black/55' 
              : 'bg-white border-slate-200 shadow-indigo-100/10'
          }`}>
            {/* Conversations container */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 flex-1">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs sm:text-sm max-w-sm sm:max-w-md ${
                    m.sender === 'user'
                      ? 'bg-indigo-650 text-white rounded-br-none shadow-sm'
                      : theme === 'dark'
                        ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none font-medium'
                  }`}>
                    <span className={`font-bold block text-[10px] mb-1 ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {m.sender === 'user' ? t.chatYou : t.chatBot}
                    </span>
                    <p>{idx === 0 && m.sender === 'bot' && !m.text ? t.chatBotWelcome : (m.text || t.chatBotWelcome)}</p>
                  </div>
                </div>
              ))}
              {isAgentReplying && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-550" />
                    <span>{t.chatAnalyzing}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form area */}
            <div className={`flex gap-2.5 pt-3 border-t ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
            }`}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.chatPlaceholder}
                className={`flex-1 border text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-805 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <button
                onClick={handleSendMessage}
                className="p-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl cursor-pointer duration-200 shadow-md shadow-indigo-600/10 hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

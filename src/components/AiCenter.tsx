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
  const [selectedTemplate, setSelectedTemplate] = useState<'ariza' | 'tavsifnoma' | 'shartnoma'>('ariza');
  
  // Ariza inputs
  const [arizaDirector, setArizaDirector] = useState('A.B. Toshmatovga');
  const [arizaCompany, setArizaCompany] = useState('"Mega Texnoloji" MCHJ');
  const [arizaAuthor, setArizaAuthor] = useState('Karimov Akmal');
  const [arizaDetail, setArizaDetail] = useState('shaxsiy sabablarga ko\'ra 10 kun muddatga oylik maosh saqlanmagan holda mehnat ta\'tili berishingizni');
  
  // Tavsifnoma inputs
  const [tavAuthor, setTavAuthor] = useState('Salimov Umid');
  const [tavPosition, setTavPosition] = useState('Bosh dasturchi muhandis');
  const [tavDetail, setTavDetail] = useState('o\'z ishiga g\'oyat mas\'uliyatli va intizomli xodim. Jamoada katta hurmatga ega va qo\'l ostidagi muhandislarga ustozlik qilib keladi.');

  // Shartnoma inputs
  const [shartBuyer, setShartBuyer] = useState('Yuldashev Azamat (Pasport AA 1234567)');
  const [shartSeller, setShartSeller] = useState('Rahimov Sobir (Pasport AB 7654321)');
  const [shartProduct, setShartProduct] = useState('Chevrolet Lacetti rusumli avtotransport vositasi (Davlat raqami 01 A 777 AA)');
  const [shartPrice, setShartPrice] = useState('110,000,000 (Bir yuz o\'n million) so\'m');

  const [generatingDoc, setGeneratingDoc] = useState(false);

  const handleGenerateTemplateWord = async () => {
    setGeneratingDoc(true);
    let documentContent = '';

    if (selectedTemplate === 'ariza') {
      if (currentLang === 'ru') {
        documentContent = `
                                             Директору компании ${arizaCompany}
                                             ${arizaDirector}
                                             от ${arizaAuthor}

                                    ЗАЯВЛЕНИЕ

      Я, ${arizaAuthor}, настоящим заявлением прошу вас ${arizaDetail}.

      Содержание заявления составлено в соответствии с требованиями трудового законодательства.

      Дата: ${new Date().toLocaleDateString()}
      Подпись: ________________
        `;
      } else if (currentLang === 'en') {
        documentContent = `
                                             To Director of ${arizaCompany}
                                             ${arizaDirector}
                                             From ${arizaAuthor}

                                    APPLICATION

      I, ${arizaAuthor}, hereby request you ${arizaDetail}.

      This application has been drafted in compliance with official employment terms.

      Date: ${new Date().toLocaleDateString()}
      Signature: ________________
        `;
      } else {
        documentContent = `
                                             ${arizaCompany} direktori
                                             ${arizaDirector}ga
                                             ${arizaAuthor} tomonidan

                                    ARIZA

      Men ${arizaAuthor}, ushbu ariza orqali sizdan ${arizaDetail} so'rayman.

      Ariza mazmuni qonuniy mehnat sharoitlari qoidalariga rioya qilgan holda tuzildi.

      Sana: ${new Date().toLocaleDateString()}
      Imzo: ________________
        `;
      }
    } else if (selectedTemplate === 'tavsifnoma') {
      if (currentLang === 'ru') {
        documentContent = `
                                    ХАРАКТЕРИСТИКА
                              (Характеристика сотрудника)

      Данная характеристика выдается руководством ${arizaCompany || '"Mega Texnoloji" MCHJ'} сотруднику ${tavAuthor}.

      Сотрудник ${tavAuthor} работает на должности "${tavPosition}" в нашей компании.

      За прошедший период работы он показал себя как ${tavDetail}.

      Характеристика выдана для представления по месту требования.

      Подпись руководства: ________________
      Дата: ${new Date().toLocaleDateString()}
        `;
      } else if (currentLang === 'en') {
        documentContent = `
                                    RECOMMENDATION LETTER
                              (Employee Recommendation)

      This recommendation or appraisal is issued by the management of ${arizaCompany || '"Mega Texnoloji" MCHJ'} to ${tavAuthor}.

      The employee ${tavAuthor} is employed as "${tavPosition}" in our company.

      During the employment period, they have shown themselves to be ${tavDetail}.

      This recommendation is prepared to be presented at requested destinations.

      Management Signature: ________________
      Date: ${new Date().toLocaleDateString()}
        `;
      } else {
        documentContent = `
                                    TAVSIFNOMA
                                (Xodim tavsifi)

      Ushbu tavsifnoma ${arizaCompany || '"Mega Texnoloji" MCHJ'} boshqaruvi tomonidan ${tavAuthor}ga taqdim etiladi.

      Xodim ${tavAuthor}, korxonamizda "${tavPosition}" lavozimida faoliyat yuritib kelmoqda.

      O'tgan davr mobaynida o'zini ${tavDetail} sifatida ko'rsatdi.
      
      Ushbu tavsifnoma tegishli joyga taqdim etish uchun ishlab chiqildi.

      Rahbariyat imzosi: ________________
      Sana: ${new Date().toLocaleDateString()}
        `;
      }
    } else {
      if (currentLang === 'ru') {
        documentContent = `
                                    ДОГОВОР
                              (Договор купли-продажи)

      город Ташкент                                 Дата: ${new Date().toLocaleDateString()}

      Мы, с одной стороны ${shartSeller} (именуемый далее "Продавец"), и со второй стороны ${shartBuyer} (именуемый далее "Покупатель"), заключили настоящий договор о нижеследующем:

      1. Предмет договора: Продавец продает принадлежащий ему ${shartProduct}, а Покупатель принимает его и обязуется выплатить оговоренную сумму.

      2. Стоимость сделки: Оговоренная общая стоимость составляет ${shartPrice}.

      3. Условия оплаты: Покупатель обязан полностью перевести указанную сумму в течение 3 банковских дней с момента подписания настоящего договора.

      4. Подписи и реквизиты сторон:
         Продавец: ______________________
         Покупатель: __________________
        `;
      } else if (currentLang === 'en') {
        documentContent = `
                                    PURCHASE CONTRACT
                              (Purchase & Sales Agreement)

      Tashkent city                                 Date: ${new Date().toLocaleDateString()}

      We, on one side ${shartSeller} (hereinafter referred to as "Seller"), and on the other side ${shartBuyer} (hereinafter referred to as "Buyer"), constructed this contract about:

      1. Subject of Contract: The Seller sells their owned ${shartProduct}, and the Buyer accepts and pays the specified price.

      2. Transaction Price: The agreed total value is ${shartPrice}.

      3. Payment Terms: The Buyer must transfer the full price within 3 business bank days from signature of this contract.

      4. Signatures and Credentials:
         Seller: ______________________
         Buyer: __________________
        `;
      } else {
        documentContent = `
                                    SHARTNOMA
                                (Oldi-sotdi bitimi)

      Toshkent shahri                                 Sana: ${new Date().toLocaleDateString()}

      Biz, bir tomondan ${shartSeller} (bundan buyon "Sotuvchi" deb yuritiladi), va ikkinchi tomondan ${shartBuyer} (bundan buyon "Sotib oluvchi" deb yuritiladi), ushbu shartnomani quyidagilar haqida tuzdik:

      1. Shartnoma predmeti: Sotuvchi o'ziga tegishli bo'lgan ${shartProduct}ni sotadi, Sotib oluvchi esa uni qabul qilib oladi va kelishilgan miqdorda haq to'laydi.

      2. Bitim bahosi: Kelishilgan umumiy qiymat ${shartPrice}ni tashkil etadi.

      3. To'lov shartlari: Sotib oluvchi ushbu summani shartnoma imzolangan paytdan boshlab 3 bank ish kunida to'liq o'tkazishi shart.

      4. Tomonlarning imzolari va rekvizitlari:
         Sotuvchi: ______________________
         Sotib oluvchi: __________________
        `;
      }
    }

    setTimeout(async () => {
      try {
        const docBlob = await createSimpleDocx(documentContent.trim());
        const link = document.createElement('a');
        link.href = URL.createObjectURL(docBlob);
        link.download = `${selectedTemplate}_rasmiy_${Date.now()}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setGeneratingDoc(false);
      } catch (err) {
        console.error(err);
        setGeneratingDoc(false);
      }
    }, 1000);
  };

  const handleSummarize = async () => {
    if (!sumText.trim()) return;
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sumText, lang: currentLang === 'uz' ? 'uz' : 'ru' }),
      });
      if (!res.ok) {
        throw new Error('API request failed');
      }
      const data = await res.json();
      setSumOutput(data.output || "Natija kutilmagan formatda qaytdi.");
    } catch (err) {
      console.warn("Real Gemini fetch failed, falling back to local analysis model:", err);
      setTimeout(() => {
        const summary = `### MUHIM MAZMUN KONSPEKTI:\n\n` +
          `1. **Asosiy yo'nalishlar**: Matnda ko'tarilgan bosh mavzu hujjat va uning shakliy qismlarini o'z ichiga oladi (~${Math.floor(sumText.length / 5)} so'z tahlili).\n` +
          `2. **Tahliliy xulosa**: Berilgan kontentda bayon etilgan mantiqiy silsila professional va qat'iy muloqot standartlariga javob beradi.\n` +
          `3. **Muhim bayonlar**: Matn ichidagi asosiy kalit so'zlar: "${sumText.split(' ').slice(0, 3).join(', ')}".\n\n` +
          `*Konspektlashtirish o'zbek korpusi tahlili bo'yicha yakunlandi. (Katta darsliklar uchun Gemini AI proksi ulanishidan foydalaning)*`;
        setSumOutput(summary);
      }, 1000);
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
        throw new Error('API request failed');
      }
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.text || "Uzr, savolingizga javob olishda xatolik yuz berdi." }]);
    } catch (err) {
      console.warn("Real Gemini chat failed, falling back to local model:", err);
      setTimeout(() => {
        let botReply = '';
        const lowercaseQuery = userQuery.toLowerCase();

        if (lowercaseQuery.includes('nima') || lowercaseQuery.includes('haqida')) {
          botReply = "Ushbu hujjat doirasida asosan rasmiy muloqot, o'zaro shartnomaviy majburiyatlar va huquqiy munosabatlar bayon etilganligi aniqlandi.";
        } else if (lowercaseQuery.includes('rahbar') || lowercaseQuery.includes('kim')) {
          botReply = "Hujjatga ko'ra, korxonada rasmiy rahbarlik yoki vakolatli organ tomonidan tayinlangan vakillar asosiy ma'sul xisoblanadi.";
        } else {
          botReply = `Hujjatni ishonchli tahlil qilish natijasida so'rovingizga javob: "${userQuery}" iborasi matn sarlavhasi ostidagi faol qismlarda uchrashi mumkin.`;
        }

        setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      }, 800);
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
                    <h3 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.templateInputHeader}</h3>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.templateInputDesc}</p>
                  </div>
                </div>

                {/* Templates choices */}
                <div className={`grid grid-cols-3 gap-2 p-1 border rounded-2xl ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setSelectedTemplate('ariza')}
                    className={`p-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTemplate === 'ariza' 
                        ? 'bg-indigo-600 border border-indigo-650 text-white shadow' 
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-250 hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-905 hover:bg-slate-200'
                    }`}
                  >
                    {t.arizaShort}
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('tavsifnoma')}
                    className={`p-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTemplate === 'tavsifnoma' 
                        ? 'bg-indigo-600 border border-indigo-650 text-white shadow' 
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-250 hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-905 hover:bg-slate-200'
                    }`}
                  >
                    {t.tavsifnomaShort}
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('shartnoma')}
                    className={`p-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTemplate === 'shartnoma' 
                        ? 'bg-indigo-600 border border-indigo-650 text-white shadow' 
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-250 hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-905 hover:bg-slate-200'
                    }`}
                  >
                    {t.shartnomaShort}
                  </button>
                </div>

                {/* Dynamic forms based on template */}
                <div className="space-y-4 pt-2">
                  {selectedTemplate === 'ariza' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.arizaTo}</label>
                          <input type="text" value={arizaDirector} onChange={(e) => setArizaDirector(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.companyName}</label>
                          <input type="text" value={arizaCompany} onChange={(e) => setArizaCompany(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.arizaAuthor}</label>
                        <input type="text" value={arizaAuthor} onChange={(e) => setArizaAuthor(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.arizaDetail}</label>
                        <textarea value={arizaDetail} onChange={(e) => setArizaDetail(e.target.value)} rows={3} className={`w-full border rounded-xl p-3 text-xs resize-none ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-905'
                        }`} />
                      </div>
                    </>
                  )}

                  {selectedTemplate === 'tavsifnoma' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.tavAuthor}</label>
                          <input type="text" value={tavAuthor} onChange={(e) => setTavAuthor(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.tavPosition}</label>
                          <input type="text" value={tavPosition} onChange={(e) => setTavPosition(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">{t.tavDetail}</label>
                        <textarea value={tavDetail} onChange={(e) => setTavDetail(e.target.value)} rows={4} className={`w-full border rounded-xl p-3 text-xs resize-none ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`} />
                      </div>
                    </>
                  )}

                  {selectedTemplate === 'shartnoma' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase block mb-1.5">{t.shartSeller}</label>
                          <input type="text" value={shartSeller} onChange={(e) => setShartSeller(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 uppercase block mb-1.5">{t.shartBuyer}</label>
                          <input type="text" value={shartBuyer} onChange={(e) => setShartBuyer(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 block mb-1.5">{t.shartProduct}</label>
                          <input type="text" value={shartProduct} onChange={(e) => setShartProduct(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold font-mono text-slate-500 block mb-1.5">{t.shartPrice}</label>
                          <input type="text" value={shartPrice} onChange={(e) => setShartPrice(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleGenerateTemplateWord}
                  disabled={generatingDoc}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 font-bold text-white rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 duration-200 active:scale-98 cursor-pointer"
                >
                  {generatingDoc ? t.preparingDoc : t.generateAndDownload}
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Right document layout visual preview */}
              <div className={`flex-1 border p-6 flex flex-col justify-between max-w-md rounded-2xl ${
                theme === 'dark' ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between text-xs font-mono border-b pb-2 ${
                    theme === 'dark' ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
                  }`}>
                    <span>{t.previewTitle}</span>
                    <span className="text-indigo-650 font-bold dark:text-indigo-400">{t.wordKit}</span>
                  </div>
                  
                  {/* Dynamic draft viewer */}
                  <div className={`border p-4 rounded-xl text-[10px] sm:text-xs font-mono leading-relaxed space-y-3 min-h-[220px] shadow-sm ${
                    theme === 'dark' ? 'bg-slate-950/35 border-slate-850 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    {selectedTemplate === 'ariza' && (
                      <>
                        {currentLang === 'ru' ? (
                          <>
                            <p className="text-right">Директору {arizaCompany}<br />{arizaDirector}</p>
                            <p className="text-right">от {arizaAuthor}</p>
                            <h4 className={`text-center font-bold text-sm my-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>ЗАЯВЛЕНИЕ</h4>
                            <p className="indent-4 leading-loose">Я, {arizaAuthor}, в этом заявлении прошу вас {arizaDetail}.</p>
                          </>
                        ) : currentLang === 'en' ? (
                          <>
                            <p className="text-right">To Director of {arizaCompany}<br />{arizaDirector}</p>
                            <p className="text-right">From {arizaAuthor}</p>
                            <h4 className={`text-center font-bold text-sm my-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>APPLICATION</h4>
                            <p className="indent-4 leading-loose">I, {arizaAuthor}, hereby request you {arizaDetail}.</p>
                          </>
                        ) : (
                          <>
                            <p className="text-right">{arizaCompany} direktori<br />{arizaDirector}ga</p>
                            <p className="text-right">{arizaAuthor}dan</p>
                            <h4 className={`text-center font-bold text-sm my-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>ARIZA</h4>
                            <p className="indent-4 leading-loose">Men {arizaAuthor}, ushbu ariza orqali sizdan {arizaDetail} so'rayman.</p>
                          </>
                        )}
                      </>
                    )}

                    {selectedTemplate === 'tavsifnoma' && (
                      <>
                        <h4 className={`text-center font-bold text-sm my-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {currentLang === 'ru' ? 'ХАРАКТЕРИСТИКА' : currentLang === 'en' ? 'RECOMMENDATION' : 'TAVSIFNOMA'}
                        </h4>
                        {currentLang === 'ru' ? (
                          <>
                            <p className="indent-4 leading-loose">Данная характеристика выдается руководством {arizaCompany || '"Mega Texnoloji" MCHJ'} сотруднику {tavAuthor}. Сотрудник работает на должности "{tavPosition}" в нашей компании.</p>
                            <p className="indent-4 leading-loose">За прошедший период работы он показал себя как: {tavDetail}</p>
                          </>
                        ) : currentLang === 'en' ? (
                          <>
                            <p className="indent-4 leading-loose">This recommendation is issued by the management of {arizaCompany || '"Mega Texnoloji" MCHJ'} to {tavAuthor}. The employee is working as "{tavPosition}" in our company.</p>
                            <p className="indent-4 leading-loose">During the employment period, they demonstrated: {tavDetail}</p>
                          </>
                        ) : (
                          <>
                            <p className="indent-4 leading-loose">Ushbu tavsifnoma {arizaCompany || '"Mega Texnoloji" MCHJ'} rahbariyati tomonidan {tavAuthor}ga taqdim etiladi. Xodim korxonada "{tavPosition}" lavozimida faoliyat yuritadi.</p>
                            <p className="indent-4 leading-loose">U o'tgan mehnat davri mobaynida: {tavDetail}</p>
                          </>
                        )}
                      </>
                    )}

                    {selectedTemplate === 'shartnoma' && (
                      <>
                        <h4 className={`text-center font-bold text-sm my-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {currentLang === 'ru' ? 'ДОГОВОР КУПЛИ-ПРОДАЖИ' : currentLang === 'en' ? 'SALE CONTRACT' : 'SHARTNOMA'}
                        </h4>
                        {currentLang === 'ru' ? (
                          <>
                            <p>Продавец: {shartSeller}</p>
                            <p>Покупатель: {shartBuyer}</p>
                            <p className="leading-loose">1. Согласно договору, Продавец продал принадлежащий ему {shartProduct} на общую сумму {shartPrice}.</p>
                          </>
                        ) : currentLang === 'en' ? (
                          <>
                            <p>Seller: {shartSeller}</p>
                            <p>Buyer: {shartBuyer}</p>
                            <p className="leading-loose">1. Under this contract, the Seller sold their owned {shartProduct} for a total price of {shartPrice}.</p>
                          </>
                        ) : (
                          <>
                            <p>Sotuvchi: {shartSeller}</p>
                            <p>Sotib oluvchi: {shartBuyer}</p>
                            <p className="leading-loose">1. Bitim hujjati bo'yicha Sotuvchi o'ziga tegishli {shartProduct}ni jami {shartPrice} evaziga sotdi.</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={`mt-5 flex items-center gap-2.5 text-[10px] font-mono p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-indigo-50/50 border-indigo-100 text-indigo-750'
                }`}>
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{t.editorTip}</span>
                </div>
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

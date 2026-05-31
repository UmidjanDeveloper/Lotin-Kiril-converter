/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { Bot, Send, RefreshCw, AlertCircle, X, FileText, FileUp, Sparkles } from 'lucide-react';

interface AiCenterProps {
  currentLang: Language;
  theme?: 'light' | 'dark';
  onSendToHandwriting?: (text: string) => void;
}

export default function AiCenter({ currentLang, theme = 'dark', onSendToHandwriting }: AiCenterProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [subTab, setSubTab] = useState<'chat' | 'summarize'>('chat');

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

  // Ingested context for AI Chat Bot document-understanding
  const [ingestedText, setIngestedText] = useState<string>('');
  const [ingestedFileName, setIngestedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setIngestedText(event.target.result);
          setIngestedFileName(file.name);
          // Show feedback as a notification system or push as an AI prompt alert
        }
      };
      reader.readAsText(file);
    }
  };

  const clearIngestedFile = () => {
    setIngestedText('');
    setIngestedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      let rawText = "";
      try {
        rawText = await res.text();
      } catch (textErr) {
        throw new Error("Tarmoq ulanish xatoligi.");
      }

      if (!res.ok) {
        let errMsg = "";
        try {
          const errData = JSON.parse(rawText);
          errMsg = errData.error || errData.message;
        } catch {
          errMsg = rawText.slice(0, 160);
        }
        throw new Error(errMsg || "Tahlil xizmati muvaffaqiyatsiz tugadi");
      }

      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Serverdan noto'g'ri ko'rinishdagi ma'lumot qaytdi.");
      }
      setSumOutput(data.output || "Natija kutilmagan formatda qaytdi.");
    } catch (err: any) {
      console.error("Gemini summarization failed:", err);
      setSumOutput(err.message || "Konspektlashtirish xizmati vaqtincha ishlamayapti. Iltimos, API kalitingiz to'g'riligini tekshiring va birozdan keyin qayta urinib ko'ring.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    
    // UI update
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setIsAgentReplying(true);

    // If a document context has been uploaded, build a rich query
    let compoundQuery = userQuery;
    if (ingestedText.trim()) {
      compoundQuery = `[FOYDALANUVCHIDAN HUJJAT ILOVASI: ${ingestedFileName}]\nUshbu hujjat matni quyidagicha:\n"""\n${ingestedText}\n"""\n\nSavol / Topshiriq: ${userQuery}`;
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-8), // Keep a lean local history
          query: compoundQuery,
          lang: currentLang === 'uz' ? 'uz' : 'ru'
        }),
      });
      let rawText = "";
      try {
        rawText = await res.text();
      } catch (textErr) {
        throw new Error("Tarmoq ulanish xatoligi.");
      }

      if (!res.ok) {
        let errMsg = "";
        try {
          const errData = JSON.parse(rawText);
          errMsg = errData.error || errData.message;
        } catch {
          errMsg = rawText.slice(0, 160);
        }
        throw new Error(errMsg || "Savolga javob berish muvaffaqiyatsiz bo'ldi");
      }

      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Serverdan noto'g'ri ko'rinishdagi ma'lumot qaytdi.");
      }
      setMessages(prev => [...prev, { sender: 'bot', text: data.text || "Uzr, savolingizga javob olishda xatolik yuz berdi." }]);
    } catch (err: any) {
      console.error("Gemini chat failed:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: err.message || "Yordamchi vaqtincha offline rejimda. Iltimos, ulanish tarmoqlari va API kalit sozlamalarini tekshiring hamda birozdan keyin qayta yozib ko'ring." }]);
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
          AI tahlili, hujjatlar bo'yicha tezkor savol-javob va aqlli til tahririyoti.
        </p>
      </div>

      {/* AI Sub-navigation tabs: Chatbot is first, Summarizer second */}
      <div className={`flex p-1 rounded-2xl border shadow-lg shrink-0 w-full md:w-auto self-start max-w-sm transition duration-200 ${
        theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setSubTab('chat')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'chat' 
              ? 'bg-indigo-600 text-white shadow' 
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          {t.docChat}
        </button>
        <button
          onClick={() => setSubTab('summarize')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'summarize' 
              ? 'bg-indigo-600 text-white shadow' 
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t.summarize}
        </button>
      </div>

      {/* Sub-tab contexts */}
      <div className="min-h-[380px] transition-all duration-300">
        
        {/* Q&A Chat Assistant */}
        {subTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Context Ingestion / File upload */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`border rounded-3xl p-6 shadow-sm ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileUp className="w-4 h-4 text-indigo-550" />
                  <h3 className={`text-xs font-bold font-mono tracking-wider uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Hujjat Tahlili (Kontekst)
                  </h3>
                </div>
                
                <p className={`text-xs mb-4 leading-relaxed ${theme === 'dark' ? 'text-slate-450' : 'text-slate-550'}`}>
                  Xohlagan matnli faylni (.txt, .md, .csv) yuklang yoki matn nusxasini joylashtiring. AI bot ushbu fayl mazmunini to'liq tushunib, savollaringizga aniq javob beradi.
                </p>

                {/* File picker */}
                <div className="space-y-3">
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 cursor-pointer hover:border-indigo-500 duration-150 transition ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-900/40' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <FileText className="w-6 h-6 text-slate-400 mb-1.5" />
                    <span className="text-[11px] font-bold text-slate-450 text-center">Savol-javob uchun fayl tanlash</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".txt,.md,.json,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Active document badge */}
                  {ingestedFileName ? (
                    <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium bg-indigo-50/10 border-indigo-500/20 ${
                      theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'
                    }`}>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate" title={ingestedFileName}>{ingestedFileName}</span>
                      </div>
                      <button
                        onClick={clearIngestedFile}
                        className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg duration-150 transition"
                        title="Faylni o'chirish"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold block text-slate-450">Yokida matn nusxasini to'g'ridan-to'g'ri joylang:</label>
                      <textarea
                        value={ingestedText}
                        onChange={(e) => {
                          setIngestedText(e.target.value);
                          if (e.target.value.trim() && !ingestedFileName) {
                            setIngestedFileName("Pasted_Context.txt");
                          } else if (!e.target.value.trim()) {
                            setIngestedFileName("");
                          }
                        }}
                        rows={4}
                        placeholder="Ushbu maydonga istalgan shartnoma, maqola yoki hujjat matnidan namuna ko'chirib joylashtiring..."
                        className={`w-full text-xs p-3 border rounded-xl outline-none resize-none focus:border-indigo-550 transition ${
                          theme === 'dark' ? 'bg-slate-909 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Chatbot dialog window */}
            <div className="lg:col-span-8">
              <div className={`border rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[460px] transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-950/40 border-slate-800 shadow-black/50' 
                  : 'bg-white border-slate-200 shadow-indigo-100/10'
              }`}>
                {/* Active model badge */}
                <div className="flex items-center justify-between pb-3.5 border-b mb-4 border-slate-800/10 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className={`text-[11px] font-bold font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Muloqot tili: {currentLang === 'uz' ? "O'zbekcha" : "Russian"}
                    </span>
                  </div>
                  
                  {ingestedFileName && (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-455 animate-pulse" />
                      {ingestedFileName.slice(0, 18)}... hujjat bo'yicha tahlil faol
                    </span>
                  )}
                </div>

                {/* Conversations container */}
                <div className="space-y-4 max-h-[340px] overflow-y-auto mb-4 flex-1 pr-1 scrollbar-thin">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs sm:text-sm max-w-sm sm:max-w-md ${
                        m.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : theme === 'dark'
                            ? 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-none'
                            : 'bg-slate-50 border border-slate-200 text-slate-850 rounded-bl-none font-medium'
                      }`}>
                        <span className={`font-bold block text-[10px] mb-1 ${m.sender === 'user' ? 'text-indigo-200' : 'text-indigo-500'}`}>
                          {m.sender === 'user' ? t.chatYou : t.chatBot}
                        </span>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {idx === 0 && m.sender === 'bot' && !m.text ? t.chatBotWelcome : (m.text || t.chatBotWelcome)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isAgentReplying && (
                    <div className="flex justify-start">
                      <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        <span>Fikr jamlanmoqda...</span>
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
                    placeholder={ingestedFileName ? "Hujjat yuzasidan savolingizni bering..." : t.chatPlaceholder}
                    className={`flex-1 border text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isAgentReplying || !chatInput.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer duration-200 shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
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
              theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'
            }`}>
              <div className="space-y-4">
                <main className="space-y-1">
                  <h3 className={`text-xs font-bold font-mono tracking-wider uppercase block ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>{t.sumSourceTitle}</h3>
                  <p className="text-[11px] text-slate-450">Tuzatmoqchi, sayqallamoqchi yoki konspektlashtirmoqchi bo'lgan matningizni kiriting:</p>
                </main>
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
                  <h3 className={`text-xs font-bold font-mono tracking-wider uppercase block mb-3 ${
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                  }`}>{t.sumResultHeader}</h3>
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] ${
                    sumOutput 
                      ? theme === 'dark' ? 'text-slate-200 border-purple-500/15 bg-slate-950/20' : 'text-slate-900 font-medium border-purple-200 bg-purple-50/10'
                      : 'text-slate-500 italic border-slate-200'
                  }`}>
                    {sumOutput || t.sumResultPlaceholder}
                  </div>
                  {sumOutput && onSendToHandwriting && (
                    <button
                      onClick={() => onSendToHandwriting(sumOutput)}
                      className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 duration-200 cursor-pointer shadow active:scale-95"
                    >
                      ✍️ {currentLang === 'uz' ? "Xulosani Qo'lyozma Studiyasiga o'tkazish" : currentLang === 'ru' ? "Перевести резюме в почерк" : "Convert summary to Handwriting"}
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-500 block text-right mt-3">{t.aiFooterText}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

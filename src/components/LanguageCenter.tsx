/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import TextConverter from './TextConverter';
import FileConverter from './FileConverter';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { Type, FileText, Globe2, Sparkles, BookOpen, Volume2, VolumeX, Copy, Check, ArrowRight, CornerDownLeft } from 'lucide-react';
import { latinToCyrillic, detectLanguage } from '../utils/translit';

interface LanguageCenterProps {
  currentLang: Language;
  onFileProcessed: (charCount: number) => void;
  theme?: 'light' | 'dark';
}

export default function LanguageCenter({ currentLang, onFileProcessed, theme = 'dark' }: LanguageCenterProps) {
  const [subTab, setSubTab] = useState<'text' | 'files' | 'translate' | 'polish'>('text');
  const t = UI_TRANSLATIONS[currentLang];

  // Translation States
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');
  const [sourceLang, setSourceLang] = useState<'uz' | 'ru' | 'en' | 'kk' | 'tr'>('uz');
  const [targetLang, setTargetLang] = useState<'ru' | 'en' | 'uz' | 'kk' | 'tr'>('ru');
  const [isTranslating, setIsTranslating] = useState(false);
  const [transCopied, setTransCopied] = useState(false);

  // Polishing States
  const [polishInput, setPolishInput] = useState('');
  const [polishOutput, setPolishOutput] = useState('');
  const [polishStyle, setPolishStyle] = useState<'official' | 'literary' | 'conversational' | 'spellcheck'>('official');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishCopied, setPolishCopied] = useState(false);

  // Text-to-Speech States
  const [isPlayingInput, setIsPlayingInput] = useState(false);
  const [isPlayingOutput, setIsPlayingOutput] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, isInput: boolean) => {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingInput(false);
      setIsPlayingOutput(false);
      if ((isInput && isPlayingInput) || (!isInput && isPlayingOutput)) {
        return;
      }
    }

    if (!text.trim()) return;

    // Convert to Cyrillic for Russian engine TTS
    const isCyr = detectLanguage(text) === 'cyrillic';
    const cyrText = isCyr ? text : latinToCyrillic(text);

    // Clean systemic annotations like [AI Tarjima]
    const cleanText = cyrText.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ru-RU";
    utterance.rate = 0.95;

    utterance.onend = () => {
      if (isInput) setIsPlayingInput(false);
      else setIsPlayingOutput(false);
    };

    utterance.onerror = () => {
      if (isInput) setIsPlayingInput(false);
      else setIsPlayingOutput(false);
    };

    if (isInput) {
      setIsPlayingInput(true);
      setIsPlayingOutput(false);
    } else {
      setIsPlayingOutput(true);
      setIsPlayingInput(false);
    }

    window.speechSynthesis.speak(utterance);
  };

  // Simple offline smart translations dictionary for testing and demonstration
  const LOCAL_DICT: Record<string, Record<string, string>> = {
    "salom": { uz: "Salom", ru: "Здравствуйте / Привет", en: "Hello / Hi", kk: "Сәлем", tr: "Merhaba" },
    "qandaysiz": { uz: "Qandaysiz?", ru: "Как вы?", en: "How are you?", kk: "Қалайсыз?", tr: "Nasılsınız?" },
    "rahmat": { uz: "Rahmat", ru: "Спасибо", en: "Thank you / Thanks", kk: "Рахмет", tr: "Teşekkürler" },
    "xush kelibsiz": { uz: "Xush kelibsiz", ru: "Добро пожаловать", en: "Welcome", kk: "Қош келдіңіз", tr: "Hoş geldiniz" },
    "shartnoma": { uz: "Shartnoma", ru: "Договор / Контракт", en: "Agreement / Contract", kk: "Келісім-шарт", tr: "Sözleşme" },
    "ariza": { uz: "Ariza", ru: "Заявление", en: "Application / Petition", kk: "Өтініш", tr: "Dilekçe" },
    "hujjat": { uz: "Hujjat", ru: "Документ", en: "Document", kk: "Құжат", tr: "Belge" },
    "tarjima": { uz: "Tarjima", ru: "Перевод", en: "Translation", kk: "Аударма", tr: "Çeviri" },
    "yordam": { uz: "Yordam", ru: "Помощь", en: "Help / Assistance", kk: "Көмек", tr: "Yardım" },
    "hujjat.uz": { uz: "Hujjat.uz super ilovasi", ru: "Суперприложение Hujjat.uz", en: "Hujjat.uz super app", kk: "Hujjat.uz супер қосымшасы", tr: "Hujjat.uz süper uygulaması" },
    "yaxshi": { uz: "Yaxshi", ru: "Хорошо", en: "Good / Well", kk: "Жақсы", tr: "İyi" },
    "maktab": { uz: "Maktab", ru: "Школа", en: "School", kk: "Мектеп", tr: "Okul" },
    "universitet": { uz: "Universitet", ru: "Университет", en: "University", kk: "Университет", tr: "Üniversite" },
    "ish": { uz: "Ish", ru: "Работа", en: "Work / Job", kk: "Жұмыс", tr: "İş" },
    "vatan": { uz: "Vatan", ru: "Родина", en: "Homeland", kk: "Отан", tr: "Vatan" }
  };

  const handleTranslate = async () => {
    if (!transInput.trim()) return;
    setIsTranslating(true);
    setTransOutput('');
    
    try {
      const query = transInput.trim().toLowerCase().replace(/[?.!,]/g, '');
      const dictMatch = LOCAL_DICT[query];
      
      // Exact dictionary term shortcut
      if (dictMatch && dictMatch[targetLang]) {
        setTransOutput(dictMatch[targetLang]);
        setIsTranslating(false);
        return;
      }
      
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transInput.trim(),
          sourceLang: currentLang,
          targetLang: targetLang
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Tarjima xizmati javob bermadi");
      }

      const data = await res.json();
      setTransOutput(data.output || "");
    } catch (err: any) {
      console.error("Tarjima xatosi:", err);
      setTransOutput("Tarjima vaqtincha ishlamayapti, iltimos birozdan keyin qayta urinib ko'ring.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePolish = async () => {
    if (!polishInput.trim()) return;
    setIsPolishing(true);
    setPolishOutput('');

    try {
      const res = await fetch('/api/gemini/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: polishInput.trim(),
          style: polishStyle
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Uslub tahrirlagich javob bermadi");
      }

      const data = await res.json();
      
      let heading = '';
      if (polishStyle === 'official') {
        heading = "=== RASMIY-IDORAVIY USLUB ===\n";
      } else if (polishStyle === 'literary') {
        heading = "=== ADABIY-BADIY USLUB ===\n";
      } else if (polishStyle === 'conversational') {
        heading = "=== DO'STONA SUHBAT SHAKLI ===\n";
      } else {
        heading = "=== SPELLCHECK (IMLO TUZATISH) ===\n";
      }

      setPolishOutput(`${heading}${data.output || ""}`);
    } catch (err: any) {
      console.error("Uslub tahrirlash xatosi:", err);
      setPolishOutput("Matnni sayqallash vaqtincha ishlamayapti, iltimos birozdan keyin qayta urinib ko'ring.");
    } finally {
      setIsPolishing(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'trans' | 'polish') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'trans') {
        setTransCopied(true);
        setTimeout(() => setTransCopied(false), 2000);
      } else {
        setPolishCopied(true);
        setTimeout(() => setPolishCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab select bar */}
      <div className={`flex flex-wrap gap-2 border-b pb-3 ${
        theme === 'dark' ? 'border-slate-850' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setSubTab('text')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            subTab === 'text'
              ? 'bg-indigo-600 shadow-md text-white'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/55' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Type className="w-4 h-4" />
          {t.textTab}
        </button>
        <button
          onClick={() => setSubTab('files')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            subTab === 'files'
              ? 'bg-indigo-600 shadow-md text-white'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/55' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t.fileTab}
        </button>
        <button
          onClick={() => setSubTab('translate')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            subTab === 'translate'
              ? 'bg-indigo-600 shadow-md text-white'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/55' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          {t.translateTab}
        </button>
        <button
          onClick={() => setSubTab('polish')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            subTab === 'polish'
              ? 'bg-indigo-600 shadow-md text-white'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/55' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          {t.polishTab}
        </button>
      </div>

      {/* Dynamic Content area */}
      <div className="transition-all duration-300">
        {subTab === 'text' && <TextConverter theme={theme} />}
        {subTab === 'files' && <FileConverter onFileProcessed={onFileProcessed} theme={theme} />}
        
        {/* Machine Translation Module */}
        {subTab === 'translate' && (
          <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.4)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_35px_rgba(15,23,42,0.03)]'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h3 className={`text-lg font-bold tracking-wide flex items-center gap-2 font-display ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Globe2 className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Kontekstual Matn Tarjimasi
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                  Universal ko'p qatlamli tarjimon paneli. (Sinov uchun "Salom", "Rahmat", "Shartnoma", "Ariza" kabi so'zlardan boshlang).
                </p>
              </div>

              {/* Language Choice bar */}
              <div className={`flex items-center gap-2 p-1.5 rounded-xl border shrink-0 ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-805' : 'bg-slate-100 border-slate-200 shadow-inner'
              }`}>
                <select
                  value={sourceLang}
                  onChange={(e: any) => setSourceLang(e.target.value)}
                  className={`bg-transparent text-xs font-bold border-none focus:ring-0 cursor-pointer py-1.5 px-3 ${
                    theme === 'dark' ? 'text-slate-350' : 'text-slate-700'
                  }`}
                >
                  <option value="uz">O'zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="kk">Қазақша</option>
                  <option value="tr">Türkçe</option>
                </select>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                <select
                  value={targetLang}
                  onChange={(e: any) => setTargetLang(e.target.value)}
                  className={`bg-transparent text-xs font-bold border-none focus:ring-0 cursor-pointer py-1.5 px-3 ${
                    theme === 'dark' ? 'text-slate-350' : 'text-slate-700'
                  }`}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uz">O'zbekcha</option>
                  <option value="kk">Қазақша</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x rounded-2xl border overflow-hidden ${
              theme === 'dark' 
                ? 'divide-slate-800 bg-slate-950/35 border-slate-800/80' 
                : 'divide-slate-200 bg-slate-50 border-slate-200'
            }`}>
              {/* Input Pane */}
              <div className="p-5 flex flex-col min-h-[300px]">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-3 block ${
                  theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  Kiritiladigan matn ({sourceLang.toUpperCase()})
                </span>
                <textarea
                  value={transInput}
                  onChange={(e) => setTransInput(e.target.value)}
                  placeholder="Tarjima qilinadigan matnni shu yerga yozing..."
                  className={`flex-1 w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-base leading-relaxed ${
                    theme === 'dark' ? 'text-slate-100 placeholder-slate-700' : 'text-slate-900 placeholder-slate-400 font-medium'
                  }`}
                />
                <div className={`flex items-center justify-between pt-4 border-t mt-2 ${
                  theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">
                      {transInput.length} belgi
                    </span>
                    {transInput && (
                      <button
                        onClick={() => speakText(transInput, true)}
                        className={`text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-semibold ${
                          isPlayingInput ? 'text-rose-500 hover:text-rose-400' : 'text-indigo-500 hover:text-indigo-400'
                        }`}
                        title={isPlayingInput ? "To'xtatish" : "Tinglash"}
                      >
                        {isPlayingInput ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            To'xtatish
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            Tinglash
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 duration-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTranslating ? t.processing : t.convertNow}
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Output Pane */}
              <div className={`p-5 flex flex-col min-h-[300px] ${
                theme === 'dark' ? 'bg-slate-950/25' : 'bg-slate-100/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
                    theme === 'dark' ? 'text-purple-350' : 'text-purple-700'
                  }`}>
                    Natija ({targetLang.toUpperCase()})
                  </span>
                  {transOutput && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(transOutput, false)}
                        className={`p-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPlayingOutput
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20'
                            : theme === 'dark'
                              ? 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/10'
                              : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-sm'
                        }`}
                        title={isPlayingOutput ? "To'xtatish" : "Tinglash"}
                      >
                        {isPlayingOutput ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            To'xtatish
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            Tinglash
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(transOutput, 'trans')}
                        className={`p-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                          transCopied
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : theme === 'dark' 
                              ? 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/10'
                              : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-sm'
                        }`}
                      >
                        {transCopied ? t.copied : t.copy}
                      </button>
                    </div>
                  )}
                </div>
                <div className={`flex-1 overflow-y-auto text-base leading-relaxed whitespace-pre-wrap select-text ${
                  transOutput 
                    ? theme === 'dark' ? 'text-slate-100' : 'text-slate-900 font-medium' 
                    : 'text-slate-500 italic select-none'
                }`}>
                  {transOutput || t.outputPlaceholder}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Polish Module */}
        {subTab === 'polish' && (
          <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.4)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_35px_rgba(15,23,42,0.03)]'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h3 className={`text-lg font-bold tracking-wide flex items-center gap-2 font-display ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  AI Sayqallash hujjati va Tahrirlagich
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                  Imlo xatolarini o'chirish, adabiy ohang berish va gap tuzilishini yaxshilovchi milliy korpus uslubiy tizimi.
                </p>
              </div>

              {/* Style choice */}
              <div className={`flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-200 shadow-inner'
              }`}>
                <button
                  onClick={() => setPolishStyle('official')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    polishStyle === 'official' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Rasmiy-idoraviy
                </button>
                <button
                  onClick={() => setPolishStyle('literary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    polishStyle === 'literary' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Adabiy
                </button>
                <button
                  onClick={() => setPolishStyle('spellcheck')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    polishStyle === 'spellcheck' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Faqat imlo
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x rounded-2xl border overflow-hidden ${
              theme === 'dark' 
                ? 'divide-slate-800 bg-slate-950/35 border-slate-800/80' 
                : 'divide-slate-200 bg-slate-50 border-slate-200'
            }`}>
              {/* Input Pane */}
              <div className="p-5 flex flex-col min-h-[300px]">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-3 block ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-650'
                }`}>
                  Kiritiladigan tekst
                </span>
                <textarea
                  value={polishInput}
                  onChange={(e) => setPolishInput(e.target.value)}
                  placeholder="Uslubiy tahrirlanadigan, imlo xatolarini tuzatish kerak bo'lgan o'zbekcha matnni shu yerga joylang..."
                  className={`flex-1 w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-base leading-relaxed ${
                    theme === 'dark' ? 'text-slate-100 placeholder-slate-700' : 'text-slate-900 placeholder-slate-400 font-medium'
                  }`}
                />
                <div className={`flex items-center justify-between pt-4 border-t mt-2 ${
                  theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'
                }`}>
                  <span className="text-xs font-mono text-slate-500">
                    {polishInput.length} belgi
                  </span>
                  <button
                    onClick={handlePolish}
                    disabled={isPolishing}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-[#4f46e5] text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 duration-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPolishing ? t.processing : t.polishBtn}
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Output Pane */}
              <div className={`p-5 flex flex-col min-h-[300px] ${
                theme === 'dark' ? 'bg-slate-950/25' : 'bg-slate-100/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
                    theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'
                  }`}>
                    Sayqallash natijasi
                  </span>
                  {polishOutput && (
                    <button
                      onClick={() => copyToClipboard(polishOutput, 'polish')}
                      className={`p-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        polishCopied
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : theme === 'dark'
                            ? 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/10'
                            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-sm'
                      }`}
                    >
                      {polishCopied ? t.copied : t.copy}
                    </button>
                  )}
                </div>
                <div className={`flex-1 overflow-y-auto text-base leading-relaxed whitespace-pre-wrap select-text ${
                  polishOutput 
                    ? theme === 'dark' ? 'text-slate-100' : 'text-slate-900 font-medium' 
                    : 'text-slate-500 italic select-none'
                }`}>
                  {polishOutput || "Sayqallangan, tahrir qilingan natija bu yerda hosil bo'ladi..."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

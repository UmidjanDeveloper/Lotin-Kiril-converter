/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Hujjat.uz — Ultra Dark Premium redesign (Blue/Cyan theme)
 */

import React, { useState, useEffect } from 'react';
import { UI_TRANSLATIONS, Language } from './utils/translations';
import LanguageCenter from './components/LanguageCenter';
import DocumentCenter from './components/DocumentCenter';
import AiCenter from './components/AiCenter';
import AdminAIProvider from './components/AdminAIProvider';
import PricingSection from './components/PricingSection';
import Logo from './components/Logo';
import OpenSourceLabs from './components/OpenSourceLabs';
import {
  FileText, Type, Sun, Moon, Shield, ArrowRight,
  Sparkles, PenTool, Lock, BarChart3, ChevronRight,
  Globe2, Check, Zap, Clock, Trash2, FileDown, Layers
} from 'lucide-react';

type Tab = 'home' | 'lang' | 'docs' | 'ai' | 'prices' | 'opensource';

interface HistoryEntry {
  tool: string;
  filename: string;
  ts: number;
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() =>
    (localStorage.getItem('dimu_pro_lang') as Language) || 'uz'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('dimu_pro_theme') as 'dark' | 'light') || 'dark'
  );
  const [isPremium, setIsPremium] = useState(
    localStorage.getItem('dimu_pro_premium') === 'true'
  );
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sharedHandwriteText, setSharedHandwriteText] = useState('');
  const [filesCount, setFilesCount] = useState(() =>
    parseInt(localStorage.getItem('uz_translit_files_count') || '0', 10)
  );
  const [charsCount, setCharsCount] = useState(() =>
    parseInt(localStorage.getItem('uz_translit_chars_count') || '0', 10)
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('hz_history') || '[]'); } catch { return []; }
  });
  const [devPanel, setDevPanel] = useState(false);

  useEffect(() => { localStorage.setItem('dimu_pro_lang', currentLang); }, [currentLang]);
  useEffect(() => { localStorage.setItem('dimu_pro_theme', theme); }, [theme]);

  const handleFileProcessed = (chars: number, tool?: string, filename?: string) => {
    setFilesCount(p => { const v = p + 1; localStorage.setItem('uz_translit_files_count', String(v)); return v; });
    setCharsCount(p => { const v = p + chars; localStorage.setItem('uz_translit_chars_count', String(v)); return v; });
    if (tool && filename) {
      setHistory(prev => {
        const next = [{ tool, filename, ts: Date.now() }, ...prev].slice(0, 8);
        localStorage.setItem('hz_history', JSON.stringify(next));
        return next;
      });
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('hz_history');
  };

  const go = (tab: Tab) => setActiveTab(tab);
  const sendToHandwriting = (text: string) => { setSharedHandwriteText(text); go('opensource'); };

  const t = UI_TRANSLATIONS[currentLang];
  const dk = theme === 'dark';

  const NAV = [
    { id: 'home',       label: currentLang === 'uz' ? 'Bosh sahifa' : currentLang === 'ru' ? 'Главная' : 'Home' },
    { id: 'lang',       label: t.langCenter },
    { id: 'docs',       label: t.docCenter },
    { id: 'ai',         label: t.aiCenter },
    { id: 'opensource', label: currentLang === 'uz' ? "Qo'lyozma" : currentLang === 'ru' ? 'Почерк' : 'Handwrite' },
    { id: 'prices',     label: t.pricing },
  ] as const;

  const TOOLS = [
    {
      id: 'lang' as Tab, Icon: Type,
      color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]',
      title: t.langCenter, sub: 'Kirill ↔ Lotin · Tarjima',
      desc: currentLang === 'uz'
        ? 'Matn va hujjatlarni transliteratsiya qiling. AI bilan tarjima va sayqallash.'
        : currentLang === 'ru'
        ? 'Транслитерация текстов, перевод и стилизация с ИИ.'
        : 'Transliterate texts, AI translation and text polishing.',
    },
    {
      id: 'docs' as Tab, Icon: Layers,
      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.08)]',
      title: t.docCenter, sub: '26+ PDF Tools · Shablonlar',
      desc: currentLang === 'uz'
        ? 'PDF birlashtirish, bo\'lish, siqish. Ariza, shartnoma, tavsifnoma shablonlari.'
        : currentLang === 'ru'
        ? 'Слияние, разделение PDF. Шаблоны заявлений и договоров.'
        : 'Merge, split, compress PDF and professional Uzbek document templates.',
    },
    {
      id: 'ai' as Tab, Icon: Sparkles,
      color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]',
      title: t.aiCenter, sub: 'AI Chat · Konspekt · OCR',
      desc: currentLang === 'uz'
        ? 'Hujjatlarni konspektlash, AI chat va rasmiy shablonlarni AI bilan to\'ldirish.'
        : currentLang === 'ru'
        ? 'Конспектирование документов, ИИ-чат и автозаполнение шаблонов.'
        : 'Summarize documents, AI chat and auto-fill official document templates.',
    },
    {
      id: 'opensource' as Tab, Icon: PenTool,
      color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'hover:border-amber-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.08)]',
      title: currentLang === 'uz' ? "Qo'lyozma Studiyasi" : currentLang === 'ru' ? 'Студия Почерка' : 'Handwriting Studio',
      sub: '8 Shrift · Jitter · PDF · PNG',
      desc: currentLang === 'uz'
        ? 'Haqiqiy qo\'l yozuvi bilan hujjat yarating. Insoniy tebranish effekti bilan.'
        : currentLang === 'ru'
        ? 'Создавайте документы с живым почерком и эффектом дрожания.'
        : 'Create documents with real handwriting and human jitter effect.',
    },
  ] as const;

  const STATS = [
    { num: '26+',  label: currentLang === 'uz' ? 'PDF Asbob'   : currentLang === 'ru' ? 'PDF Инстр.' : 'PDF Tools'  },
    { num: '8',    label: currentLang === 'uz' ? 'HW Shrift'   : currentLang === 'ru' ? 'HW Шрифт'  : 'HW Fonts'   },
    { num: '100%', label: currentLang === 'uz' ? 'Xususiy'     : currentLang === 'ru' ? 'Приватно'  : 'Private'    },
    { num: '0',    label: currentLang === 'uz' ? "Ro'yxat"     : currentLang === 'ru' ? 'Рег.'      : 'Sign-up'    },
  ];

  const TRUST_PILLS = [
    '🔒 ' + (currentLang === 'uz' ? '100% Brauzerda' : currentLang === 'ru' ? '100% В браузере' : '100% In-Browser'),
    '⚡ Kirill ↔ Lotin',
    '📄 26+ PDF',
    '✍️ ' + (currentLang === 'uz' ? "Qo'lyozma" : currentLang === 'ru' ? 'Почерк' : 'Handwriting'),
    '🔑 ' + (currentLang === 'uz' ? "Ro'yxatsiz" : currentLang === 'ru' ? 'Без регистрации' : 'No Sign-up'),
  ];

  const toolLabelMap: Record<string, string> = {
    pdfMerge: 'PDF Birlashtirish', pdfSplit: 'PDF Bo\'lish', pdfCompress: 'PDF Siqish',
    jpgToPdf: 'JPG → PDF', wordToPdf: 'Word → PDF', watermark: 'Watermark',
    lockPdf: 'PDF Parol', pdfRotate: 'PDF Aylantirish', ocrPdf: 'OCR',
    transliterate: 'Transliteratsiya', handwriting: "Qo'lyozma",
  };

  // ── Root className ─────────────────────────────────────────────────────────────
  const rootBg = dk ? 'bg-[#050608] text-slate-100' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col selection:bg-blue-500/20 ${rootBg}`}>

      {/* ══════════════════════════════════════════
          HEADER — Ultra minimal, blur backdrop
      ══════════════════════════════════════════ */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        dk ? 'bg-[#050608]/85 border-[#1a2435]' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
              dk
                ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-[0_0_12px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg'
            }`}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-sm font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
                {t.appName}
              </span>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                isPremium
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                  : dk ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {isPremium ? 'PRO' : 'FREE'}
              </span>
            </div>
          </button>

          {/* Nav */}
          <nav className="flex-1 min-w-0 flex items-center justify-center">
            <div className={`flex items-center gap-0.5 p-1 rounded-xl border overflow-x-auto scrollbar-none ${
              dk ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-100 border-slate-200'
            }`}>
              {NAV.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => go(tab.id as Tab)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? dk
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'bg-white text-blue-700 shadow-sm'
                      : dk ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg border ${
              dk ? 'border-[#21262d] bg-[#0d1117]' : 'border-slate-200 bg-white'
            }`}>
              {(['uz', 'ru', 'en'] as const).map(lng => (
                <button key={lng} onClick={() => setCurrentLang(lng)}
                  className={`px-2 py-1 rounded-md text-[10px] font-black uppercase cursor-pointer transition ${
                    currentLang === lng
                      ? 'bg-blue-600 text-white shadow-sm'
                      : dk ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}>
                  {lng === 'uz' ? "O'z" : lng}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border cursor-pointer transition-all ${
                dk
                  ? 'border-[#21262d] bg-[#0d1117] text-yellow-400 hover:border-yellow-500/30'
                  : 'border-slate-200 bg-white text-amber-500 hover:bg-slate-50'
              }`}>
              {dk ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HOME ── */}
        {activeTab === 'home' && (
          <div className="space-y-24 animate-slide-up">

            {/* ─── HERO ───────────────────────────────── */}
            <section className="relative min-h-[82vh] flex flex-col items-center justify-center text-center overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">

              {/* Background: Grid + blobs */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 hero-grid opacity-60" />
                <div
                  className="absolute top-10 left-[15%] w-[600px] h-[600px] rounded-full blur-3xl animate-blob"
                  style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)' }}
                />
                <div
                  className="absolute bottom-0 right-[10%] w-[500px] h-[500px] rounded-full blur-3xl animate-blob"
                  style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', animationDelay: '3s' }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
                  style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 60%)' }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">

                {/* Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold ${
                  dk
                    ? 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                    : 'border-blue-200 bg-blue-50 text-blue-600'
                }`}>
                  <Zap className="w-3.5 h-3.5 fill-current opacity-80" />
                  {currentLang === 'uz'
                    ? "O'zbekiston Hujjat Platformasi №1"
                    : currentLang === 'ru'
                    ? 'Платформа документов №1 в Узбекистане'
                    : "Uzbekistan's #1 Document Platform"}
                </div>

                {/* Heading */}
                <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.04] ${
                  dk ? 'text-white' : 'text-slate-900'
                }`}>
                  {currentLang === 'uz' ? (
                    <>
                      Hujjatlaringizni<br />
                      <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                        biz bilan osonlashtiring
                      </span>
                    </>
                  ) : currentLang === 'ru' ? (
                    <>
                      Управляйте<br />
                      <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                        документами легко
                      </span>
                    </>
                  ) : (
                    <>
                      Manage your documents<br />
                      <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                        effortlessly
                      </span>
                    </>
                  )}
                </h1>

                {/* Subtitle */}
                <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.appPositioning}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => go('docs')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-2xl text-white cursor-pointer transition-all duration-300
                      bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                      shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]
                      active:scale-95"
                  >
                    {currentLang === 'uz' ? 'Hozir Boshlash' : currentLang === 'ru' ? 'Начать сейчас' : 'Get Started'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => go('lang')}
                    className={`inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-2xl border cursor-pointer transition-all duration-300 active:scale-95 ${
                      dk
                        ? 'border-[#21262d] text-slate-300 hover:border-blue-500/40 hover:text-white hover:bg-blue-500/5'
                        : 'border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <Globe2 className="w-4 h-4" />
                    {t.langCenter}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-5 pt-2">
                  {STATS.map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {s.num}
                      </div>
                      <div className={`text-xs font-semibold mt-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {TRUST_PILLS.map(p => (
                    <span key={p} className={`text-[11px] font-medium px-3 py-1.5 rounded-full border ${
                      dk
                        ? 'border-[#21262d] bg-[#0d1117] text-slate-400'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── TOOL CARDS ─────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono ${
                  dk ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {t.chooseService}
                </p>
                <div className={`h-px flex-1 ml-6 ${dk ? 'bg-[#21262d]' : 'bg-slate-100'}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {TOOLS.map(card => (
                  <div
                    key={card.id}
                    onClick={() => go(card.id)}
                    className={`group relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 card-glow ${
                      dk
                        ? `bg-[#0d1117] border-[#21262d] ${card.border}`
                        : `bg-white border-slate-200 ${card.border} hover:shadow-md`
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}>
                      <card.Icon className={`w-5 h-5 ${card.color}`} />
                    </div>

                    {/* Sub */}
                    <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-2 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                      {card.sub}
                    </p>

                    {/* Title */}
                    <h3 className={`text-sm font-bold mb-2.5 transition-colors ${
                      dk ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {card.title}
                    </h3>

                    {/* Desc */}
                    <p className={`text-xs leading-relaxed ${dk ? 'text-slate-500' : 'text-slate-500'}`}>
                      {card.desc}
                    </p>

                    {/* CTA */}
                    <div className={`mt-5 pt-4 border-t flex items-center gap-1.5 text-xs font-bold transition-all duration-300 group-hover:gap-3 ${
                      dk
                        ? `border-[#21262d] text-slate-600 group-hover:${card.color}`
                        : `border-slate-100 text-slate-400 group-hover:text-blue-600`
                    }`}>
                      {currentLang === 'uz' ? 'Ochish' : currentLang === 'ru' ? 'Открыть' : 'Open'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── RECENT HISTORY ─────────────────────── */}
            {history.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <Clock className={`w-4 h-4 ${dk ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h2 className={`text-sm font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>
                      {currentLang === 'uz' ? 'Oxirgi Amallar' : currentLang === 'ru' ? 'Последние операции' : 'Recent Activity'}
                    </h2>
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                      dk ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>{history.length}</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition ${
                      dk ? 'text-slate-600 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {currentLang === 'uz' ? 'Tozalash' : currentLang === 'ru' ? 'Очистить' : 'Clear'}
                  </button>
                </div>
                <div className={`rounded-2xl border divide-y ${
                  dk ? 'bg-[#0d1117] border-[#21262d] divide-[#21262d]' : 'bg-white border-slate-200 divide-slate-100'
                }`}>
                  {history.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dk ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                          <FileDown className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
                            {entry.filename}
                          </p>
                          <p className={`text-[10px] font-mono ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                            {toolLabelMap[entry.tool] || entry.tool}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono whitespace-nowrap ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                        {new Date(entry.ts).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── FEATURE HIGHLIGHTS ─────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-5 h-5 text-blue-400" />,
                  bg: dk ? 'bg-blue-500/8 border-blue-500/10' : 'bg-blue-50 border-blue-100',
                  title: currentLang === 'uz' ? 'Tez va aniq' : currentLang === 'ru' ? 'Быстро и точно' : 'Fast & Accurate',
                  desc: currentLang === 'uz'
                    ? 'Mahalliy algoritmlar bilan yuqori aniqlikda ishlov bering. Bir necha soniyada natija.'
                    : currentLang === 'ru'
                    ? 'Локальные алгоритмы обеспечивают высокую точность. Результат за секунды.'
                    : 'Local algorithms deliver high accuracy results in seconds.',
                },
                {
                  icon: <Lock className="w-5 h-5 text-emerald-400" />,
                  bg: dk ? 'bg-emerald-500/8 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100',
                  title: currentLang === 'uz' ? 'Maxfiylik kafolati' : currentLang === 'ru' ? 'Конфиденциальность' : 'Privacy First',
                  desc: currentLang === 'uz'
                    ? 'Fayllaringiz serverga yuklanmaydi. Hamma narsa faqat brauzeringizda.'
                    : currentLang === 'ru'
                    ? 'Ваши файлы не покидают браузер. Никакой загрузки на сервер.'
                    : 'Your files never leave the browser. Zero server upload.',
                },
                {
                  icon: <Check className="w-5 h-5 text-cyan-400" />,
                  bg: dk ? 'bg-cyan-500/8 border-cyan-500/10' : 'bg-cyan-50 border-cyan-100',
                  title: currentLang === 'uz' ? "Ro'yxatdan o'tish shart emas" : currentLang === 'ru' ? 'Без регистрации' : 'No Registration',
                  desc: currentLang === 'uz'
                    ? 'Parol va email kerak emas. Bosing va ishlang.'
                    : currentLang === 'ru'
                    ? 'Никакого пароля или email. Просто откройте и работайте.'
                    : 'No password needed. Just open and work.',
                },
              ].map(f => (
                <div key={f.title} className={`p-5 rounded-2xl border ${dk ? 'bg-[#0d1117]' : 'bg-white'} ${f.bg}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    dk ? 'bg-[#0d1117]' : 'bg-white'
                  } border ${f.bg}`}>
                    {f.icon}
                  </div>
                  <h3 className={`text-sm font-bold mb-2 ${dk ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-xs leading-relaxed ${dk ? 'text-slate-500' : 'text-slate-500'}`}>{f.desc}</p>
                </div>
              ))}
            </section>

            {/* ─── USAGE STATS (only if user has data) ── */}
            {(filesCount > 0 || charsCount > 0) && (
              <section className={`flex flex-wrap items-center justify-center gap-6 p-5 rounded-2xl border ${
                dk ? 'bg-[#0d1117] border-[#21262d]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t.statsFiles}:{' '}
                    <strong className={dk ? 'text-white' : 'text-slate-900'}>{filesCount}</strong>
                  </span>
                </div>
                <div className={`hidden sm:block w-px h-4 ${dk ? 'bg-[#21262d]' : 'bg-slate-200'}`} />
                <span className={`text-sm ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.statsChars}:{' '}
                  <strong className={dk ? 'text-white' : 'text-slate-900'}>~{charsCount.toLocaleString()}</strong>
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('uz_translit_files_count');
                    localStorage.removeItem('uz_translit_chars_count');
                    setFilesCount(0); setCharsCount(0);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-400 cursor-pointer font-semibold ml-auto"
                >
                  {t.statsReset}
                </button>
              </section>
            )}

            {/* ─── PRIVACY BANNER ─────────────────────── */}
            <section className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border ${
              dk
                ? 'bg-blue-950/20 border-blue-900/30 text-slate-300'
                : 'bg-blue-50/70 border-blue-100 text-blue-900'
            }`}>
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 shrink-0 ${dk ? 'text-blue-400' : 'text-blue-500'}`} />
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  <span className={`font-bold ${dk ? 'text-blue-400' : 'text-blue-600'}`}>{t.badgePrivate}:</span>{' '}
                  {t.privacyBanner}
                </p>
              </div>
              <button
                onClick={() => go('prices')}
                className={`text-xs font-bold shrink-0 flex items-center gap-1 whitespace-nowrap cursor-pointer hover:underline ${
                  dk ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {t.pricingDetails}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </section>
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {activeTab === 'lang' && (
          <LanguageCenter currentLang={currentLang} theme={theme} onFileProcessed={handleFileProcessed} onSendToHandwriting={sendToHandwriting} />
        )}
        {activeTab === 'docs' && (
          <DocumentCenter currentLang={currentLang} theme={theme} onSendToHandwriting={sendToHandwriting} />
        )}
        {activeTab === 'ai' && (
          <AiCenter currentLang={currentLang} theme={theme} onSendToHandwriting={sendToHandwriting} />
        )}
        {activeTab === 'prices' && (
          <PricingSection
            currentLang={currentLang} theme={theme}
            onUpgradeSuccess={() => { setIsPremium(true); localStorage.setItem('dimu_pro_premium', 'true'); }}
            isPremium={isPremium}
          />
        )}
        {activeTab === 'opensource' && (
          <OpenSourceLabs currentLang={currentLang} theme={theme} sharedHandwriteText={sharedHandwriteText} clearSharedHandwriteText={() => setSharedHandwriteText('')} />
        )}
      </main>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className={`border-t mt-8 py-10 ${dk ? 'border-[#1a2435] bg-[#050608]' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className={`text-sm font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{t.appName}</span>
            </div>
            <p className={`text-xs ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
              {currentLang === 'uz'
                ? "O'zbekiston uchun ❤️ bilan yaratildi — fayllar serverga yuklanmaydi"
                : currentLang === 'ru'
                ? "Сделано с ❤️ для Узбекистана — файлы не покидают браузер"
                : "Made with ❤️ for Uzbekistan — files never leave your browser"}
            </p>
          </div>

          <div className={`border-t ${dk ? 'border-[#1a2435]' : 'border-slate-100'}`} />

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => go(tab.id as Tab)}
                className={`text-xs font-semibold cursor-pointer transition hover:text-blue-500 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Kirill ↔ Lotin', 'AI Tarjima', '26+ PDF Tools', "Qo'lyozma", 'OCR', 'Ariza · Shartnoma'].map(f => (
              <span key={f} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                dk ? 'border-[#21262d] text-slate-600' : 'border-slate-200 text-slate-400'
              }`}>
                {f}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p
            className={`text-center text-xs font-semibold select-none cursor-default ${dk ? 'text-slate-600' : 'text-slate-400'}`}
            onDoubleClick={() => setDevPanel(v => !v)}
          >
            © {new Date().getFullYear()}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-bold">{t.appName}</span>
            {' '}—{' '}{t.appSlogan}
          </p>

          {/* Dev panel */}
          {devPanel && (
            <div className={`mx-auto max-w-xs p-4 rounded-2xl border text-xs ${dk ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-100 border-slate-300'}`}>
              <p className={`font-mono font-bold mb-2 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>Dev: AI Provider Override</p>
              <AdminAIProvider />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

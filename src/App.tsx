/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Hujjat.uz — O'zbek matn va hujjatlar platformasi
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
  Zap, Sparkles, PenTool, Lock, BarChart3, ChevronRight,
  Globe2, Check
} from 'lucide-react';

type Tab = 'home' | 'lang' | 'docs' | 'ai' | 'prices' | 'opensource';

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
  const [devPanel, setDevPanel] = useState(false);

  useEffect(() => { localStorage.setItem('dimu_pro_lang', currentLang); }, [currentLang]);
  useEffect(() => { localStorage.setItem('dimu_pro_theme', theme); }, [theme]);

  const handleFileProcessed = (chars: number) => {
    setFilesCount(p => { const v = p + 1; localStorage.setItem('uz_translit_files_count', String(v)); return v; });
    setCharsCount(p => { const v = p + chars; localStorage.setItem('uz_translit_chars_count', String(v)); return v; });
  };

  const go = (tab: Tab) => setActiveTab(tab);
  const sendToHandwriting = (text: string) => { setSharedHandwriteText(text); go('opensource'); };

  const t = UI_TRANSLATIONS[currentLang];
  const dk = theme === 'dark';

  const NAV = [
    { id: 'home',       label: t.homeTab },
    { id: 'lang',       label: t.langCenter },
    { id: 'docs',       label: t.docCenter },
    { id: 'ai',         label: t.aiCenter },
    { id: 'opensource', label: currentLang === 'uz' ? "Qo'lyozma" : currentLang === 'ru' ? 'Почерк' : 'Handwrite' },
    { id: 'prices',     label: t.pricing },
  ] as const;

  const TOOLS = [
    {
      id: 'lang' as Tab, Icon: Type,
      color: 'text-indigo-500', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/30',
      hoverBorder: dk ? 'hover:border-indigo-500/40' : 'hover:border-indigo-400',
      title: t.langCenter, sub: 'Kirill ↔ Lotin · Tarjima · Sayqallash',
      desc: currentLang === 'uz'
        ? 'Matn va butun hujjatlarni transliteratsiya qiling, AI bilan tarjima va sayqallash.'
        : currentLang === 'ru'
        ? 'Транслитерация текстов, ИИ-перевод на 5 языков и стилизация текста.'
        : 'Transliterate texts, AI translation to 5 languages and text polishing.',
    },
    {
      id: 'docs' as Tab, Icon: FileText,
      color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30',
      hoverBorder: dk ? 'hover:border-emerald-500/40' : 'hover:border-emerald-400',
      title: t.docCenter,
      sub: '26+ PDF Tools · Shablonlar',
      desc: currentLang === 'uz'
        ? 'PDF birlashtirish, bo\'lish, siqish, ariza, shartnoma, tavsifnoma shablonlari.'
        : currentLang === 'ru'
        ? 'Слияние, разделение, сжатие PDF, шаблоны заявлений и договоров.'
        : 'Merge, split, compress PDF and professional Uzbek document templates.',
    },
    {
      id: 'ai' as Tab, Icon: Sparkles,
      color: 'text-violet-500', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30',
      hoverBorder: dk ? 'hover:border-violet-500/40' : 'hover:border-violet-400',
      title: t.aiCenter, sub: 'Gemini AI · Chat · Konspekt',
      desc: currentLang === 'uz'
        ? 'Hujjatlarni konspektlash, AI chat va rasmiy shablonlarni AI bilan to\'ldirish.'
        : currentLang === 'ru'
        ? 'Конспектирование документов, ИИ-чат и автозаполнение официальных шаблонов.'
        : 'Summarize documents, AI chat and auto-fill official Uzbek document templates.',
    },
    {
      id: 'opensource' as Tab, Icon: PenTool,
      color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30',
      hoverBorder: dk ? 'hover:border-amber-500/40' : 'hover:border-amber-400',
      title: currentLang === 'uz' ? "Qo'lyozma Studiyasi" : currentLang === 'ru' ? 'Студия Почерка' : 'Handwriting Studio',
      sub: 'WYSIWYG · Print · PDF · PNG',
      desc: currentLang === 'uz'
        ? 'Varoqning istalgan joyiga matn qo\'ying, suring va chop eting — Word kabi tahrirlash.'
        : currentLang === 'ru'
        ? 'Размещайте текст в любом месте, перетаскивайте и печатайте как в Word.'
        : 'Place text anywhere, drag to reposition and print — fully WYSIWYG.',
    },
  ] as const;

  // ── Root className ─────────────────────────────────────────────────────────
  const rootCls = `min-h-screen flex flex-col selection:bg-indigo-500/20 ${
    dk ? 'bg-[#08090f] text-slate-100' : 'bg-slate-50 text-slate-900'
  }`;

  return (
    <div className={rootCls}>

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
        dk ? 'bg-[#08090f]/95 border-slate-800/80' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
            <Logo size={34} />
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-sm font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
                {t.appName}
              </span>
              {isPremium ? (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">PRO</span>
              ) : (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20">FREE</span>
              )}
            </div>
          </button>

          {/* Nav — scrollable on mobile */}
          <nav className="flex-1 min-w-0 flex items-center justify-center">
            <div className={`flex items-center gap-0.5 p-1 rounded-xl border overflow-x-auto scrollbar-none ${
              dk ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {NAV.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => go(tab.id as Tab)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? dk ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm'
                      : dk ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
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
              dk ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
            }`}>
              {(['uz', 'ru', 'en'] as const).map(lng => (
                <button key={lng} onClick={() => setCurrentLang(lng)}
                  className={`px-2 py-1 rounded-md text-[10px] font-black uppercase cursor-pointer transition ${
                    currentLang === lng ? 'bg-indigo-600 text-white' : dk ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}>
                  {lng === 'uz' ? "O'z" : lng}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border cursor-pointer transition-all ${
                dk ? 'border-slate-800 bg-slate-900/50 text-yellow-400 hover:bg-slate-800' : 'border-slate-200 bg-white text-amber-500 hover:bg-slate-100'
              }`}>
              {dk ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HOME ── */}
        {activeTab === 'home' && (
          <div className="space-y-16 animate-slide-up">

            {/* HERO */}
            <section className="pt-10 pb-4 text-center max-w-3xl mx-auto space-y-6">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                dk ? 'border-indigo-500/25 bg-indigo-950/40 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-600'
              }`}>
                <Zap className="w-3.5 h-3.5 fill-current opacity-80" />
                {t.heroSub}
              </div>

              {/* Headline */}
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] ${dk ? 'text-white' : 'text-slate-900'}`}>
                {currentLang === 'uz' ? (
                  <>
                    O'zbek hujjatlar<br />
                    <span className="text-indigo-500">platformasi №1</span>
                  </>
                ) : currentLang === 'ru' ? (
                  <>
                    Платформа №1<br />
                    <span className="text-indigo-500">для документов на узбекском</span>
                  </>
                ) : (
                  <>
                    Uzbekistan's<br />
                    <span className="text-indigo-500">#1 Document Platform</span>
                  </>
                )}
              </h1>

              {/* Sub */}
              <p className={`text-base sm:text-lg leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.appPositioning}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => go('docs')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  {currentLang === 'uz' ? 'Hozir boshlash' : currentLang === 'ru' ? 'Начать сейчас' : 'Get Started'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => go('lang')}
                  className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl border transition cursor-pointer ${
                    dk ? 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Globe2 className="w-4 h-4" />
                  {t.langCenter}
                </button>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  '🔒 ' + (currentLang === 'uz' ? '100% Brauzerda' : currentLang === 'ru' ? '100% В браузере' : '100% In-Browser'),
                  '⚡ Kirill ↔ Lotin',
                  '📄 26+ PDF',
                  '🤖 Gemini AI',
                  '✍️ ' + (currentLang === 'uz' ? "Qo'lyozma" : currentLang === 'ru' ? 'Почерк' : 'Handwriting'),
                  '🔑 ' + (currentLang === 'uz' ? "Ro'yxatsiz" : currentLang === 'ru' ? 'Без регистрации' : 'No Sign-up'),
                ].map(p => (
                  <span key={p} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    dk ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
                  }`}>{p}</span>
                ))}
              </div>
            </section>

            {/* DIVIDER */}
            <div className={`border-t ${dk ? 'border-slate-800/60' : 'border-slate-100'}`} />

            {/* TOOL CARDS */}
            <section>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono text-center mb-6 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                {t.chooseService}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TOOLS.map(card => (
                  <div
                    key={card.id}
                    onClick={() => go(card.id)}
                    className={`group relative p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      dk
                        ? `bg-slate-900/40 border-slate-800 ${card.hoverBorder} hover:bg-slate-900/70`
                        : `bg-white border-slate-200 ${card.hoverBorder} hover:shadow-md`
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110`}>
                      <card.Icon className={`w-5 h-5 ${card.color}`} />
                    </div>

                    {/* Sub label */}
                    <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                      {card.sub}
                    </p>

                    {/* Title */}
                    <h3 className={`text-sm font-bold mb-2.5 ${dk ? 'text-white' : 'text-slate-900'}`}>
                      {card.title}
                    </h3>

                    {/* Desc */}
                    <p className={`text-xs leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                      {card.desc}
                    </p>

                    {/* CTA */}
                    <div className={`mt-5 pt-4 border-t flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2.5 ${
                      dk ? `border-slate-800 ${card.color}` : `border-slate-100 ${card.color}`
                    }`}>
                      {currentLang === 'uz' ? 'Ochish' : currentLang === 'ru' ? 'Открыть' : 'Open'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DIVIDER */}
            <div className={`border-t ${dk ? 'border-slate-800/60' : 'border-slate-100'}`} />

            {/* FEATURE HIGHLIGHTS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-5 h-5 text-indigo-400" />,
                  bg: 'bg-indigo-500/8',
                  title: currentLang === 'uz' ? 'Tez va ishonchli' : currentLang === 'ru' ? 'Быстро и надёжно' : 'Fast & Reliable',
                  desc: currentLang === 'uz'
                    ? 'Gemini AI va mahalliy algoritmlar bilan yuqori aniqlikda ishlov bering. Bir necha soniyada tayyor.'
                    : currentLang === 'ru'
                    ? 'Gemini AI и локальные алгоритмы обеспечивают высокую точность. Результат за секунды.'
                    : 'Gemini AI and local algorithms deliver high accuracy. Results in seconds.',
                },
                {
                  icon: <Lock className="w-5 h-5 text-emerald-400" />,
                  bg: 'bg-emerald-500/8',
                  title: currentLang === 'uz' ? 'Maxfiylik kafolati' : currentLang === 'ru' ? 'Гарантия конфиденциальности' : 'Privacy Guaranteed',
                  desc: currentLang === 'uz'
                    ? 'Fayllaringiz serverga yuklanmaydi. Hamma narsa faqat brauzeringizda ishlaydi.'
                    : currentLang === 'ru'
                    ? 'Ваши файлы не покидают браузер. Никакой загрузки на сервер.'
                    : 'Your files never leave your browser. Zero server upload.',
                },
                {
                  icon: <Check className="w-5 h-5 text-amber-400" />,
                  bg: 'bg-amber-500/8',
                  title: currentLang === 'uz' ? "Ro'yxatdan o'tish shart emas" : currentLang === 'ru' ? 'Без регистрации' : 'No Registration',
                  desc: currentLang === 'uz'
                    ? 'Parol va email kerak emas. Bosing va ishlang — shuncha oddiy.'
                    : currentLang === 'ru'
                    ? 'Никакого пароля или email. Просто откройте и работайте.'
                    : 'No password or email needed. Just open and work.',
                },
              ].map(f => (
                <div key={f.title} className={`p-5 rounded-2xl border ${dk ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className={`text-sm font-bold mb-2 ${dk ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-xs leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                </div>
              ))}
            </section>

            {/* STATS (only when user has data) */}
            {(filesCount > 0 || charsCount > 0) && (
              <section className={`flex flex-wrap items-center justify-center gap-6 p-5 rounded-2xl border ${
                dk ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span className={`text-sm ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t.statsFiles}:{' '}
                    <strong className={dk ? 'text-white' : 'text-slate-900'}>{filesCount}</strong>
                  </span>
                </div>
                <div className={`hidden sm:block w-px h-4 ${dk ? 'bg-slate-700' : 'bg-slate-200'}`} />
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
                  className="text-xs text-rose-500 hover:underline cursor-pointer font-semibold ml-auto"
                >
                  {t.statsReset}
                </button>
              </section>
            )}

            {/* PRIVACY BANNER */}
            <section className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border ${
              dk ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
            }`}>
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 shrink-0 ${dk ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  <span className={`font-bold ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>{t.badgePrivate}:</span>{' '}
                  {t.privacyBanner}
                </p>
              </div>
              <button
                onClick={() => go('prices')}
                className={`text-xs font-bold shrink-0 flex items-center gap-1 whitespace-nowrap ${dk ? 'text-indigo-400' : 'text-indigo-600'} hover:underline cursor-pointer`}
              >
                {t.pricingDetails}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </section>
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {activeTab === 'lang' && (
          <LanguageCenter
            currentLang={currentLang}
            theme={theme}
            onFileProcessed={handleFileProcessed}
            onSendToHandwriting={sendToHandwriting}
          />
        )}
        {activeTab === 'docs' && (
          <DocumentCenter
            currentLang={currentLang}
            theme={theme}
            onSendToHandwriting={sendToHandwriting}
          />
        )}
        {activeTab === 'ai' && (
          <AiCenter
            currentLang={currentLang}
            theme={theme}
            onSendToHandwriting={sendToHandwriting}
          />
        )}
        {activeTab === 'prices' && (
          <PricingSection
            currentLang={currentLang}
            theme={theme}
            onUpgradeSuccess={() => { setIsPremium(true); localStorage.setItem('dimu_pro_premium', 'true'); }}
            isPremium={isPremium}
          />
        )}
        {activeTab === 'opensource' && (
          <OpenSourceLabs
            currentLang={currentLang}
            theme={theme}
            sharedHandwriteText={sharedHandwriteText}
            clearSharedHandwriteText={() => setSharedHandwriteText('')}
          />
        )}
      </main>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className={`border-t mt-8 py-10 ${dk ? 'border-slate-800/70 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {NAV.map(tab => (
              <button
                key={tab.id}
                onClick={() => go(tab.id as Tab)}
                className={`text-xs font-semibold cursor-pointer hover:text-indigo-500 transition ${dk ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`border-t ${dk ? 'border-slate-800/60' : 'border-slate-100'}`} />

          {/* Feature tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Kirill ↔ Lotin', 'AI Tarjima', '26+ PDF Tools',
              "Qo'lyozma", 'OCR', 'Ariza · Shartnoma · Tavsifnoma',
            ].map(f => (
              <span key={f} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${dk ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                {f}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center space-y-1.5">
            <p
              className={`text-xs font-semibold select-none cursor-default ${dk ? 'text-slate-500' : 'text-slate-400'}`}
              onDoubleClick={() => setDevPanel(v => !v)}
            >
              © {new Date().getFullYear()}{' '}
              <span className="text-indigo-500 font-bold">{t.appName}</span>
              {' '}—{' '}{t.appSlogan}
            </p>
            <p className={`text-[11px] ${dk ? 'text-slate-600' : 'text-slate-300'}`}>
              {currentLang === 'uz'
                ? "O'zbekiston uchun ❤️ bilan yaratildi — fayllar serverga yuklanmaydi"
                : currentLang === 'ru'
                ? "Сделано с ❤️ для Узбекистана — файлы не покидают ваш браузер"
                : "Made with ❤️ for Uzbekistan — files never leave your browser"}
            </p>
          </div>

          {/* Dev panel */}
          {devPanel && (
            <div className={`mx-auto max-w-xs p-4 rounded-2xl border text-xs ${dk ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
              <p className={`font-mono font-bold mb-2 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>Dev: AI Provider Override</p>
              <AdminAIProvider />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Hujjat.uz — Wero-inspired redesign
 * Gradient bg · Hamburger · Bottom mobile nav · Scroll-to-top · Full i18n
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Globe2, Check, Zap, Clock, Trash2, FileDown, Layers,
  Download, WifiOff, X, Menu, Home, Star
} from 'lucide-react';

type Tab = 'home' | 'lang' | 'docs' | 'ai' | 'prices' | 'opensource';

interface HistoryEntry { tool: string; filename: string; ts: number; }

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal(rootRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    const targets = document.querySelectorAll('.reveal');
    targets.forEach(t => observer.observe(t));
    return () => observer.disconnect();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() =>
    (localStorage.getItem('hz_lang') as Language) || 'uz'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('hz_theme') as 'dark' | 'light') || 'dark'
  );
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('hz_premium') === 'true');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sharedHandwriteText, setSharedHandwriteText] = useState('');
  const [filesCount, setFilesCount] = useState(() => parseInt(localStorage.getItem('uz_files') || '0', 10));
  const [charsCount, setCharsCount] = useState(() => parseInt(localStorage.getItem('uz_chars') || '0', 10));
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('hz_history') || '[]'); } catch { return []; }
  });
  const [devPanel, setDevPanel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useReveal();

  // ── Persist settings ───────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('hz_lang', currentLang); }, [currentLang]);
  useEffect(() => { localStorage.setItem('hz_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('hz_premium', isPremium ? 'true' : 'false'); }, [isPremium]);

  // ── Scroll-to-top on tab change ───────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setMenuOpen(false);
  }, [activeTab]);

  // ── Online/offline ─────────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── PWA install prompt ─────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('hz_install_dismissed')) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', h as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', h as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const r = await installPrompt.userChoice;
    if (r.outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('hz_install_dismissed', '1');
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFileProcessed = (chars: number, tool?: string, filename?: string) => {
    setFilesCount(p => { const v = p + 1; localStorage.setItem('uz_files', String(v)); return v; });
    setCharsCount(p => { const v = p + chars; localStorage.setItem('uz_chars', String(v)); return v; });
    if (tool && filename) {
      setHistory(prev => {
        const next = [{ tool, filename, ts: Date.now() }, ...prev].slice(0, 8);
        localStorage.setItem('hz_history', JSON.stringify(next));
        return next;
      });
    }
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem('hz_history'); };
  const go = (tab: Tab) => setActiveTab(tab);
  const sendToHandwriting = (text: string) => { setSharedHandwriteText(text); go('opensource'); };

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.uz;
  const dk = theme === 'dark';

  // ── Navigation config ──────────────────────────────────────────────────────
  const NAV = [
    { id: 'home',       label: t.homeTab || 'Home' },
    { id: 'lang',       label: t.langCenter },
    { id: 'docs',       label: t.docCenter },
    { id: 'ai',         label: t.aiCenter },
    { id: 'opensource', label: currentLang === 'uz' ? "Qo'lyozma" : currentLang === 'ru' ? 'Почерк' : 'Handwrite' },
    { id: 'prices',     label: t.pricing },
  ] as const;

  const MOBILE_NAV = [
    { id: 'home',       Icon: Home,      label: currentLang==='uz'?'Bosh':currentLang==='ru'?'Главная':'Home' },
    { id: 'lang',       Icon: Type,      label: currentLang==='uz'?'Til':currentLang==='ru'?'Язык':'Lang' },
    { id: 'docs',       Icon: Layers,    label: currentLang==='uz'?'PDF':currentLang==='ru'?'PDF':'PDF' },
    { id: 'ai',         Icon: Sparkles,  label: currentLang==='uz'?'AI':currentLang==='ru'?'ИИ':'AI' },
    { id: 'opensource', Icon: PenTool,   label: currentLang==='uz'?'Yozuv':currentLang==='ru'?'Почерк':'Write' },
  ] as const;

  const TOOLS = [
    {
      id: 'lang' as Tab,
      Icon: Type,
      gradient: 'from-violet-600 to-blue-600',
      glow: 'hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]',
      badge: 'Kirill ↔ Lotin',
      title: t.langCenter,
      desc: currentLang==='uz'
        ? 'Matn va hujjatlarni transliteratsiya. AI tarjima 5 tilda. Matn sayqallash.'
        : currentLang==='ru'
        ? 'Транслитерация текстов и документов. AI-перевод на 5 языков. Корректор.'
        : 'Transliterate texts & documents. AI translation in 5 languages. Polish.',
    },
    {
      id: 'docs' as Tab,
      Icon: FileText,
      gradient: 'from-emerald-600 to-teal-600',
      glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      badge: '26+ PDF',
      title: t.docCenter,
      desc: currentLang==='uz'
        ? "PDF birlashtirish, bo'lish, siqish, OCR. Ariza, shartnoma shablonlari."
        : currentLang==='ru'
        ? 'Слияние, разделение, сжатие PDF, OCR. Шаблоны заявлений и договоров.'
        : 'Merge, split, compress PDF, OCR. Official Uzbek document templates.',
    },
    {
      id: 'ai' as Tab,
      Icon: Sparkles,
      gradient: 'from-blue-600 to-cyan-600',
      glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      badge: 'Gemini AI',
      title: t.aiCenter,
      desc: currentLang==='uz'
        ? "Hujjatlarni konspektlash, AI chat va rasmiy shablonlarni to'ldirish."
        : currentLang==='ru'
        ? 'Конспектирование, ИИ-чат и автозаполнение официальных шаблонов.'
        : 'Summarize docs, AI chat and auto-fill official document templates.',
    },
    {
      id: 'opensource' as Tab,
      Icon: PenTool,
      gradient: 'from-amber-500 to-orange-600',
      glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      badge: '8 shrift · Jitter',
      title: currentLang==='uz' ? "Qo'lyozma Studiyasi" : currentLang==='ru' ? 'Студия Почерка' : 'Handwriting Studio',
      desc: currentLang==='uz'
        ? "Haqiqiy qo'l yozuvi effekti. 8 shrift, insoniy tebranish, PDF/PNG eksport."
        : currentLang==='ru'
        ? 'Реальный эффект почерка. 8 шрифтов, дрожание, экспорт PDF/PNG.'
        : 'Real handwriting effect. 8 fonts, human jitter, PDF/PNG export.',
    },
  ] as const;

  const TRUST_PILLS = [
    '🔒 ' + (currentLang==='uz'?'100% Brauzerda':currentLang==='ru'?'100% В браузере':'100% In-Browser'),
    '⚡ Kirill ↔ Lotin',
    '📄 26+ PDF',
    '✍️ ' + (currentLang==='uz'?"Qo'lyozma":currentLang==='ru'?'Почерк':'Handwriting'),
    '🔑 ' + (currentLang==='uz'?"Ro'yxatsiz":currentLang==='ru'?'Без рег.':'No Sign-up'),
  ];

  const toolLabel: Record<string, string> = {
    pdfMerge: 'PDF Merge', pdfSplit: 'PDF Split', pdfCompress: 'PDF Compress',
    jpgToPdf: 'JPG → PDF', wordToPdf: 'Word → PDF',
    transliterate: 'Transliteratsiya', handwriting: "Qo'lyozma",
  };

  // ── Root styles ─────────────────────────────────────────────────────────────
  const rootBg = dk
    ? 'bg-[#0f0820] text-slate-100'
    : 'bg-[#f8f5ff] text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col selection:bg-violet-500/25 ${rootBg}`}>

      {/* ── Animated gradient background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{
          background: dk
            ? 'linear-gradient(135deg, #0f0820 0%, #0b1542 50%, #091a2e 100%)'
            : 'linear-gradient(135deg, #f5f0ff 0%, #eff4ff 50%, #ecfcff 100%)'
        }} />
        <div className="absolute top-[-100px] left-[10%] w-[700px] h-[700px] rounded-full blur-3xl animate-blob"
          style={{ background: dk ? 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full blur-3xl animate-blob"
          style={{ background: dk ? 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', animationDelay:'3s' }} />
        <div className="absolute top-[40%] left-[45%] w-[500px] h-[500px] rounded-full blur-3xl animate-blob"
          style={{ background: dk ? 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', animationDelay:'6s' }} />
      </div>

      {/* ── Offline banner ── */}
      {!isOnline && (
        <div className="relative z-50 flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/20 border-b border-amber-500/30 text-amber-400 text-xs font-semibold">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          {currentLang==='uz'
            ? 'Offline rejim — Transliteratsiya va PDF ishlaydi. AI xizmatlar vaqtincha mavjud emas.'
            : currentLang==='ru'
            ? 'Офлайн — Транслитерация и PDF работают. ИИ-сервисы временно недоступны.'
            : 'Offline — Transliteration & PDF work. AI services temporarily unavailable.'}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
        dk ? 'bg-[#0f0820]/90 border-white/8' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0 cursor-pointer group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_14px_rgba(124,58,237,0.4)] group-hover:shadow-[0_0_22px_rgba(124,58,237,0.6)] transition-all">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className={`hidden sm:block text-sm font-black tracking-tight ${dk?'text-white':'text-slate-900'}`}>
              {t.appName}
            </span>
          </button>

          {/* Desktop navigation — hidden on mobile */}
          <nav className="hidden md:flex flex-1 items-center justify-center">
            <div className={`flex items-center gap-0.5 p-1 rounded-2xl border ${
              dk ? 'bg-white/5 border-white/8' : 'bg-slate-100 border-slate-200'
            }`}>
              {NAV.map(tab => (
                <button key={tab.id} onClick={() => go(tab.id as Tab)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                      : dk ? 'text-slate-400 hover:text-white hover:bg-white/8' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language switcher */}
            <div className={`hidden sm:flex items-center gap-0.5 p-0.5 rounded-xl border ${
              dk ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
            }`}>
              {(['uz','ru','en'] as const).map(lng => (
                <button key={lng} onClick={() => setCurrentLang(lng)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                    currentLang === lng
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                      : dk ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}>
                  {lng==='uz'?"O'z":lng}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
              className={`p-2 rounded-xl border cursor-pointer transition-all ${
                dk ? 'border-white/10 bg-white/5 text-yellow-400 hover:bg-white/10' : 'border-slate-200 bg-white text-amber-500 hover:bg-slate-50'
              }`}>
              {dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* PWA install (desktop) */}
            {installPrompt && (
              <button onClick={handleInstall}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20">
                <Download className="w-3 h-3" />
                {currentLang==='uz'?'Yuklab olish':currentLang==='ru'?'Установить':'Install'}
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button onClick={() => setMenuOpen(v => !v)}
              className={`md:hidden p-2 rounded-xl border cursor-pointer transition-all ${
                dk ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              aria-label="Menu">
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu overlay ──────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-[#0f0820]/97 backdrop-blur-2xl" />
          <div className="relative z-10 flex flex-col h-full px-6 pt-20 pb-24 gap-2" onClick={e => e.stopPropagation()}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${dk?'text-slate-600':'text-slate-400'}`}>
              {currentLang==='uz'?'Navigatsiya':currentLang==='ru'?'Навигация':'Navigation'}
            </p>
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => go(tab.id as Tab)}
                className={`w-full py-3.5 px-5 rounded-2xl text-left text-base font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-white/8 border border-white/5'
                }`}>
                {tab.label}
              </button>
            ))}
            {/* Language + theme in mobile menu */}
            <div className="mt-auto space-y-3">
              <div className="flex gap-2">
                {(['uz','ru','en'] as const).map(lng => (
                  <button key={lng} onClick={() => setCurrentLang(lng)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase transition-all cursor-pointer ${
                      currentLang === lng ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white' : 'border border-white/10 text-slate-400 hover:text-white'
                    }`}>
                    {lng==='uz'?"O'zbek":lng==='ru'?'Русский':'English'}
                  </button>
                ))}
              </div>
              <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
                className="w-full py-2.5 rounded-xl text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/8 flex items-center justify-center gap-2 cursor-pointer transition-all">
                {dk ? <><Sun className="w-4 h-4" /> {currentLang==='uz'?'Yorug\' mavzu':currentLang==='ru'?'Светлая тема':'Light theme'}</> : <><Moon className="w-4 h-4" /> {currentLang==='uz'?'Qorong\'i mavzu':currentLang==='ru'?'Тёмная тема':'Dark theme'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PWA install banner ── */}
      {showInstallBanner && (
        <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl max-w-sm w-[calc(100%-2rem)] animate-slide-up bg-[#0f0820] border-violet-500/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">
              {currentLang==='uz'?'Hujjat.uz ni yuklab oling':currentLang==='ru'?'Установить Hujjat.uz':'Install Hujjat.uz'}
            </p>
            <p className="text-[10px] text-slate-500">
              {currentLang==='uz'?'Ilova kabi ishlatish':currentLang==='ru'?'Как нативное приложение':'Use like a native app'}
            </p>
          </div>
          <button onClick={handleInstall} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
            {currentLang==='uz'?'Yuklab olish':currentLang==='ru'?'Установить':'Install'}
          </button>
          <button onClick={dismissInstall} className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-20 animate-slide-up">

            {/* ─── HERO ──────────────────────────────────────────────────── */}
            <section className="relative min-h-[82vh] flex flex-col items-center justify-center text-center px-2 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="absolute inset-0 hero-grid opacity-50" aria-hidden />

              <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-7 sm:gap-9">

                {/* Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border reveal ${
                  dk ? 'border-violet-500/25 bg-violet-500/10 text-violet-300' : 'border-violet-300 bg-violet-50 text-violet-700'
                }`}>
                  <Zap className="w-3.5 h-3.5 fill-current opacity-80" />
                  {t.heroSub}
                </div>

                {/* Headline */}
                <h1 className={`text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[1.02] reveal reveal-delay-1 ${
                  dk ? 'text-white' : 'text-slate-900'
                }`}>
                  {currentLang==='uz' ? (
                    <>Hujjatlaringiz<br /><span className="gradient-text">uchun yagona joy</span></>
                  ) : currentLang==='ru' ? (
                    <>Платформа №1<br /><span className="gradient-text">для документов</span></>
                  ) : (
                    <>Documents<br /><span className="gradient-text">made effortless</span></>
                  )}
                </h1>

                {/* Sub */}
                <p className={`text-base sm:text-lg max-w-2xl leading-relaxed reveal reveal-delay-2 ${dk?'text-slate-400':'text-slate-500'}`}>
                  {t.appPositioning}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-4 reveal reveal-delay-3">
                  <button onClick={() => go('docs')}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white cursor-pointer transition-all duration-300 active:scale-95 bg-gradient-to-r from-violet-600 to-blue-600 shadow-[0_0_28px_rgba(124,58,237,0.35)] hover:shadow-[0_0_42px_rgba(124,58,237,0.55)]">
                    {currentLang==='uz'?'Hozir Boshlash':currentLang==='ru'?'Начать сейчас':'Get Started'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => go('lang')}
                    className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm cursor-pointer transition-all duration-300 active:scale-95 border ${
                      dk ? 'border-white/15 text-slate-300 hover:border-violet-500/40 hover:text-white hover:bg-violet-500/8' : 'border-slate-300 text-slate-700 hover:border-violet-400 hover:bg-violet-50'
                    }`}>
                    <Globe2 className="w-4 h-4" />
                    {t.langCenter}
                  </button>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 pt-2 reveal reveal-delay-4">
                  {[
                    { n:'26+', l: currentLang==='uz'?'PDF Asbob':currentLang==='ru'?'PDF Инстр.':'PDF Tools' },
                    { n:'8',   l: currentLang==='uz'?'HW Shrift':currentLang==='ru'?'HW Шрифт':'HW Fonts' },
                    { n:'100%',l: currentLang==='uz'?'Xususiy':currentLang==='ru'?'Приватно':'Private' },
                    { n:'0',   l: currentLang==='uz'?"Ro'yxat":currentLang==='ru'?'Рег.':'Sign-up' },
                  ].map(s => (
                    <div key={s.l} className="text-center">
                      <div className="text-3xl sm:text-4xl font-black gradient-text">{s.n}</div>
                      <div className={`text-xs font-semibold mt-1 ${dk?'text-slate-500':'text-slate-400'}`}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Trust pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {TRUST_PILLS.map(p => (
                    <span key={p} className={`text-[11px] font-medium px-3 py-1.5 rounded-full border ${
                      dk ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
                    }`}>{p}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── TOOL CARDS ─────────────────────────────────────────────── */}
            <section className="reveal">
              <div className="flex items-center gap-4 mb-8">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono ${dk?'text-slate-600':'text-slate-400'}`}>
                  {t.chooseService}
                </p>
                <div className={`flex-1 h-px ${dk?'bg-white/8':'bg-slate-200'}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TOOLS.map((card, i) => (
                  <div key={card.id} onClick={() => go(card.id)}
                    className={`reveal reveal-delay-${i+1} group relative p-6 rounded-3xl border cursor-pointer transition-all duration-300 card-glow ${
                      dk
                        ? 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'
                        : 'bg-white border-slate-200 hover:shadow-xl hover:-translate-y-0.5'
                    } ${card.glow}`}>
                    {/* Gradient icon */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <card.Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className={`text-[9px] font-mono font-black uppercase tracking-widest mb-2 ${dk?'text-slate-500':'text-slate-400'}`}>{card.badge}</p>
                    <h3 className={`text-sm font-bold mb-2 transition-colors ${dk?'text-slate-100 group-hover:text-white':'text-slate-900'}`}>{card.title}</h3>
                    <p className={`text-xs leading-relaxed ${dk?'text-slate-500':'text-slate-500'}`}>{card.desc}</p>
                    <div className={`mt-5 pt-4 border-t flex items-center gap-1.5 text-xs font-bold transition-all duration-300 group-hover:gap-3 ${
                      dk?'border-white/8 text-slate-600 group-hover:text-violet-400':'border-slate-100 text-slate-400 group-hover:text-violet-600'
                    }`}>
                      {currentLang==='uz'?'Ochish':currentLang==='ru'?'Открыть':'Open'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── RECENT HISTORY ──────────────────────────────────────────── */}
            {history.length > 0 && (
              <section className="reveal">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Clock className={`w-4 h-4 ${dk?'text-violet-400':'text-violet-600'}`} />
                    <h2 className={`text-sm font-bold ${dk?'text-white':'text-slate-900'}`}>
                      {currentLang==='uz'?'Oxirgi Amallar':currentLang==='ru'?'Последние операции':'Recent Activity'}
                    </h2>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${dk?'bg-violet-500/10 text-violet-400':'bg-violet-50 text-violet-600'}`}>
                      {history.length}
                    </span>
                  </div>
                  <button onClick={clearHistory}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition ${dk?'text-slate-600 hover:text-rose-400':'text-slate-400 hover:text-rose-500'}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {currentLang==='uz'?'Tozalash':currentLang==='ru'?'Очистить':'Clear'}
                  </button>
                </div>
                <div className={`rounded-2xl border divide-y ${dk?'bg-white/5 border-white/8 divide-white/5':'bg-white border-slate-200 divide-slate-100'}`}>
                  {history.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${dk?'bg-violet-500/10':'bg-violet-50'}`}>
                          <FileDown className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${dk?'text-slate-200':'text-slate-800'}`}>{e.filename}</p>
                          <p className={`text-[10px] ${dk?'text-slate-600':'text-slate-400'}`}>{toolLabel[e.tool] || e.tool}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono whitespace-nowrap ${dk?'text-slate-600':'text-slate-400'}`}>
                        {new Date(e.ts).toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── FEATURE HIGHLIGHTS ─────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal">
              {[
                {
                  icon: <Zap className="w-5 h-5 text-violet-400" />,
                  grad: 'from-violet-500/10 to-transparent',
                  border: dk?'border-violet-500/15':'border-violet-100',
                  title: currentLang==='uz'?'Tez va aniq':currentLang==='ru'?'Быстро и точно':'Fast & Accurate',
                  desc: currentLang==='uz'
                    ? 'Gemini AI va mahalliy algoritmlar bilan yuqori aniqlik. Bir necha soniyada natija.'
                    : currentLang==='ru' ? 'Gemini AI и локальные алгоритмы. Результат за секунды.'
                    : 'Gemini AI and local algorithms. Results in seconds.',
                },
                {
                  icon: <Lock className="w-5 h-5 text-emerald-400" />,
                  grad: 'from-emerald-500/10 to-transparent',
                  border: dk?'border-emerald-500/15':'border-emerald-100',
                  title: currentLang==='uz'?'Maxfiylik kafolati':currentLang==='ru'?'Конфиденциальность':'Privacy First',
                  desc: currentLang==='uz'
                    ? "Fayllaringiz serverga yuklanmaydi. Hamma narsa faqat brauzeringizda."
                    : currentLang==='ru' ? 'Файлы не покидают браузер. Никакой загрузки на сервер.'
                    : 'Files never leave your browser. Zero server upload.',
                },
                {
                  icon: <Check className="w-5 h-5 text-cyan-400" />,
                  grad: 'from-cyan-500/10 to-transparent',
                  border: dk?'border-cyan-500/15':'border-cyan-100',
                  title: currentLang==='uz'?"Ro'yxatdan o'tish shart emas":currentLang==='ru'?'Без регистрации':'No Registration',
                  desc: currentLang==='uz'
                    ? 'Parol va email kerak emas. Bosing va ishlang.'
                    : currentLang==='ru' ? 'Никакого пароля или email. Просто откройте.'
                    : 'No password needed. Just open and work.',
                },
              ].map(f => (
                <div key={f.title} className={`p-5 rounded-2xl border bg-gradient-to-br ${f.grad} ${f.border} ${dk?'bg-white/3':''}`}>
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${dk?'bg-white/8':'bg-white border border-slate-100'}`}>
                    {f.icon}
                  </div>
                  <h3 className={`text-sm font-bold mb-2 ${dk?'text-white':'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-xs leading-relaxed ${dk?'text-slate-500':'text-slate-500'}`}>{f.desc}</p>
                </div>
              ))}
            </section>

            {/* ─── STATS ─────────────────────────────────────────────────── */}
            {(filesCount > 0 || charsCount > 0) && (
              <section className={`flex flex-wrap items-center justify-center gap-6 p-5 rounded-2xl border reveal ${dk?'bg-white/5 border-white/8':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-500" />
                  <span className={`text-sm ${dk?'text-slate-400':'text-slate-600'}`}>
                    {t.statsFiles}: <strong className={dk?'text-white':'text-slate-900'}>{filesCount}</strong>
                  </span>
                </div>
                <div className={`hidden sm:block w-px h-4 ${dk?'bg-white/10':'bg-slate-200'}`} />
                <span className={`text-sm ${dk?'text-slate-400':'text-slate-600'}`}>
                  {t.statsChars}: <strong className={dk?'text-white':'text-slate-900'}>~{charsCount.toLocaleString()}</strong>
                </span>
                <button onClick={() => { localStorage.removeItem('uz_files'); localStorage.removeItem('uz_chars'); setFilesCount(0); setCharsCount(0); }}
                  className="text-xs text-rose-500 hover:text-rose-400 cursor-pointer font-semibold ml-auto">
                  {t.statsReset}
                </button>
              </section>
            )}

            {/* ─── PRIVACY BANNER ─────────────────────────────────────────── */}
            <section className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border reveal ${
              dk ? 'bg-violet-950/30 border-violet-900/40 text-slate-300' : 'bg-violet-50 border-violet-100 text-violet-900'
            }`}>
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 shrink-0 ${dk?'text-violet-400':'text-violet-500'}`} />
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  <span className={`font-bold ${dk?'text-violet-400':'text-violet-600'}`}>{t.badgePrivate}:</span>{' '}
                  {t.privacyBanner}
                </p>
              </div>
              <button onClick={() => go('prices')}
                className={`text-xs font-bold shrink-0 flex items-center gap-1 whitespace-nowrap cursor-pointer hover:underline ${dk?'text-violet-400':'text-violet-600'}`}>
                {t.pricingDetails}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </section>
          </div>
        )}

        {/* ── OTHER TABS ──────────────────────────────────────────────────── */}
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
            onUpgradeSuccess={() => { setIsPremium(true); localStorage.setItem('hz_premium', 'true'); }}
            isPremium={isPremium}
          />
        )}
        {activeTab === 'opensource' && (
          <OpenSourceLabs currentLang={currentLang} theme={theme} sharedHandwriteText={sharedHandwriteText} clearSharedHandwriteText={() => setSharedHandwriteText('')} />
        )}
      </main>

      {/* ── Mobile bottom navigation ────────────────────────────────────────── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t pb-safe ${
        dk ? 'bg-[#0f0820]/95 backdrop-blur-xl border-white/8' : 'bg-white/95 backdrop-blur-xl border-slate-200'
      }`}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV.map(item => (
            <button key={item.id} onClick={() => go(item.id as Tab)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl cursor-pointer transition-all ${
                activeTab === item.id
                  ? 'text-violet-500'
                  : dk ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {activeTab === item.id
                ? <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.4)]"><item.Icon className="w-3.5 h-3.5 text-white" /></div>
                : <item.Icon className="w-5 h-5" />
              }
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer className={`relative z-10 border-t mt-8 py-10 ${dk?'border-white/8':'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className={`text-sm font-black ${dk?'text-white':'text-slate-900'}`}>{t.appName}</span>
            </div>
            <p className={`text-xs ${dk?'text-slate-600':'text-slate-400'}`}>
              {currentLang==='uz' ? "O'zbekiston uchun ❤️ bilan — fayllar serverga yuklanmaydi"
              : currentLang==='ru' ? "Сделано с ❤️ для Узбекистана — файлы не покидают браузер"
              : "Made with ❤️ for Uzbekistan — files never leave your browser"}
            </p>
          </div>

          <div className={`border-t ${dk?'border-white/5':'border-slate-100'}`} />

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => go(tab.id as Tab)}
                className={`text-xs font-medium cursor-pointer transition hover:text-violet-500 ${dk?'text-slate-600':'text-slate-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <p
            className={`text-center text-xs cursor-default select-none ${dk?'text-slate-700':'text-slate-400'}`}
            onDoubleClick={() => setDevPanel(v => !v)}>
            © {new Date().getFullYear()}{' '}
            <span className="gradient-text font-bold">{t.appName}</span>
            {' '}—{' '}{t.appSlogan}
          </p>

          {devPanel && (
            <div className={`mx-auto max-w-xs p-4 rounded-2xl border text-xs ${dk?'bg-white/5 border-white/10':'bg-slate-100 border-slate-300'}`}>
              <p className={`font-mono font-bold mb-2 ${dk?'text-slate-400':'text-slate-500'}`}>Dev: AI Provider Override</p>
              <AdminAIProvider />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UI_TRANSLATIONS, Language } from './utils/translations';
import LanguageCenter from './components/LanguageCenter';
import DocumentCenter from './components/DocumentCenter';
import AiCenter from './components/AiCenter';
import OcrCenter from './components/OcrCenter';
import PricingSection from './components/PricingSection';
import Logo from './components/Logo';
import OpenSourceLabs from './components/OpenSourceLabs';
import { FileText, Type, CheckCircle2, ChevronRight, Zap, RefreshCw, BarChart, Globe2, Sparkles, LayoutGrid, Sun, Moon, Shield, Award, Landmark, HelpCircle, ArrowRight, CornerRightDown, Bot } from 'lucide-react';

export default function App() {
  // Multilingual configuration
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const val = localStorage.getItem('dimu_pro_lang');
    return (val as Language) || 'uz';
  });

  // Theme configuration (Dark mode by default)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const val = localStorage.getItem('dimu_pro_theme');
    return (val as 'dark' | 'light') || 'dark';
  });

  // Monetization premium state
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('dimu_pro_premium') === 'true';
  });

  // Routing navigation tab
  const [activeTab, setActiveTab] = useState<'home' | 'lang' | 'docs' | 'ai' | 'ocr' | 'prices' | 'opensource'>('home');

  // Shared Yash Lamba Handwrite integration state
  const [sharedHandwriteText, setSharedHandwriteText] = useState<string>('');

  const sendToHandwriting = (text: string) => {
    setSharedHandwriteText(text);
    setActiveTab('opensource');
  };

  // Stats Counters from original system
  const [filesProcessedCount, setFilesProcessedCount] = useState<number>(() => {
    const val = localStorage.getItem('uz_translit_files_count');
    return val ? parseInt(val, 10) : 0;
  });
  const [approxCharacters, setApproxCharacters] = useState<number>(() => {
    const val = localStorage.getItem('uz_translit_chars_count');
    return val ? parseInt(val, 10) : 0;
  });

  // Sync parameters with local state persistence
  useEffect(() => {
    localStorage.setItem('dimu_pro_lang', currentLang);
  }, [currentLang]);

  useEffect(() => {
    localStorage.setItem('dimu_pro_theme', theme);
  }, [theme]);

  const handleFileProcessed = (chars: number) => {
    setFilesProcessedCount(prev => {
      const newVal = prev + 1;
      localStorage.setItem('uz_translit_files_count', newVal.toString());
      return newVal;
    });
    setApproxCharacters(prev => {
      const newVal = prev + chars;
      localStorage.setItem('uz_translit_chars_count', newVal.toString());
      return newVal;
    });
  };

  const handleResetStats = () => {
    localStorage.removeItem('uz_translit_files_count');
    localStorage.removeItem('uz_translit_chars_count');
    setFilesProcessedCount(0);
    setApproxCharacters(0);
  };

  const handleUpgradeToPremium = () => {
    setIsPremium(true);
    localStorage.setItem('dimu_pro_premium', 'true');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const t = UI_TRANSLATIONS[currentLang];

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden ${
      theme === 'dark' 
        ? 'theme-dark bg-[#070c1e] text-slate-100 bg-mesh-grid-dark' 
        : 'theme-light bg-slate-50 text-slate-800 bg-mesh-grid-light'
    }`}>
      
      {/* Background Decorative Ambient Glows */}
      {theme === 'dark' ? (
        <>
          <div className="absolute top-[-10%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />
          <div className="absolute top-[25%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[2%] w-[300px] h-[300px] rounded-full bg-pink-600/5 blur-[80px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-5%] left-[5%] w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
        </>
      )}

      {/* Brand Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
        theme === 'dark' 
          ? 'border-slate-800 bg-slate-950/70 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
          : 'border-slate-200/80 bg-white/80 shadow-[0_4px_30px_rgba(15,23,42,0.03)]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand with Premium badge */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Logo size={44} />
              <div>
                <h1 className={`text-xl font-black tracking-tight flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>{t.appName}</span>
                  {isPremium ? (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 font-extrabold uppercase px-2 py-0.5 rounded border border-indigo-500/30">
                      Premium
                    </span>
                  ) : (
                    <span className="text-[10px] bg-red-500/10 text-red-500 font-extrabold uppercase px-2 py-0.5 rounded border border-red-500/20">
                      Pro
                    </span>
                  )}
                </h1>
                <p className={`text-[10px] font-semibold tracking-wide ${theme === 'dark' ? 'text-indigo-300/80' : 'text-indigo-600'}`}>
                  {t.appSlogan}
                </p>
              </div>
            </div>

            {/* Compact Tool Row (Only for mobile inside Logo flex) */}
            <div className="flex sm:hidden items-center gap-2">
              <div className={`flex p-0.5 rounded-xl border items-center ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/80 border-slate-200'
              }`}>
                {(['uz', 'ru', 'en'] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setCurrentLang(lng)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition ${
                      currentLang === lng ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    {lng === 'uz' ? "O'z" : lng === 'ru' ? 'Ru' : 'En'}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 text-yellow-400 hover:bg-slate-800' 
                    : 'bg-white border-slate-200 text-amber-500 hover:bg-slate-100 shadow-sm'
                }`}
                title={theme === 'dark' ? 'Yorug\' rejimga o\'tish' : 'Qorong\'i rejimga o\'tish'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nav Controls (Stays robust on desktop, and wraps nicely or handles tools) */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            {/* Nav Tabs list with horizontal scroll on small devices */}
            <nav className={`flex items-center gap-1 p-1 rounded-xl border transition shadow-inner w-full sm:w-auto overflow-x-auto scrollbar-none whitespace-nowrap ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-800' 
                : 'bg-slate-100/80 border-slate-200'
            }`}>
              {[
                { id: 'home', label: t.homeTab },
                { id: 'lang', label: t.langCenter },
                { id: 'docs', label: t.docCenter },
                { id: 'ai', label: t.aiCenter },
                { id: 'ocr', label: 'OCR' },
                { id: 'opensource', label: currentLang === 'uz' ? 'OS Labs' : currentLang === 'ru' ? 'OS Лаборатория' : 'OS Labs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shrink-0 ${
                    activeTab === tab.id 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-indigo-700 shadow-md'
                      : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Desktop-only Switchers to bypass dual row button mess */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Language select Toggle */}
              <div className={`flex p-1 rounded-xl border items-center ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/80 border-slate-200'
              }`}>
                {(['uz', 'ru', 'en'] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setCurrentLang(lng)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition ${
                      currentLang === lng ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    {lng === 'uz' ? "O'z" : lng === 'ru' ? 'Ru' : 'En'}
                  </button>
                ))}
              </div>

              {/* Light/Dark Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 text-yellow-400 hover:bg-slate-800' 
                    : 'bg-white border-slate-200 text-amber-500 hover:bg-slate-100 shadow-sm'
                }`}
                title={theme === 'dark' ? 'Yorug\' rejimga o\'tish' : 'Qorong\'i rejimga o\'tish'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 relative z-10">

        {/* Dynamic routing renderer */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-slide-up">
            {/* Hero Brand Section */}
            <div className="text-center space-y-5 max-w-3xl mx-auto py-6">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono tracking-wide ${
                theme === 'dark' 
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20 animate-pulse" />
                {t.heroSub}
              </span>
              
              <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-[1.15] ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {t.heroTitle.split('Bilan').length > 1 ? (
                  <>
                    {t.heroTitle.split('Bilan')[0]} Bilan <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-indigo-600 to-emerald-600">{t.heroTitle.split('Bilan')[1]}</span>
                  </>
                ) : t.heroTitle}
              </h2>

              <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'
              }`}>
                {t.appPositioning}
              </p>

              {/* Trust badges row */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-xs font-bold font-mono">
                <span className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl shadow-sm ${
                  theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  ✓ {t.badgeFree}
                </span>
                <span className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl shadow-sm ${
                  theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  ✓ {t.badgePrivate}
                </span>
                <span className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl shadow-sm ${
                  theme === 'dark' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  ✓ {t.badgeNoReg}
                </span>
              </div>
            </div>

            {/* Main 4 Centers Navigation tiles - EXTREMELY BEAUTIFUL iLovePDF STYLE BENTO GRID */}
            <div>
              <div className="text-center mb-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-mono">{t.chooseService}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Tile 1: TIL MARKAZI */}
                <div 
                  onClick={() => setActiveTab('lang')}
                  className={`p-6.5 rounded-3xl border transition-all duration-350 cursor-pointer shadow-sm relative group overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-indigo-950/30' 
                      : 'bg-white border-slate-200/80 hover:border-indigo-500 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/15">
                      <Type className="w-6 h-6 group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      theme === 'dark' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {t.langCenter}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-bold font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {t.langCenter}
                    </h3>
                    <p className={`text-[11px] font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                      {t.bentoLangSub}
                    </p>
                  </div>
                  
                  <p className={`text-xs mt-4 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}>
                    {t.bentoLangDesc}
                  </p>
                  
                  <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    theme === 'dark' ? 'border-slate-800/80 text-indigo-400' : 'border-slate-100 text-indigo-600'
                  }`}>
                    <span className="group-hover:translate-x-1 transition duration-200">{t.bentoLangAction}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition duration-300" />
                  </div>
                </div>

                {/* Tile 2: HUJJAT MARKAZI */}
                <div 
                  onClick={() => setActiveTab('docs')}
                  className={`p-6.5 rounded-3xl border transition-all duration-350 cursor-pointer shadow-sm relative group overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-emerald-950/30' 
                      : 'bg-white border-slate-200/80 hover:border-emerald-500 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/15">
                      <FileText className="w-6 h-6 group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {t.docCenter}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-bold font-display group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {t.docCenter}
                    </h3>
                    <p className={`text-[11px] font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                      {t.bentoDocSub}
                    </p>
                  </div>
                  
                  <p className={`text-xs mt-4 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}>
                    {t.bentoDocDesc}
                  </p>
                  
                  <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    theme === 'dark' ? 'border-slate-800/80 text-emerald-400' : 'border-slate-100 text-emerald-600'
                  }`}>
                    <span className="group-hover:translate-x-1 transition duration-200">{t.bentoDocAction}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition duration-300" />
                  </div>
                </div>

                {/* Tile 3: AI SUPER MARKAZ */}
                <div 
                  onClick={() => setActiveTab('ai')}
                  className={`p-6.5 rounded-3xl border transition-all duration-350 cursor-pointer shadow-sm relative group overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-purple-950/30' 
                      : 'bg-white border-slate-200/80 hover:border-purple-500 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-500/15">
                      <Sparkles className="w-6 h-6 group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      theme === 'dark' ? 'bg-purple-950/40 text-purple-450 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {t.aiCenter}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-bold font-display group-hover:text-purple-600 dark:group-hover:text-purple-300 transition duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {t.aiCenter}
                    </h3>
                    <p className={`text-[11px] font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                      {t.bentoAiSub}
                    </p>
                  </div>
                  
                  <p className={`text-xs mt-4 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}>
                    {t.bentoAiDesc}
                  </p>
                  
                  <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    theme === 'dark' ? 'border-slate-800/80 text-purple-400' : 'border-slate-100 text-purple-600'
                  }`}>
                    <span className="group-hover:translate-x-1 transition duration-200">{t.bentoAiAction}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition duration-300" />
                  </div>
                </div>

                {/* Tile 4: OCR SCANNER */}
                <div 
                  onClick={() => setActiveTab('ocr')}
                  className={`p-6.5 rounded-3xl border transition-all duration-350 cursor-pointer shadow-sm relative group overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 hover:shadow-sky-950/30' 
                      : 'bg-white border-slate-200/80 hover:border-sky-500 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-500/15">
                      <Bot className="w-6 h-6 group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      theme === 'dark' ? 'bg-sky-950/40 text-sky-450 border-sky-500/20' : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}>
                      {t.ocrCenter}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-bold font-display group-hover:text-sky-600 dark:group-hover:text-sky-300 transition duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {t.ocrCenter}
                    </h3>
                    <p className={`text-[11px] font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                      {t.bentoOcrSub}
                    </p>
                  </div>
                  
                  <p className={`text-xs mt-4 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}>
                    {t.bentoOcrDesc}
                  </p>
                  
                  <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    theme === 'dark' ? 'border-slate-800/80 text-sky-400' : 'border-slate-100 text-sky-600'
                  }`}>
                    <span className="group-hover:translate-x-1 transition duration-200">{t.bentoOcrAction}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition duration-300" />
                  </div>
                </div>

                {/* Tile 5: OPEN SOURCE LABS */}
                <div 
                  onClick={() => setActiveTab('opensource')}
                  className={`p-6.5 rounded-3xl border transition-all duration-350 cursor-pointer shadow-sm relative group overflow-hidden md:col-span-2 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-indigo-950/25 via-slate-900/60 to-purple-950/25 border-indigo-500/30 hover:border-indigo-500 hover:shadow-indigo-950/40 animate-pulseBorder' 
                      : 'bg-gradient-to-r from-indigo-50 via-white to-purple-50 border-indigo-200 hover:border-indigo-500 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)]'
                  }`}
                  style={{ animation: 'pulseBorder 6s infinite' }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/15 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/15">
                      <Sparkles className="w-6 h-6 group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      theme === 'dark' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      OPENSOURCE EXPERIMENTAL LABS
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`text-xl font-bold font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {currentLang === 'uz' ? "OpenSource Laboratoriyasi (3-in-1)" : currentLang === 'ru' ? "OS Лаборатория" : "OpenSource Labs"}
                    </h3>
                    <p className={`text-xs font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550 font-semibold'}`}>
                      {currentLang === 'uz' ? "microsoft/markitdown + yashlamba/handwrite + Offline Local AI" : "Мощные инструменты преобразования документов в Markdown и рукописный текст"}
                    </p>
                  </div>
                  
                  <p className={`text-xs mt-4 leading-relaxed max-w-3xl ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-650 font-medium'
                  }`}>
                    {currentLang === 'uz' 
                      ? "Istalgan faylni markdown formatiga o'tkazish, kiritilgan matnlarni chiroyli haqiqiy maktab daftari chiziqlarida sozlangan insoniy qo'lyozmaga aylantirish (PDF/PNG eksporti bilan) hamda to'liq internettsiz (off-grid) xavfsiz mantiqiy AI agent bilan ishlash."
                      : "Конвертируйте файлы в markdown, генерируйте красивый рукописный почерк с симуляцией тетрадей и пишите запросы автономному ИИ, работающему полностью в браузере."}
                  </p>
                  
                  <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                    theme === 'dark' ? 'border-slate-800/80 text-indigo-400' : 'border-slate-100 text-indigo-600'
                  }`}>
                    <span className="group-hover:translate-x-1 transition duration-200">
                      {currentLang === 'uz' ? "Laboratoriyani ishga tushirish" : "Открыть лабораторию"}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition duration-300" />
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Metrics of original App */}
            {(filesProcessedCount > 0 || approxCharacters > 0) && (
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-500 pt-7 flex-wrap">
                <span className={`flex items-center gap-2 border p-3.5 rounded-2xl shadow-sm ${
                  theme === 'dark' ? 'bg-[#090e24]/45 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <BarChart className="w-4 h-4 text-indigo-500 animate-bounce" />
                  {t.statsFiles}: <strong className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}>{filesProcessedCount} {t.statsFilesSuffix}</strong>
                </span>
                <span className={`flex items-center gap-2 border p-3.5 rounded-2xl shadow-sm ${
                  theme === 'dark' ? 'bg-[#090e24]/45 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {t.statsChars}: <strong className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}>~{approxCharacters.toLocaleString()}</strong>
                </span>
                <button
                  onClick={handleResetStats}
                  className="text-[10px] text-rose-500 bg-rose-500/5 px-4 py-3.5 rounded-2xl border border-rose-500/10 hover:bg-rose-500/10 duration-200 cursor-pointer font-bold animate-pulse"
                >
                  {t.statsReset}
                </button>
              </div>
            )}
          </div>
        )}

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

        {activeTab === 'ocr' && (
          <OcrCenter 
            currentLang={currentLang} 
            theme={theme} 
            onSendToHandwriting={sendToHandwriting}
          />
        )}

        {activeTab === 'prices' && (
          <PricingSection 
            currentLang={currentLang} 
            theme={theme}
            onUpgradeSuccess={handleUpgradeToPremium} 
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

        {/* Global Privacy Safety banner placed elegantly at the bottom */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-350 shadow-sm mt-8 ${
          theme === 'dark' 
            ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200/90' 
            : 'bg-indigo-50/70 border-indigo-100/80 text-indigo-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-500/10'}`}>
              <Shield className="w-5 h-5 text-indigo-500 animate-pulse flex-shrink-0" />
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed font-sans">
              <span className="text-indigo-600 dark:text-indigo-400">{t.badgePrivate}:</span> {t.privacyBanner}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`text-xs font-black uppercase tracking-wider shrink-0 duration-200 hover:underline flex items-center gap-1 ${
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'
            }`}
          >
            {t.pricingDetails} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* Clean Human-focused footer with translated links and descriptions */}
      <footer className={`border-t transition-colors duration-300 mt-12 py-8 text-center text-xs backdrop-blur ${
        theme === 'dark' ? 'border-slate-800 bg-slate-950/45 text-slate-500' : 'border-slate-200/80 bg-white text-slate-600'
      }`}>
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-bold text-slate-500 dark:text-slate-400">
            <button onClick={() => setActiveTab('home')} className="hover:text-indigo-500 transition cursor-pointer">{t.homeTab}</button>
            <button onClick={() => setActiveTab('lang')} className="hover:text-indigo-500 transition cursor-pointer">{t.langCenter}</button>
            <button onClick={() => setActiveTab('docs')} className="hover:text-indigo-500 transition cursor-pointer">{t.docCenter}</button>
            <button onClick={() => setActiveTab('ai')} className="hover:text-indigo-500 transition cursor-pointer">{t.aiCenter}</button>
            <button onClick={() => setActiveTab('ocr')} className="hover:text-indigo-500 transition cursor-pointer">{t.ocrCenter}</button>
            <button onClick={() => setActiveTab('opensource')} className="hover:text-indigo-500 transition cursor-pointer">{currentLang === 'uz' ? 'OS Labs' : currentLang === 'ru' ? 'OS Лаборатория' : 'OS Labs'}</button>
            <button onClick={() => setActiveTab('prices')} className="hover:text-indigo-500 transition cursor-pointer">{t.pricing}</button>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-400">© {new Date().getFullYear()} {t.appName} — {t.appSlogan}. {t.footerCopyrightText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

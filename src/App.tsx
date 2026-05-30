/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import FileConverter from './components/FileConverter';
import TextConverter from './components/TextConverter';
import { FileText, Type, CheckCircle2, ChevronRight, Zap, RefreshCw, BarChart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('files');
  const [filesProcessedCount, setFilesProcessedCount] = useState<number>(() => {
    const val = localStorage.getItem('uz_translit_files_count');
    return val ? parseInt(val, 10) : 0;
  });
  const [approxCharacters, setApproxCharacters] = useState<number>(() => {
    const val = localStorage.getItem('uz_translit_chars_count');
    return val ? parseInt(val, 10) : 0;
  });

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

  return (
    <div className="min-h-screen bg-[#040815] bg-mesh-grid text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />
      <div className="absolute top-[25%] right-[5%] w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[2%] w-[300px] h-[300px] rounded-full bg-pink-600/5 blur-[80px] pointer-events-none" />

      {/* Universal Header Area */}
      <header className="border-b border-indigo-500/10 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-[#090e24] border border-white/10 flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-pink-400 font-black text-xl shadow-2xl uppercase tracking-wider font-display font-sans">
                DM
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-200 flex items-center gap-2">
                Dimu konverteri
              </h1>
              <p className="text-xs text-indigo-300 font-medium tracking-wide">
                Hujjatlar (Word, Excel, PDF) va Matnlarni formatini buzmasdan o'giruvchi universal tizim
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono bg-indigo-950/50 text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/20 flex items-center gap-2 shadow-lg backdrop-blur">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse fill-indigo-400/20" />
              100% Online va Xavfsiz
            </span>
          </div>
        </div>
      </header>

      {/* Main Core Content Panel */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 relative z-10">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto self-start glow-indigo/5 shadow-2xl">
            <button
              id="tab-files-btn"
              onClick={() => setActiveTab('files')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/20 scale-102 border border-indigo-400/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              Hujjatlar (Word / Excel / PDF)
            </button>
            <button
              id="tab-text-btn"
              onClick={() => setActiveTab('text')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-600/20 scale-102 border border-purple-400/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Type className="w-4 h-4 text-purple-300" />
              Matnlarni O'girish (Ctrl+V)
            </button>
          </div>

          {/* Quick Metrics */}
          {(filesProcessedCount > 0 || approxCharacters > 0) && (
            <div className="flex items-center gap-3 text-xs text-indigo-300/80 font-mono self-end md:self-auto">
              <span className="flex items-center gap-2 bg-[#080d24]/80 border border-indigo-500/10 px-3.5 py-2 rounded-xl shadow-inner shadow-black/40">
                <BarChart className="w-3.5 h-3.5 text-indigo-400" />
                Fayllar: <strong className="text-white bg-indigo-500/20 px-1.5 py-0.5 rounded ml-1 border border-indigo-500/20">{filesProcessedCount} ta</strong>
              </span>
              <span className="flex items-center gap-2 bg-[#080d24]/80 border border-indigo-500/10 px-3.5 py-2 rounded-xl shadow-inner shadow-black/40">
                Belgilar: <strong className="text-white bg-indigo-500/20 px-1.5 py-0.5 rounded ml-1 border border-indigo-500/20">~{approxCharacters.toLocaleString()}</strong>
              </span>
              <button
                id="reset-stats-btn"
                onClick={handleResetStats}
                className="text-[10px] text-slate-500 hover:text-rose-400 hover:underline cursor-pointer py-2 px-1 transition duration-200"
                title="Statistikani tozalash"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Panel Renderer */}
        <div className="min-h-[400px]">
          {activeTab === 'files' && (
            <FileConverter onFileProcessed={handleFileProcessed} />
          )}
          {activeTab === 'text' && (
            <TextConverter />
          )}
        </div>
      </main>

      {/* Clean human-focused footer credit */}
      <footer className="border-t border-white/5 bg-slate-950/20 mt-12 py-8 text-center text-xs text-slate-500 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Dimu konverteri. Milliy va xalqaro transliteratsiya standartlari bo'yicha maxsus sayqallangan platforma.</p>
          <p className="text-[10px] text-slate-600 font-mono">Version 2.5 — Professional Edition (Oflayn Xavfsiz rejim)</p>
        </div>
      </footer>
    </div>
  );
}

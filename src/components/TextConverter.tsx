/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { cyrillicToLatin, latinToCyrillic, detectLanguage } from '../utils/translit';
import { Copy, Trash2, ArrowLeftRight, Check } from 'lucide-react';

interface TextConverterProps {
  theme?: 'light' | 'dark';
}

export default function TextConverter({ theme = 'dark' }: TextConverterProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<'toLatin' | 'toCyrillic'>('toLatin');
  const [autoDetect, setAutoDetect] = useState(true);
  const [copied, setCopied] = useState(false);
  const [detectedLang, setDetectedLang] = useState<'cyrillic' | 'latin' | null>(null);
  
  // Real-time translation loop
  useEffect(() => {
    if (!inputText.trim()) {
      setOutputText('');
      setDetectedLang(null);
      return;
    }

    let activeDirection = direction;

    if (autoDetect) {
      const detected = detectLanguage(inputText);
      setDetectedLang(detected);
      if (detected === 'cyrillic' && direction !== 'toLatin') {
         activeDirection = 'toLatin';
         setDirection('toLatin');
      } else if (detected === 'latin' && direction !== 'toCyrillic') {
         activeDirection = 'toCyrillic';
         setDirection('toCyrillic');
      }
    }

    if (activeDirection === 'toLatin') {
      setOutputText(cyrillicToLatin(inputText));
    } else {
      setOutputText(latinToCyrillic(inputText));
    }
  }, [inputText, direction, autoDetect]);

  const handleSwapDirection = () => {
    setAutoDetect(false); 
    setDirection(prev => prev === 'toLatin' ? 'toCyrillic' : 'toLatin');
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Nusxalashda xatolik:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div id="text-converter-panel" className={`border rounded-3xl shadow-xl overflow-hidden animate-slide-up transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-950/50 border-slate-800 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.6)]' 
        : 'bg-white border-slate-200 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.04)]'
    }`}>
      {/* Control Header */}
      <div className={`flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b gap-4 ${
        theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/60'
      }`}>
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800 shadow-inner' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            id="toggle-direction-btn"
            onClick={() => {
              setAutoDetect(false);
              setDirection('toLatin');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              !autoDetect && direction === 'toLatin'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kirill → Lotin
          </button>
          
          <button
            id="swap-dir-btn"
            onClick={handleSwapDirection}
            title="Yo'nalishni almashtirish"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800' : 'text-indigo-600 hover:text-indigo-800 hover:bg-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
 
          <button
            id="toggle-direction-to-cyr-btn"
            onClick={() => {
              setAutoDetect(false);
              setDirection('toCyrillic');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              !autoDetect && direction === 'toCyrillic'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lotin → Kirill
          </button>
        </div>
 
        {/* Auto Detect Toggle */}
        <div className="flex items-center gap-3">
          <label className={`text-xs font-bold uppercase tracking-widest select-none font-mono ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            AVTO-ANIQLASH:
          </label>
          <button
            id="auto-detect-toggle"
            onClick={() => setAutoDetect(!autoDetect)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              autoDetect ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow ${
                autoDetect ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          {autoDetect && detectedLang && (
            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              {detectedLang === 'cyrillic' ? 'Matn: Kirill' : 'Matn: Lotin'}
            </span>
          )}
        </div>
      </div>
  
      {/* Textareas Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x ${
        theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'
      }`}>
        {/* Input Pane */}
        <div className="flex flex-col p-6 min-h-[350px] relative">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-widest font-mono ${
              theme === 'dark' ? 'text-indigo-300/80' : 'text-indigo-600'
            }`}>
              {direction === 'toLatin' ? 'KIRILL ALIFBOSIDA' : 'LOTIN ALIFBOSIDA'}
            </span>
            {inputText && (
              <button
                id="clear-text-btn"
                onClick={handleClear}
                className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                title="Matnni tozalash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Matnni tozalash
              </button>
            )}
          </div>
          <textarea
            id="input-text-area"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              direction === 'toLatin'
                ? "Bu yerga kirillcha matnni kiriting yoki joylang (Ctrl+V)..."
                : "Bu yerga lotincha matnni kiriting yoki joylang (Ctrl+V)..."
            }
            className={`flex-1 w-full bg-transparent resize-none border-none focus:outline-none text-base leading-relaxed min-h-[250px] focus:ring-0 ${
              theme === 'dark' ? 'text-slate-200 placeholder-slate-700' : 'text-slate-800 font-medium placeholder-slate-400'
            }`}
          />
          
          <div className={`flex items-center gap-4 pt-4 border-t text-xs font-mono text-slate-500 mt-2 ${
            theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'
          }`}>
            <span>Belgilar: <strong className="text-indigo-500">{charCount}</strong></span>
            <span>So'zlar: <strong className="text-indigo-500">{wordCount}</strong></span>
          </div>
        </div>
 
        {/* Output Pane */}
        <div className={`flex flex-col p-6 min-h-[350px] ${
          theme === 'dark' ? 'bg-slate-950/20' : 'bg-slate-50/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-widest font-mono ${
              theme === 'dark' ? 'text-purple-300/80' : 'text-purple-600'
            }`}>
              {direction === 'toLatin' ? 'LOTIN ALIFBOSIDA (NATIJA)' : 'KIRILL ALIFBOSIDA (NATIJA)'}
            </span>
            <div className="flex items-center gap-2">
              {outputText && (
                <button
                  id="copy-text-btn"
                  onClick={handleCopy}
                  className={`p-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    copied
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 dark:text-indigo-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-bounce" />
                      Nusxalandi!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Nusxa olish
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div
            id="output-text-display"
            className={`flex-1 overflow-y-auto text-base leading-relaxed whitespace-pre-wrap select-text min-h-[250px] focus:outline-none ${
              outputText 
                ? theme === 'dark' ? 'text-slate-100' : 'text-slate-900 font-medium' 
                : 'text-slate-500 italic select-none'
            }`}
          >
            {outputText || "O'girilgan tarjima bu yerda real vaqtda hosil bo'ladi..."}
          </div>
        </div>
      </div>
      
      {/* Rule Help Tip */}
      <div className={`border-t px-6 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono ${
        theme === 'dark' ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-100/60 border-slate-200 text-slate-550'
      }`}>
        <span className={`font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Qoidalar:</span>
        <span>Ў/ў ⇄ O'/o'</span>
        <span>Ғ/ғ ⇄ G'/g'</span>
        <span>Ш/ш ⇄ Sh/sh</span>
        <span>Ч/ч ⇄ Ch/ch</span>
        <span>Ю/ю ⇄ Yu/yu</span>
        <span>Я/я ⇄ Ya/ya</span>
        <span>ъ ⇄ '</span>
      </div>
    </div>
  );
}

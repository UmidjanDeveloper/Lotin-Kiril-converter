/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { cyrillicToLatin, latinToCyrillic, detectLanguage } from '../utils/translit';
import { Copy, Trash2, ArrowLeftRight, Check, Volume2 } from 'lucide-react';

export default function TextConverter() {
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
    setAutoDetect(false); // disable auto-detect on manual swap to respect user selection
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

  const handleSpeak = () => {
    if (!outputText) return;
    const utterance = new SpeechSynthesisUtterance(outputText);
    utterance.lang = direction === 'toLatin' ? 'tr-TR' : 'ru-RU'; // fallback voices approximation for listening
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div id="text-converter-panel" className="bg-slate-950/50 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden animate-slide-up glow-indigo/5">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/40 gap-4">
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5 shadow-inner">
          <button
            id="toggle-direction-btn"
            onClick={() => {
              setAutoDetect(false);
              setDirection('toLatin');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              !autoDetect && direction === 'toLatin'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Kirill → Lotin
          </button>
          
          <button
            id="swap-dir-btn"
            onClick={handleSwapDirection}
            title="Yo'nalishni almashtirish"
            className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-colors cursor-pointer"
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
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Lotin → Kirill
          </button>
        </div>
 
        {/* Auto Detect Toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest select-none font-mono">
            AVTO-ANIQLASH:
          </label>
          <button
            id="auto-detect-toggle"
            onClick={() => setAutoDetect(!autoDetect)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              autoDetect ? 'bg-emerald-500' : 'bg-slate-700'
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
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Input Pane */}
        <div className="flex flex-col p-6 min-h-[350px] relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-300/80 uppercase tracking-widest font-mono">
              {direction === 'toLatin' ? 'KIRILL ALIFBOSIDA' : 'LOTIN ALIFBOSIDA'}
            </span>
            {inputText && (
              <button
                id="clear-text-btn"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className="flex-1 w-full bg-transparent resize-none border-none focus:outline-none text-slate-200 text-base leading-relaxed placeholder-slate-600 min-h-[250px] focus:ring-0"
          />
          
          <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-xs font-mono text-slate-500 mt-2">
            <span>Belgilar: <strong className="text-indigo-400">{charCount}</strong></span>
            <span>So'zlar: <strong className="text-indigo-400">{wordCount}</strong></span>
          </div>
        </div>
 
        {/* Output Pane */}
        <div className="flex flex-col p-6 min-h-[350px] bg-slate-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-300/80 uppercase tracking-widest font-mono">
              {direction === 'toLatin' ? 'LOTIN ALIFBOSIDA (NATIJA)' : 'KIRILL ALIFBOSIDA (NATIJA)'}
            </span>
            <div className="flex items-center gap-2">
              {outputText && (
                <>
                  <button
                    id="speak-text-btn"
                    onClick={handleSpeak}
                    className="p-1 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 bg-[#0e1635]/40 border border-white/5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                    title="Matnni ovozli o'qish"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    Tinglash
                  </button>
                  <button
                    id="copy-text-btn"
                    onClick={handleCopy}
                    className={`p-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      copied
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/20'
                        : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Nusxalandi!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Nusxa olish
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div
            id="output-text-display"
            className={`flex-1 overflow-y-auto text-base leading-relaxed whitespace-pre-wrap select-text min-h-[250px] focus:outline-none ${
              outputText ? 'text-slate-100' : 'text-slate-600 italic select-none'
            }`}
          >
            {outputText || "O'girilgan tarjima bu yerda real vaqtda hosil bo'ladi..."}
          </div>
        </div>
      </div>
      
      {/* Rule Help Tip */}
      <div className="bg-slate-950/40 border-t border-white/5 px-6 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
        <span className="font-bold text-white uppercase tracking-wider">Qoidalar:</span>
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

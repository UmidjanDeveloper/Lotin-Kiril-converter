/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { cyrillicToLatin, latinToCyrillic, detectLanguage } from '../utils/translit';
import { Copy, Trash2, ArrowLeftRight, Check, Volume2, VolumeX } from 'lucide-react';
import { UI_TRANSLATIONS, Language } from '../utils/translations';

interface TextConverterProps {
  currentLang?: Language;
  theme?: 'light' | 'dark';
}

export default function TextConverter({ currentLang = 'uz', theme = 'dark' }: TextConverterProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.uz;

  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState<'toLatin' | 'toCyrillic'>('toLatin');
  const [autoDetect, setAutoDetect] = useState(true);
  const [copied, setCopied] = useState(false);

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

  // Derive detected language on the fly without state updates
  const detectedLang = useMemo(() => {
    if (!inputText.trim()) return null;
    return detectLanguage(inputText);
  }, [inputText]);

  // Derive the active translation direction
  const activeDirection = useMemo(() => {
    if (autoDetect && detectedLang) {
      return detectedLang === 'cyrillic' ? 'toLatin' : 'toCyrillic';
    }
    return direction;
  }, [autoDetect, detectedLang, direction]);

  // Derive the transliterated output text
  const outputText = useMemo(() => {
    if (!inputText.trim()) return '';
    return activeDirection === 'toLatin'
      ? cyrillicToLatin(inputText)
      : latinToCyrillic(inputText);
  }, [inputText, activeDirection]);

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

    // Convert to Cyrillic
    const isCyr = detectLanguage(text) === 'cyrillic';
    const cyrText = isCyr ? text : latinToCyrillic(text);

    const utterance = new SpeechSynthesisUtterance(cyrText);
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

  const handleSwapDirection = () => {
    setAutoDetect(false); 
    const nextDir = activeDirection === 'toLatin' ? 'toCyrillic' : 'toLatin';
    setDirection(nextDir);
    const oldOutput = outputText;
    setInputText(oldOutput);
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
              !autoDetect && activeDirection === 'toLatin'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.directionCyrToLat}
          </button>
          
          <button
            id="swap-dir-btn"
            onClick={handleSwapDirection}
            title={t.swapDirTooltip || "Yo'nalishni almashtirish"}
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
              !autoDetect && activeDirection === 'toCyrillic'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.directionLatToCyr}
          </button>
        </div>
        
        {/* Auto Detect Toggle */}
        <div className="flex items-center gap-3">
          <label className={`text-xs font-bold uppercase tracking-widest select-none font-mono ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {t.autoDetect.toUpperCase()}:
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
              {detectedLang === 'cyrillic' ? (t.langCyrillicBadge || 'Matn: Kirill') : (t.langLatinBadge || 'Matn: Lotin')}
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
              {activeDirection === 'toLatin' ? (t.latinInputHeader || 'KIRILL ALIFBOSIDA') : (t.cyrillicInputHeader || 'LOTIN ALIFBOSIDA')}
            </span>
            <div className="flex items-center gap-3">
              {inputText && (
                <button
                  onClick={() => speakText(inputText, true)}
                  className={`text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-semibold ${
                    isPlayingInput ? 'text-rose-500 hover:text-rose-400' : 'text-indigo-500 hover:text-indigo-400'
                  }`}
                  title={isPlayingInput ? (t.stopTts || "To'xtatish") : (t.listenTts || "Tinglash")}
                >
                  {isPlayingInput ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                      {t.stopTts || "To'xtatish"}
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      {t.listenTts || "Tinglash"}
                    </>
                  )}
                </button>
              )}
              {inputText && (
                <button
                  id="clear-text-btn"
                  onClick={handleClear}
                  className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                  title={t.clear || "Matnni tozalash"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.clear || "Matnni tozalash"}
                </button>
              )}
            </div>
          </div>
          <textarea
            id="input-text-area"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeDirection === 'toLatin'
                ? t.inputPlaceholderCyr
                : t.inputPlaceholderLat
            }
            className={`flex-1 w-full bg-transparent resize-none border-none focus:outline-none text-base leading-relaxed min-h-[250px] focus:ring-0 ${
              theme === 'dark' ? 'text-slate-200 placeholder-slate-700' : 'text-slate-800 font-medium placeholder-slate-400'
            }`}
          />
          
          <div className={`flex items-center gap-4 pt-4 border-t text-xs font-mono text-slate-500 mt-2 ${
            theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'
          }`}>
            <span>{t.charCount || 'Belgilar'}: <strong className="text-indigo-500">{charCount}</strong></span>
            <span>{t.wordCount || 'So\'zlar'}: <strong className="text-indigo-505">{wordCount}</strong></span>
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
              {activeDirection === 'toLatin' ? (t.latinOutputHeader || 'LOTIN ALIFBOSIDA (NATIJA)') : (t.cyrillicOutputHeader || 'KIRILL ALIFBOSIDA (NATIJA)')}
            </span>
            <div className="flex items-center gap-2">
              {outputText && (
                <button
                  onClick={() => speakText(outputText, false)}
                  className={`p-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlayingOutput 
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20' 
                      : 'text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 dark:text-indigo-300'
                  }`}
                  title={isPlayingOutput ? (t.stopTts || "To'xtatish") : (t.listenTts || "Tinglash")}
                >
                  {isPlayingOutput ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                      {t.stopTts || "To'xtatish"}
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      {t.listenTts || "Tinglash"}
                    </>
                  )}
                </button>
              )}
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
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t.copy}
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
            {outputText || t.outputPlaceholder}
          </div>
        </div>
      </div>
      
      {/* Rule Help Tip */}
      <div className={`border-t px-6 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono ${
        theme === 'dark' ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-100/60 border-slate-200 text-slate-550'
      }`}>
        <span className={`font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.rulesLabel || 'Qoidalar'}:</span>
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

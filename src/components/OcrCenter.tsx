/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { createSimpleDocx } from '../utils/fileProcessor';
import { cyrillicToLatin, latinToCyrillic } from '../utils/translit';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { Camera, Image as ImageIcon, Sparkles, FileText, Globe, ArrowRight, Download, Check, RefreshCw, Layers } from 'lucide-react';

interface OcrCenterProps {
  currentLang: Language;
  theme?: 'light' | 'dark';
  onSendToHandwriting?: (text: string) => void;
}

export default function OcrCenter({ currentLang, theme = 'dark', onSendToHandwriting }: OcrCenterProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [imgBase64, setImgBase64] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEMO_OCTR_TEXTS = [
    "ЎЗБЕКИСТОН РЕСПУБЛИКАСИ ВАЗИРЛАР МАҲКАМАСИ\n\nҚАРОР\n\nДавлат тили тўғрисидаги қонун ва қоидалар ижросини таъминлаш тўғрисида.\n\nКорхона ва ташкилотларда иш юритиш тўлиқ лотин алифбосида амалга оширилиши лозим.",
    "МУҚАДДАС ВАТАН ТУЙҒУСИ\n\nМиллий ўзликни англаш ва маданий меросни асраш - ҳар бир фуқаронинг олий вазифасидир. Тил - миллатнинг кўзгуси, тарихи ва қалбидир.",
    "КОНТРАКТ №402-A\n\nИкки томонлама олди-сотди мажбуриятларини бажариш ҳамda madaniyat va turizmni rivojlantirish loyihasi."
  ];

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImg(url);
      setOcrText('');
      setOcrStatus('idle');
      setOcrProgress(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImgBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startOcrScan = async () => {
    if (!selectedImg || !imgBase64) return;
    setOcrStatus('scanning');
    setOcrProgress(20);

    try {
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgBase64 })
      });
      setOcrProgress(70);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "OCR xizmatida xatolik yuz berdi");
      }
      const data = await res.json();
      setOcrProgress(100);
      setOcrStatus('success');
      setOcrText(data.output || "Tasvirdan hech qanday matn aniqlanmadi.");
    } catch (err: any) {
      console.error("OCR Error:", err);
      setOcrStatus('error');
      setOcrProgress(null);
      setOcrText(err.message || "Tasvirdagi matnni aniqlash xizmati vaqtincha ishlamayapti. Iltimos, API kalitingiz va tarmoq ulanishingiz to'g'riligini tekshiring hamda birozdan keyin qayta urinib ko'ring.");
    }
  };

  const handleOcrToLatin = () => {
    if (!ocrText) return;
    const translated = cyrillicToLatin(ocrText);
    setOcrText(translated);
  };

  const handleOcrTranslate = async () => {
    if (!ocrText) return;
    setOcrStatus('scanning');
    setOcrProgress(50);
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ocrText,
          sourceLang: currentLang,
          targetLang: 'en'
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Tarjima amalga oshmadi");
      }
      const data = await res.json();
      setOcrText(`=== TARJIMA (O'zbekcha ⇄ English) ===\n\n${data.output || ""}`);
      setOcrStatus('success');
    } catch (err: any) {
      console.error(err);
      setOcrStatus('error');
      setOcrText(err.message || "Tarjima qilish xizmati vaqtincha ishlamayapti. Iltimos, API kalitingizni tekshiring.");
    } finally {
      setOcrProgress(null);
    }
  };

  const handleOcrSaveWord = async () => {
    if (!ocrText) return;
    try {
      const docBlob = await createSimpleDocx(ocrText);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(docBlob);
      link.download = `ocr_natija_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = async () => {
    if (!ocrText) return;
    try {
      await navigator.clipboard.writeText(ocrText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Title block */}
      <div>
        <h2 className={`text-xl sm:text-2xl font-black font-display tracking-wide ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          {t.ocrTitle}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-550'}`}>
          {t.ocrDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Image Upload & Preview Scanners */}
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition duration-350 aspect-video flex flex-col items-center justify-center relative overflow-hidden group ${
              theme === 'dark' 
                ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500/50 hover:bg-slate-900/10' 
                : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImgSelect}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            {selectedImg ? (
              <img src={selectedImg} alt="Scanned Document" className="absolute inset-0 w-full h-full object-contain bg-slate-950" />
            ) : (
              <>
                <Camera className="w-12 h-12 text-indigo-505 dark:text-indigo-400 mb-3 animate-pulse" />
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{t.selectOcrImage}</h4>
                <p className="text-xs text-slate-550 mt-1 font-semibold">Skrinshot, rasm yoki biron-bir varaq foto nusxasi...</p>
              </>
            )}

            {/* Glowing Scan Bar for scanning phase */}
            {ocrStatus === 'scanning' && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan" style={{ animationDuration: '2s' }} />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startOcrScan}
              disabled={!selectedImg || ocrStatus === 'scanning'}
              className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold text-white text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 duration-200 active:scale-95 cursor-pointer"
            >
              {ocrStatus === 'scanning' ? `${t.ocrProgress}${ocrProgress}%` : t.ocrBtn}
              <RefreshCw className={`w-4 h-4 ${ocrStatus === 'scanning' ? 'animate-spin' : ''}`} />
            </button>
            
            {selectedImg && (
              <button
                onClick={() => {
                  setSelectedImg(null);
                  setOcrText('');
                  setOcrStatus('idle');
                }}
                className={`py-3 px-4 border duration-200 text-xs font-black rounded-xl cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white/5 hover:bg-rose-500/10 hover:text-rose-450 border-white/5 text-slate-400'
                    : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border-slate-200 text-slate-650'
                }`}
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Right column: Extracted Editor Panel and action buttons workflow */}
        <div className={`border p-6 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800 shadow-black/55' 
            : 'bg-white border-slate-200 shadow-indigo-100/10'
        }`}>
          <div className="space-y-4">
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-805' : 'border-slate-150'}`}>
              <span className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-indigo-305' : 'text-indigo-600'}`}>OCR MATN ANALIZATORI</span>
              {ocrText && (
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                    copied 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : theme === 'dark'
                        ? 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {copied ? t.copied : t.copy}
                </button>
              )}
            </div>

            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Tasvirdan o'qilgan matn bu yerda paydo bo'ladi va uni tahrirlashingiz mumkin..."
              className={`w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[220px] ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-900 font-semibold'
              }`}
            />
          </div>

          {/* Workflow actions */}
          {ocrText && (
            <div className={`pt-4 border-t mt-4 space-y-3 ${theme === 'dark' ? 'border-slate-805' : 'border-slate-150'}`}>
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase block tracking-wider">MATNNI KEYINGI BOSQICHGA UZATISH:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <button
                  onClick={handleOcrToLatin}
                  className="py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 duration-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  {t.ocrConvertDirect}
                </button>
                <button
                  onClick={handleOcrTranslate}
                  className="py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 duration-200 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {t.ocrTranslateDirect}
                </button>
                <button
                  onClick={handleOcrSaveWord}
                  className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 duration-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.ocrSaveWord}
                </button>
                {onSendToHandwriting && (
                  <button
                    onClick={() => onSendToHandwriting(ocrText)}
                    className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 duration-200 cursor-pointer shadow active:scale-95"
                  >
                    ✍️ {currentLang === 'uz' ? "Qo'lyozmaga o'tkazish" : currentLang === 'ru' ? "Превратить в почерк" : "Convert to Notebook"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

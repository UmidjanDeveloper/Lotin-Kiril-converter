/**
 * PersonalHandwriting — yashlamba/handwrite-inspired browser implementation.
 *
 * User draws each character of the Uzbek Latin alphabet in individual canvas cells.
 * Strokes are saved as base64 PNG images to localStorage under 'hz_personal_font'.
 * OpenSourceLabs reads these images and renders them character-by-character on export,
 * giving truly personal (user-specific) handwriting output.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Check, RefreshCw, Download, PenTool, AlertCircle } from 'lucide-react';

// ─── Uzbek Latin character set ────────────────────────────────────────────────
// Grouped logically: lowercase, uppercase, Uzbek specials, digits, punctuation
const CHAR_GROUPS = [
  {
    label: "Kichik harflar",
    chars: ['a','b','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z'],
  },
  {
    label: "O'zbek maxsus",
    chars: ["o'","g'","sh","ch","ng"],
  },
  {
    label: "Katta harflar",
    chars: ['A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','X','Y','Z'],
  },
  {
    label: "Raqamlar",
    chars: ['0','1','2','3','4','5','6','7','8','9'],
  },
  {
    label: "Tinish belgilari",
    chars: [',','.',':',';','!','?','-'],
  },
];

const ALL_CHARS = CHAR_GROUPS.flatMap(g => g.chars);
const STORAGE_KEY = 'hz_personal_font';

// Canvas size for capturing (2× for quality)
const CAP_W = 160;
const CAP_H = 120;

interface Props {
  onClose: () => void;
  theme?: 'dark' | 'light';
  currentLang?: 'uz' | 'ru' | 'en';
}

export const PERSONAL_FONT_KEY = '__personal__' as const;

export function loadPersonalFont(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export default function PersonalHandwriting({ onClose, theme = 'dark', currentLang = 'uz' }: Props) {
  const dk = theme === 'dark';

  const [saved, setSaved]             = useState<Record<string, string>>(() => loadPersonalFont());
  const [activeChar, setActiveChar]   = useState<string>(ALL_CHARS[0]);
  const [penColor, setPenColor]       = useState('#1d4ed8');
  const [penSize, setPenSize]         = useState(6);
  const [isDrawing, setIsDrawing]     = useState(false);
  const [saveFlash, setSaveFlash]     = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);

  // Keep saved count in sync
  useEffect(() => {
    setCompletedCount(Object.keys(saved).length);
  }, [saved]);

  // When active char changes, load its saved drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CAP_W, CAP_H);

    // Draw baseline guide
    ctx.strokeStyle = '#bfdbfe30';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, CAP_H * 0.75);
    ctx.lineTo(CAP_W - 10, CAP_H * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    if (saved[activeChar]) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved[activeChar];
    }
  }, [activeChar, saved]);

  // ── Drawing helpers ──────────────────────────────────────────────────────────

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CAP_W / rect.width;
    const scaleY = CAP_H / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    lastPos.current = pos;

    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, penSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
  }, [penColor, penSize]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;

    const pos = getPos(e, canvas);
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
  }, [isDrawing, penColor, penSize]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
    // Auto-save this character
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const next = { ...saved, [activeChar]: dataUrl };
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [saved, activeChar]);

  const clearChar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CAP_W, CAP_H);
    // Redraw guide
    ctx.strokeStyle = '#bfdbfe30';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, CAP_H * 0.75);
    ctx.lineTo(CAP_W - 10, CAP_H * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    const next = { ...saved };
    delete next[activeChar];
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearAll = () => {
    setSaved({});
    localStorage.removeItem(STORAGE_KEY);
    const canvas = canvasRef.current;
    if (canvas) canvasRef.current!.getContext('2d')!.clearRect(0, 0, CAP_W, CAP_H);
  };

  const handleSaveAll = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const progress = Math.round((completedCount / ALL_CHARS.length) * 100);

  // ── Render ───────────────────────────────────────────────────────────────────

  const cardBg = dk ? 'bg-[#0d1117] border-[#21262d]' : 'bg-white border-slate-200';

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-3 ${
      dk ? 'bg-[#050608]/95 backdrop-blur-md' : 'bg-slate-900/80 backdrop-blur-sm'
    }`}>
      <div className={`w-full max-w-5xl rounded-3xl border shadow-2xl animate-slide-up ${cardBg}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dk ? 'border-[#21262d]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className={`text-sm font-black ${dk ? 'text-white' : 'text-slate-900'}`}>
                {currentLang === 'uz' ? "Shaxsiy Qo'lyozmangizni Kiriting" : currentLang === 'ru' ? 'Введите Личный Почерк' : 'Enter Your Personal Handwriting'}
              </h2>
              <p className={`text-[11px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentLang === 'uz'
                  ? `Har bir harfni chizing → avtomatik saqlanadi · ${completedCount}/${ALL_CHARS.length} tugallandi`
                  : `Draw each character → auto-saves · ${completedCount}/${ALL_CHARS.length} done`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl cursor-pointer transition ${dk ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className={`px-6 py-3 border-b ${dk ? 'border-[#21262d]' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className={dk ? 'text-slate-500' : 'text-slate-400'}>
              {currentLang === 'uz' ? 'Jarayon' : 'Progress'}
            </span>
            <span className={`font-black ${progress >= 80 ? 'text-emerald-400' : progress >= 40 ? 'text-amber-400' : 'text-blue-400'}`}>
              {progress}%
            </span>
          </div>
          <div className={`h-1.5 rounded-full ${dk ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Character selection grid */}
          <div className="lg:col-span-8 space-y-4">
            {CHAR_GROUPS.map(group => (
              <div key={group.label}>
                <p className={`text-[9px] font-black font-mono uppercase tracking-widest mb-2 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.chars.map(ch => {
                    const done = !!saved[ch];
                    const isActive = activeChar === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => setActiveChar(ch)}
                        className={`relative min-w-[36px] h-9 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                            : done
                            ? dk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : dk ? 'bg-[#0d1117] border-[#21262d] text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                        style={done && !isActive ? { backgroundImage: `url(${saved[ch]})`, backgroundSize: '90%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.85 } : {}}
                      >
                        {!done || isActive ? (ch === "o'" ? "o'" : ch === "g'" ? "g'" : ch) : ''}
                        {done && !isActive && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-[#0d1117]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawing panel */}
          <div className="lg:col-span-4 space-y-3">

            {/* Active char label */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-mono uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                  {currentLang === 'uz' ? 'Hozir chizayapsiz' : 'Drawing'}
                </p>
                <p className={`text-3xl font-black leading-tight ${dk ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: '"Caveat", cursive' }}>
                  {activeChar}
                </p>
              </div>
              <button onClick={clearChar}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition ${dk ? 'border-[#21262d] text-slate-500 hover:text-rose-400 hover:border-rose-500/30' : 'border-slate-200 text-slate-400 hover:text-rose-500'}`}
                title={currentLang === 'uz' ? 'Tozalash' : 'Clear'}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Canvas */}
            <div className={`rounded-2xl border overflow-hidden ${dk ? 'border-[#21262d] bg-white' : 'border-slate-200 bg-white'}`}>
              <canvas
                ref={canvasRef}
                width={CAP_W}
                height={CAP_H}
                className="w-full touch-none"
                style={{ cursor: 'crosshair', background: '#fff', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>

            {/* Pen controls */}
            <div className={`rounded-2xl border p-3 space-y-3 ${dk ? 'border-[#21262d]' : 'border-slate-200'}`}>
              {/* Color */}
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-widest mb-2 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                  {currentLang === 'uz' ? 'Ruchka rangi' : 'Pen color'}
                </p>
                <div className="flex gap-2">
                  {[
                    { c: '#1d4ed8', label: "Ko'k" },
                    { c: '#111827', label: 'Qora' },
                    { c: '#dc2626', label: 'Qizil' },
                    { c: '#059669', label: 'Yashil' },
                  ].map(p => (
                    <button
                      key={p.c}
                      onClick={() => setPenColor(p.c)}
                      title={p.label}
                      style={{ background: p.c }}
                      className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition ${
                        penColor === p.c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Pen size */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <p className={`text-[9px] font-mono uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                    {currentLang === 'uz' ? "Qalam qalinligi" : 'Pen size'}
                  </p>
                  <span className={`text-[10px] font-black ${dk ? 'text-blue-400' : 'text-blue-600'}`}>{penSize}px</span>
                </div>
                <input type="range" min={3} max={14} value={penSize}
                  onChange={e => setPenSize(+e.target.value)}
                  className="w-full accent-blue-500 cursor-pointer" />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const idx = ALL_CHARS.indexOf(activeChar);
                  if (idx > 0) setActiveChar(ALL_CHARS[idx - 1]);
                }}
                disabled={ALL_CHARS.indexOf(activeChar) === 0}
                className={`flex-1 py-2 text-xs font-bold border rounded-xl cursor-pointer transition disabled:opacity-40 ${dk ? 'border-[#21262d] text-slate-400 hover:text-white hover:border-slate-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                ← {currentLang === 'uz' ? 'Oldingi' : 'Prev'}
              </button>
              <button
                onClick={() => {
                  const idx = ALL_CHARS.indexOf(activeChar);
                  if (idx < ALL_CHARS.length - 1) setActiveChar(ALL_CHARS[idx + 1]);
                }}
                disabled={ALL_CHARS.indexOf(activeChar) === ALL_CHARS.length - 1}
                className={`flex-1 py-2 text-xs font-bold border rounded-xl cursor-pointer transition disabled:opacity-40 ${dk ? 'border-[#21262d] text-slate-400 hover:text-white hover:border-slate-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {currentLang === 'uz' ? 'Keyingi' : 'Next'} →
              </button>
            </div>

            {/* Info */}
            {completedCount < 10 && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${dk ? 'bg-blue-500/5 border-blue-500/15 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {currentLang === 'uz'
                    ? "Kamida 26 harf chizing. Har bir harf bir marta chizilgandan keyin avtomatik saqlanadi."
                    : "Draw at least 26 letters. Each character auto-saves after drawing."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between gap-4 ${dk ? 'border-[#21262d]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={clearAll}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl cursor-pointer transition ${dk ? 'border-rose-800/50 text-rose-400 hover:bg-rose-950/30' : 'border-rose-200 text-rose-500 hover:bg-rose-50'}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              {currentLang === 'uz' ? 'Hammasini tozalash' : 'Clear all'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-xs ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
              {completedCount}/{ALL_CHARS.length} {currentLang === 'uz' ? 'harf' : 'chars'}
            </p>
            <button
              onClick={() => { handleSaveAll(); onClose(); }}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition ${
                saveFlash
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
              }`}
            >
              {saveFlash ? <><Check className="w-3.5 h-3.5" /> {currentLang === 'uz' ? 'Saqlandi!' : 'Saved!'}</> : <><Download className="w-3.5 h-3.5" /> {currentLang === 'uz' ? 'Saqlash va yopish' : 'Save & Close'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

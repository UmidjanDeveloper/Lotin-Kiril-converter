/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Handwriting Studio — WYSIWYG editor
 * Textarea directly on paper (always works), + floating text-block mode.
 */

import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import {
  PenTool, UploadCloud, X, AlertCircle, Check,
  FileDown, Printer, Download, RefreshCw, Layers,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  ZoomIn, ZoomOut, Trash2, Plus, UserCheck
} from 'lucide-react';
import PersonalHandwriting, { PERSONAL_FONT_KEY, loadPersonalFont } from './PersonalHandwriting';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaperType = 'ruled' | 'grid' | 'blank' | 'yellow';
type HWFont = 'Caveat' | 'Kalam' | 'Patrick Hand' | 'Indie Flower' | 'Marck Script' | 'Bad Script' | 'Reenie Beanie' | 'Schoolbell' | typeof PERSONAL_FONT_KEY;

interface TextBlock {
  id: string;
  text: string;
  x: number;   // paper px
  y: number;   // paper px
  w: number;
  fontSize: number;
  color: string;
  font: HWFont;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PW = 794;   // A4 at 96 dpi
const PH = 1123;
const ML = 90;    // left margin in paper coords
const MT = 72;    // top margin

const FONTS: { id: HWFont; sample: string }[] = [
  { id: 'Caveat',        sample: 'Caveat'        },
  { id: 'Kalam',         sample: 'Kalam'         },
  { id: 'Patrick Hand',  sample: 'Patrick Hand'  },
  { id: 'Indie Flower',  sample: 'Indie Flower'  },
  { id: 'Marck Script',  sample: 'Marck Script'  },
  { id: 'Bad Script',    sample: 'Bad Script'    },
  { id: 'Reenie Beanie', sample: 'Reenie Beanie' },
  { id: 'Schoolbell',    sample: 'Schoolbell'    },
];

// HandWriter-inspired: each font has 2 visually similar variant fonts.
// When jitter > 3, some characters randomly use a variant — mimicking natural
// per-character variation found in real handwriting datasets.
const FONT_VARIANTS: Partial<Record<HWFont, HWFont[]>> = {
  'Caveat':        ['Kalam', 'Patrick Hand'],
  'Kalam':         ['Caveat', 'Patrick Hand'],
  'Patrick Hand':  ['Kalam', 'Indie Flower'],
  'Indie Flower':  ['Patrick Hand', 'Schoolbell'],
  'Marck Script':  ['Bad Script'],
  'Bad Script':    ['Marck Script'],
  'Reenie Beanie': ['Schoolbell'],
  'Schoolbell':    ['Reenie Beanie', 'Indie Flower'],
};

/** Guarantees all font weights are loaded before canvas rendering. */
async function ensureFontsLoaded(fontName: HWFont, size: number): Promise<void> {
  const allFonts = [fontName, ...(FONT_VARIANTS[fontName] ?? [])];
  await Promise.allSettled(
    allFonts.flatMap(f => [
      document.fonts.load(`${size}px "${f}"`),
      document.fonts.load(`bold ${size}px "${f}"`),
      document.fonts.load(`italic ${size}px "${f}"`),
    ])
  );
  await document.fonts.ready;
}

const PENS = [
  { hex: '#2563eb', cls: 'bg-blue-600',  label: "Ko'k"  },
  { hex: '#1e3a8a', cls: 'bg-blue-900',  label: "To'q"  },
  { hex: '#111827', cls: 'bg-gray-900',  label: 'Qora'  },
  { hex: '#dc2626', cls: 'bg-red-600',   label: 'Qizil' },
];

const DEFAULT_TEXT =
  `Salom! Bu qo'lyozma studiyasi.\n` +
  `Matn yozing — xuddi haqiqiy daftarga yozgandek.\n\n` +
  `Qog'oz turini, shriftni va ruchka rangini\n` +
  `chapdan tanlashingiz mumkin.\n\n` +
  `Tayyor bo'lgach, chop eting yoki PDF/PNG yuklang.\n\n` +
  `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n` +
  `Imzo: ____________________`;

// ─── Paper background style ────────────────────────────────────────────────────

function paperBg(paper: PaperType, lh: number): React.CSSProperties {
  const base: React.CSSProperties = { position: 'relative', background: '#ffffff' };
  if (paper === 'blank') return { ...base, background: '#fbfbfa' };
  if (paper === 'yellow') return {
    ...base, background: '#fef9c3',
    backgroundImage: `repeating-linear-gradient(
      transparent, transparent ${lh - 1}px,
      #cab614 ${lh - 1}px, #cab614 ${lh}px
    )`,
    backgroundPositionY: `${MT}px`,
  };
  if (paper === 'grid') return {
    ...base,
    backgroundImage: `
      repeating-linear-gradient(#dde3ea 0, #dde3ea 1px, transparent 1px, transparent 25px),
      repeating-linear-gradient(90deg, #dde3ea 0, #dde3ea 1px, transparent 1px, transparent 25px)
    `,
    backgroundSize: '25px 25px',
  };
  // ruled
  return {
    ...base,
    backgroundImage: `repeating-linear-gradient(
      transparent, transparent ${lh - 1}px,
      #93c5fd ${lh - 1}px, #93c5fd ${lh}px
    )`,
    backgroundPositionY: `${MT}px`,
  };
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  currentLang?: 'uz' | 'ru' | 'en';
  theme?: 'light' | 'dark';
  sharedHandwriteText?: string;
  clearSharedHandwriteText?: () => void;
}

export default function OpenSourceLabs({
  currentLang = 'uz',
  theme = 'dark',
  sharedHandwriteText = '',
  clearSharedHandwriteText,
}: Props) {
  // Settings
  const [paper, setPaper]     = useState<PaperType>('ruled');
  const [font,  setFont]      = useState<HWFont>('Caveat');
  const [color, setColor]     = useState('#2563eb');
  const [fsize, setFsize]     = useState(22);
  const [lh,    setLh]        = useState(38);
  const [zoom,  setZoom]      = useState(0.85);
  const [jitter, setJitter]   = useState(3);
  const [exporting, setExporting] = useState(false);
  const [showPersonalCapture, setShowPersonalCapture] = useState(false);
  const [personalFontData, setPersonalFontData]       = useState<Record<string, string>>(() => loadPersonalFont());
  const personalFontCount = Object.keys(personalFontData).length;

  // Toolbar state (per-block or global for textarea mode)
  const [bold,    setBold]    = useState(false);
  const [italic,  setItalic]  = useState(false);
  const [uline,   setUline]   = useState(false);
  const [align,   setAlign]   = useState<'left'|'center'|'right'>('left');

  // Mode: simple = single textarea, blocks = floating text blocks
  const [mode, setMode] = useState<'simple' | 'blocks'>('simple');

  // Simple mode text
  const [text, setText] = useState(DEFAULT_TEXT);

  // Blocks mode
  const [blocks,    setBlocks]    = useState<TextBlock[]>([]);
  const [activeId,  setActiveId]  = useState<string | null>(null);

  // Drag state (for blocks mode)
  const dragRef = useRef<{ id: string; startX: number; startY: number; bx: number; by: number } | null>(null);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [upMsg, setUpMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const paperRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const dk = theme === 'dark';

  // ── Receive text from other tabs ─────────────────────────────────────────────
  useEffect(() => {
    if (!sharedHandwriteText) return;
    setText(sharedHandwriteText);
    setMode('simple');
    clearSharedHandwriteText?.();
  }, [sharedHandwriteText]);

  // ── File parsers ─────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setUploading(true);
    setUpMsg(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let out = '';

      if (ext === 'docx') {
        const ab = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: ab });
        out = res.value.trim();
      } else if (ext === 'txt') {
        out = await new Promise<string>((res, rej) => {
          const fr = new FileReader();
          fr.onload = e => res(e.target?.result as string ?? '');
          fr.onerror = () => rej(new Error('read error'));
          fr.readAsText(file);
        });
      } else if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdoc = await PDFDocument.load(ab);
        let raw = '';
        for (const page of pdoc.getPages()) {
          const content = (page as any).node?.Contents?.();
          if (!content) continue;
          const str = new TextDecoder().decode(content.decode());
          const matches = str.matchAll(/\(([^)]{1,200})\)\s*Tj/g);
          for (const m of matches) raw += m[1] + ' ';
        }
        out = raw.trim() || (currentLang === 'uz'
          ? "(PDF matni o'qib bo'lmadi)"
          : "(PDF text could not be extracted)");
      } else {
        throw new Error(currentLang === 'uz'
          ? 'Faqat .docx, .pdf va .txt qo\'llab-quvvatlanadi'
          : 'Only .docx, .pdf and .txt are supported');
      }

      if (!out.trim()) throw new Error(currentLang === 'uz' ? 'Fayl bo\'sh' : 'File is empty');
      setText(out);
      setMode('simple');
      setUpMsg({ ok: true, text: currentLang === 'uz' ? 'Fayl muvaffaqiyatli o\'qildi!' : 'File imported!' });
    } catch (e: any) {
      setUpMsg({ ok: false, text: e.message });
    } finally {
      setUploading(false);
    }
  };

  // ── Canvas renderer ───────────────────────────────────────────────────────────
  const renderCanvas = (): HTMLCanvasElement => {
    const canvas = canvasRef.current!;
    const S = 2; // retina
    canvas.width  = PW * S;
    canvas.height = PH * S;
    const ctx = canvas.getContext('2d')!;

    // Paper fill
    ctx.fillStyle = paper === 'yellow' ? '#fef9c3' : paper === 'blank' ? '#fbfbfa' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lines
    if (paper === 'ruled' || paper === 'yellow') {
      const step = lh * S;
      ctx.strokeStyle = paper === 'yellow' ? '#cab614' : '#93c5fd';
      ctx.lineWidth = 1;
      for (let y = (MT + lh) * S; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ML * S, 0); ctx.lineTo(ML * S, canvas.height); ctx.stroke();
    } else if (paper === 'grid') {
      const gs = 25 * S;
      ctx.strokeStyle = '#dde3ea'; ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    }

    // Text rendering — authentic handwriting simulation.
    // Technique inspired by GDGVIT/HandWriter: per-character variation via
    // font variants, position jitter, rotation, ink-pressure alpha, and
    // natural baseline drift per line.
    const drawText = (t: string, startX: number, startY: number, maxW: number, opts: { font: HWFont; size: number; color: string; bold: boolean; italic: boolean; underline: boolean }) => {
      const baseFont = (sz: number, f: string) =>
        `${opts.italic ? 'italic ' : ''}${opts.bold ? 'bold ' : ''}${sz}px "${f}", cursive`;
      const baseFontStr = baseFont(opts.size * S, opts.font);
      ctx.font = baseFontStr;
      ctx.fillStyle = opts.color;
      const step = lh * S;
      const lines = t.split('\n');
      let cy = startY;

      for (const line of lines) {
        if (cy > canvas.height - 20) break;
        ctx.font = baseFontStr;
        const words = line.split(' ');
        let cur = '';
        const wrapped: string[] = [];
        for (const w of words) {
          const test = cur + (cur ? ' ' : '') + w;
          if (ctx.measureText(test).width > maxW && cur) { wrapped.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) wrapped.push(cur);

        for (const wl of wrapped) {
          if (cy > canvas.height - 20) break;

          if (jitter > 0) {
            // Per-line natural baseline drift (simulates hand tiredness)
            const lineDrift = (Math.random() - 0.5) * jitter * S * 0.25;
            let cx = startX;

            for (const char of wl) {
              ctx.font = baseFontStr;
              const baseCharW = ctx.measureText(char).width;

              // Per-character offsets
              const jx    = (Math.random() - 0.5) * jitter * S * 0.85;
              const jy    = (Math.random() - 0.5) * jitter * S * 0.6 + lineDrift;
              const angle = (Math.random() - 0.5) * jitter * 0.0065;
              const sizeV = 1 + (Math.random() - 0.5) * jitter * 0.02;

              // Ink-pressure: alpha varies 0.75–1.0 (heavier vs lighter strokes)
              const alpha = 0.75 + Math.random() * 0.25;

              // HandWriter-style font variant: ~20% chance when jitter ≥ 4
              const variants = FONT_VARIANTS[opts.font];
              const useVariant = jitter >= 4 && variants && Math.random() < 0.20;
              const charFont = useVariant
                ? variants![Math.floor(Math.random() * variants!.length)]
                : opts.font;

              ctx.save();
              ctx.translate(cx + jx, cy + jy);
              ctx.rotate(angle);
              ctx.font = baseFont(opts.size * S * sizeV, charFont);
              ctx.globalAlpha = alpha;
              ctx.fillStyle = opts.color;
              ctx.fillText(char, 0, 0);
              ctx.globalAlpha = 1;
              ctx.restore();

              // Natural spacing: tiny random spread/cluster
              cx += baseCharW + (Math.random() - 0.5) * jitter * S * 0.16;
            }
          } else {
            ctx.font = baseFontStr;
            ctx.fillStyle = opts.color;
            ctx.fillText(wl, startX, cy, maxW);
          }

          if (opts.underline) {
            ctx.font = baseFontStr;
            ctx.strokeStyle = opts.color; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, cy + 2);
            ctx.lineTo(startX + ctx.measureText(wl).width, cy + 2);
            ctx.stroke();
          }
          cy += step;
        }
      }
    };

    // Personal font rendering: draw saved images per character
    // Falls back to Caveat for any missing character.
    const drawPersonalText = (t: string, startX: number, startY: number, maxW: number, opts: { size: number; color: string; bold: boolean; italic: boolean }) => {
      const pf = loadPersonalFont();
      const fallbackFs = `${opts.italic?'italic ':''}${opts.bold?'bold ':''}${opts.size * S}px "Caveat", cursive`;
      const step = lh * S;
      const lines = t.split('\n');
      let cy = startY;

      for (const line of lines) {
        if (cy > canvas.height - 20) break;
        ctx.font = fallbackFs;
        const words = line.split(' ');
        let cur = '';
        const wrapped: string[] = [];
        for (const w of words) {
          const test = cur + (cur ? ' ' : '') + w;
          if (ctx.measureText(test).width > maxW && cur) { wrapped.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) wrapped.push(cur);

        for (const wl of wrapped) {
          if (cy > canvas.height - 20) break;
          let cx = startX;

          for (const char of wl) {
            const charKey = pf[char] ? char : (pf[char.toLowerCase()] ? char.toLowerCase() : null);
            ctx.font = fallbackFs;
            const baseW = ctx.measureText(char).width;

            if (charKey && pf[charKey]) {
              const img = new window.Image();
              img.src = pf[charKey];
              const targetH = opts.size * S * 1.1;
              const targetW = targetH * (160 / 120); // CAP_W/CAP_H ratio
              const jx = jitter > 0 ? (Math.random() - 0.5) * jitter * S * 0.6 : 0;
              const jy = jitter > 0 ? (Math.random() - 0.5) * jitter * S * 0.4 : 0;
              const angle = jitter > 0 ? (Math.random() - 0.5) * jitter * 0.005 : 0;
              ctx.save();
              ctx.translate(cx + jx, cy - targetH * 0.85 + jy);
              ctx.rotate(angle);
              ctx.globalAlpha = 0.82 + Math.random() * 0.18;
              ctx.drawImage(img, 0, 0, targetW, targetH);
              ctx.globalAlpha = 1;
              ctx.restore();
              cx += targetW * 0.6 + (Math.random() - 0.5) * jitter * S * 0.12;
            } else {
              // Fallback to Caveat for missing characters
              const jx = jitter > 0 ? (Math.random() - 0.5) * jitter * S * 0.7 : 0;
              const jy = jitter > 0 ? (Math.random() - 0.5) * jitter * S * 0.5 : 0;
              ctx.save();
              ctx.translate(cx + jx, cy + jy);
              ctx.font = fallbackFs;
              ctx.fillStyle = opts.color;
              ctx.globalAlpha = 0.85 + Math.random() * 0.15;
              ctx.fillText(char, 0, 0);
              ctx.globalAlpha = 1;
              ctx.restore();
              cx += baseW;
            }
          }
          cy += step;
        }
      }
    };

    const isPersonal = font === PERSONAL_FONT_KEY;

    if (mode === 'simple') {
      if (isPersonal) {
        drawPersonalText(text, ML * S, (MT + lh) * S, (PW - ML - 30) * S, { size: fsize, color, bold, italic });
      } else {
      drawText(text, ML * S, (MT + lh) * S, (PW - ML - 30) * S, {
        font, size: fsize, color, bold, italic, underline: uline,
      });
      } // end !isPersonal
    } else {
      for (const b of [...blocks].sort((a, z) => a.y - z.y)) {
        if (b.font === PERSONAL_FONT_KEY) {
          drawPersonalText(b.text, b.x * S, b.y * S, b.w * S, { size: b.fontSize, color: b.color, bold: b.bold, italic: b.italic });
        } else {
          drawText(b.text, b.x * S, b.y * S, b.w * S, {
            font: b.font, size: b.fontSize, color: b.color, bold: b.bold, italic: b.italic, underline: b.underline,
          });
        }
      }
    }

    return canvas;
  };

  // ── Export handlers ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    const fontUrl = `https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Patrick+Hand&family=Indie+Flower&family=Marck+Script&family=Bad+Script&family=Reenie+Beanie&family=Schoolbell&display=swap`;

    const bgCss = (() => {
      if (paper === 'blank')  return 'background:#fbfbfa';
      if (paper === 'yellow') return `background:#fef9c3;background-image:repeating-linear-gradient(transparent,transparent ${lh-1}px,#cab614 ${lh-1}px,#cab614 ${lh}px);background-position-y:${MT}px`;
      if (paper === 'grid')   return `background:#fff;background-image:repeating-linear-gradient(#dde3ea 0,#dde3ea 1px,transparent 1px,transparent 25px),repeating-linear-gradient(90deg,#dde3ea 0,#dde3ea 1px,transparent 1px,transparent 25px);background-size:25px 25px`;
      return `background:#fff;background-image:repeating-linear-gradient(transparent,transparent ${lh-1}px,#93c5fd ${lh-1}px,#93c5fd ${lh}px);background-position-y:${MT}px`;
    })();

    const marginLine = (paper === 'ruled' || paper === 'yellow')
      ? `<div style="position:absolute;top:0;bottom:0;left:${ML}px;width:2px;background:#fca5a5;pointer-events:none"></div>` : '';

    const jitterCss = jitter > 0
      ? `filter:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='j'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${(0.012 + jitter * 0.004).toFixed(3)}' numOctaves='3' seed='42'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='${jitter * 1.5}'/%3E%3C/filter%3E%3C/svg%3E#j")`
      : '';

    const content = mode === 'simple'
      ? `<pre style="
          font-family:'${font}',cursive;
          font-size:${fsize}px;
          color:${color};
          font-weight:${bold ? 'bold' : 'normal'};
          font-style:${italic ? 'italic' : 'normal'};
          text-decoration:${uline ? 'underline' : 'none'};
          line-height:${lh}px;
          padding:${MT}px 40px 40px ${ML+8}px;
          margin:0;white-space:pre-wrap;word-break:break-word;
          ${jitterCss}
        ">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`
      : blocks.sort((a,b)=>a.y-b.y).map(b => `
          <div style="
            position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;
            font-family:'${b.font}',cursive;font-size:${b.fontSize}px;color:${b.color};
            font-weight:${b.bold?'bold':'normal'};font-style:${b.italic?'italic':'normal'};
            text-decoration:${b.underline?'underline':'none'};
            line-height:${lh}px;white-space:pre-wrap;word-break:break-word;
          ">${b.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('');

    const pw = window.open('', '_blank');
    if (!pw) { alert('Popup ruxsatini yoqing / Allow popups'); return; }
    pw.document.write(`<!DOCTYPE html><html><head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="${fontUrl}" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#e5e7eb;padding:24px;display:flex;flex-direction:column;align-items:center;font-family:sans-serif}
        @media print{@page{size:A4;margin:0}body{background:#fff;padding:0}.no-print{display:none!important}.paper{box-shadow:none!important}}
        .paper{${bgCss};width:${PW}px;min-height:${PH}px;position:relative;box-shadow:0 4px 24px rgba(0,0,0,.2)}
        .btn{display:inline-block;margin:0 6px 12px;padding:10px 24px;background:#4f46e5;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700}
      </style>
    </head><body>
      <div class="no-print" style="margin-bottom:12px">
        <button class="btn" onclick="window.print()">🖨️ Chop etish</button>
        <button class="btn" style="background:#6b7280" onclick="window.close()">✕ Yopish</button>
      </div>
      <div class="paper">${marginLine}${content}</div>
      <script>
        // Wait for Google Fonts to fully load before printing.
        // Using document.fonts.ready (not setTimeout) guarantees the font
        // is actually rendered — setTimeout was unreliable on slow connections.
        document.fonts.ready.then(function() {
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              window.print();
            });
          });
        });
      </script>
    </body></html>`);
    pw.document.close();
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await ensureFontsLoaded(font, fsize * 2);
      const canvas = renderCanvas();
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
      pdf.save(`qolyozma_${Date.now()}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPng = async () => {
    setExporting(true);
    try {
      await ensureFontsLoaded(font, fsize * 2);
      const canvas = renderCanvas();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qolyozma_${Date.now()}.png`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const handleExportDocx = async () => {
    const textContent = mode === 'simple' ? text : blocks.sort((a,b)=>a.y-b.y).map(b=>b.text).join('\n');
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const paras = textContent.split('\n').map(line =>
      `<w:p><w:r><w:rPr><w:rFonts w:ascii="Arial"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${esc(line)}</w:t></w:r></w:p>`
    ).join('');
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/markup-compatibility/2006"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.folder('_rels')?.file('.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.folder('word')?.file('document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1700"/></w:sectPr></w:body></w:document>`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `qolyozma_${Date.now()}.docx`;
    link.click();
  };

  // ── Text blocks (click-anywhere mode) ─────────────────────────────────────────
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-bid]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = `b${Date.now()}`;
    const nb: TextBlock = {
      id, text: '', x, y,
      w: Math.min(PW - x - 20, 480),
      fontSize: fsize, font, color,
      bold, italic, underline: uline,
    };
    setBlocks(p => [...p, nb]);
    setActiveId(id);
  };

  const handleBlockMouseDown = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    e.stopPropagation(); e.preventDefault();
    const b = blocks.find(b => b.id === id)!;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, bx: b.x, by: b.y };
    setActiveId(id);
  };

  const handleDocMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setBlocks(p => p.map(b => b.id === d.id
      ? { ...b, x: Math.max(0, d.bx + dx), y: Math.max(0, d.by + dy) }
      : b
    ));
  };

  const handleDocMouseUp = () => { dragRef.current = null; };

  const updateBlock = (id: string, patch: Partial<TextBlock>) =>
    setBlocks(p => p.map(b => b.id === id ? { ...b, ...patch } : b));

  const applyToActive = (patch: Partial<TextBlock>) => {
    if (activeId) updateBlock(activeId, patch);
  };

  // ── UI helpers ────────────────────────────────────────────────────────────────
  const card = dk
    ? 'bg-slate-900/60 border-slate-800'
    : 'bg-white border-slate-200 shadow-sm';

  const btnBase = `p-2 rounded-lg border cursor-pointer transition-all text-sm`;
  const btnActive = dk ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-600 text-white border-indigo-600';
  const btnIdle   = dk ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100';

  const lbl = `text-[10px] font-black font-mono uppercase tracking-widest block mb-1.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div
      className="space-y-5 animate-slide-up"
      onMouseMove={handleDocMouseMove}
      onMouseUp={handleDocMouseUp}
    >
      {/* ── Personal handwriting capture modal ── */}
      {showPersonalCapture && (
        <PersonalHandwriting
          theme={theme}
          currentLang={currentLang}
          onClose={() => {
            setShowPersonalCapture(false);
            const refreshed = loadPersonalFont();
            setPersonalFontData(refreshed);
            if (Object.keys(refreshed).length >= 5) {
              setFont(PERSONAL_FONT_KEY);
            }
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${dk?'text-white':'text-slate-900'}`}>
            <PenTool className="w-5 h-5 text-indigo-500" />
            {currentLang==='uz' ? "Qo'lyozma Studiyasi" : currentLang==='ru' ? 'Студия Почерка' : 'Handwriting Studio'}
          </h2>
          <p className={`text-xs mt-0.5 ${dk?'text-slate-400':'text-slate-500'}`}>
            {currentLang==='uz'
              ? "Matn yozing, chop eting yoki PDF/PNG yuklab oling"
              : currentLang==='ru'
              ? "Пишите текст, печатайте или скачивайте PDF/PNG"
              : "Type text, print or download as PDF/PNG"}
          </p>
        </div>
        {/* Mode toggle */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${dk?'border-slate-800 bg-slate-900/50':'border-slate-200 bg-slate-50'}`}>
          <button onClick={() => setMode('simple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${mode==='simple'?'bg-indigo-600 text-white':dk?'text-slate-400 hover:text-white':'text-slate-500 hover:text-slate-900'}`}>
            {currentLang==='uz' ? 'Matn rejimi' : currentLang==='ru' ? 'Текст' : 'Text mode'}
          </button>
          <button onClick={() => setMode('blocks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${mode==='blocks'?'bg-indigo-600 text-white':dk?'text-slate-400 hover:text-white':'text-slate-500 hover:text-slate-900'}`}>
            {currentLang==='uz' ? 'Blok rejimi' : currentLang==='ru' ? 'Блоки' : 'Block mode'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── LEFT PANEL ── */}
        <div className="xl:col-span-3 space-y-4">

          {/* File upload */}
          <div className={`rounded-2xl border p-4 ${card}`}>
            <label className={lbl}>
              <UploadCloud className="inline w-4 h-4 text-indigo-500 mr-1" />
              {currentLang==='uz' ? 'Fayl yuklash' : currentLang==='ru' ? 'Загрузить файл' : 'Upload file'}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${dk?'border-slate-700 hover:border-indigo-500 bg-slate-900/30':'border-slate-200 hover:border-indigo-400 bg-slate-50'}`}
            >
              <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto mb-1" />
              <p className={`text-xs font-semibold ${dk?'text-slate-300':'text-slate-600'}`}>
                {uploading ? (currentLang==='uz'?'O\'qilmoqda...':'Reading...') : '.docx · .pdf · .txt'}
              </p>
            </div>
            {upMsg && (
              <div className={`mt-2 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold border ${upMsg.ok?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                <span className="line-clamp-2">{upMsg.text}</span>
                <button onClick={()=>setUpMsg(null)}><X className="w-3.5 h-3.5 shrink-0 ml-1" /></button>
              </div>
            )}
          </div>

          {/* Paper + Settings */}
          <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>

            {/* Paper type */}
            <div>
              <label className={lbl}>
                <Layers className="inline w-3.5 h-3.5 mr-1" />
                {currentLang==='uz' ? "Qog'oz turi" : currentLang==='ru' ? 'Тип бумаги' : 'Paper type'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['ruled',  currentLang==='uz'?'Chiziqli':currentLang==='ru'?'Линейка':'Ruled'],
                  ['grid',   currentLang==='uz'?'Katak':currentLang==='ru'?'Клетка':'Grid'],
                  ['blank',  currentLang==='uz'?"Bo'sh":currentLang==='ru'?'Чистый':'Blank'],
                  ['yellow', currentLang==='uz'?'Sariq':currentLang==='ru'?'Жёлтый':'Yellow'],
                ] as [PaperType, string][]).map(([id, lbl2]) => (
                  <button key={id} onClick={() => setPaper(id)}
                    className={`py-1.5 text-xs font-semibold border rounded-xl cursor-pointer transition ${paper===id?'bg-indigo-600 text-white border-indigo-600':dk?'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-900/30':'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    {lbl2}
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div>
              <label className={lbl}>
                {currentLang==='uz' ? 'Shrift' : currentLang==='ru' ? 'Шрифт' : 'Font'}
              </label>

              {/* Personal handwriting option — top of list */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    if (personalFontCount < 5) {
                      setShowPersonalCapture(true);
                    } else {
                      setFont(PERSONAL_FONT_KEY);
                      applyToActive({ font: PERSONAL_FONT_KEY });
                    }
                  }}
                  className={`w-full py-2.5 px-3 text-[11px] font-bold border rounded-xl cursor-pointer transition flex items-center justify-between gap-2 ${
                    font === PERSONAL_FONT_KEY
                      ? 'bg-amber-500 text-white border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : dk
                      ? 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
                      : 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    {currentLang==='uz' ? "Mening Qo'lyozmam" : currentLang==='ru' ? 'Мой Почерк' : 'My Handwriting'}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    font === PERSONAL_FONT_KEY ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    {personalFontCount > 0 ? `${personalFontCount} harf` : currentLang==='uz'?'Yangi':'New'}
                  </span>
                </button>
                {personalFontCount > 0 && font !== PERSONAL_FONT_KEY && (
                  <button
                    onClick={() => setShowPersonalCapture(true)}
                    className={`w-full mt-1 py-1 text-[10px] font-semibold text-center cursor-pointer transition rounded-lg ${dk ? 'text-slate-500 hover:text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}
                  >
                    {currentLang==='uz' ? '+ Ko\'proq harf qo\'shish' : 'Edit characters'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => { setFont(f.id); applyToActive({ font: f.id }); }}
                    className={`py-2 px-1 text-[11px] font-semibold border rounded-xl cursor-pointer transition text-center ${font===f.id?'bg-indigo-600 text-white border-indigo-600':dk?'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-900/30':'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    style={{ fontFamily: `"${f.id}", cursive` }}>
                    {f.sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Pen color */}
            <div>
              <label className={lbl}>{currentLang==='uz'?'Ruchka rangi':currentLang==='ru'?'Цвет чернил':'Pen color'}</label>
              <div className="flex gap-2">
                {PENS.map(p => (
                  <button key={p.hex}
                    onClick={() => { setColor(p.hex); applyToActive({ color: p.hex }); }}
                    title={p.label}
                    className={`w-9 h-9 rounded-xl border-2 cursor-pointer transition ${p.cls} ${color===p.hex?'border-white ring-2 ring-indigo-500':'border-transparent opacity-80 hover:opacity-100'}`} />
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className={`${lbl} flex justify-between`}>
                <span>{currentLang==='uz'?"Yozuv o'lchami":currentLang==='ru'?'Размер шрифта':'Font size'}</span>
                <span className="text-indigo-400 font-black">{fsize}px</span>
              </label>
              <input type="range" min={12} max={36} value={fsize}
                onChange={e => { const v = +e.target.value; setFsize(v); applyToActive({ fontSize: v }); }}
                className="w-full accent-indigo-500 cursor-col-resize" />
            </div>

            {/* Jitter / Insoniy Tebranish */}
            <div>
              <label className={`${lbl} flex justify-between`}>
                <span>{currentLang==='uz'?"Insoniy Tebranish (Jitter)":currentLang==='ru'?'Дрожание (Jitter)':'Human Jitter'}</span>
                <span className={`font-black ${jitter === 0 ? 'text-slate-500' : 'text-amber-400'}`}>{jitter}</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={jitter}
                onChange={e => setJitter(+e.target.value)}
                className="w-full accent-amber-500 cursor-col-resize" />
              <p className={`text-[9px] mt-1 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                {currentLang==='uz'
                  ? '0 = tekis kompyuter, 10 = haqiqiy qo\'l yozuvi'
                  : currentLang==='ru'
                  ? '0 = ровный, 10 = живой почерк'
                  : '0 = clean, 10 = natural handwriting'}
              </p>
            </div>

            {/* Line spacing */}
            <div>
              <label className={`${lbl} flex justify-between`}>
                <span>{currentLang==='uz'?"Qator oralig'i":currentLang==='ru'?'Интервал строк':'Line spacing'}</span>
                <span className="text-indigo-400 font-black">{lh}px</span>
              </label>
              <input type="range" min={28} max={56} value={lh}
                onChange={e => setLh(+e.target.value)}
                className="w-full accent-indigo-500 cursor-col-resize" />
            </div>
          </div>

          {/* Clear button (blocks mode) */}
          {mode === 'blocks' && (
            <button onClick={() => { setBlocks([]); setActiveId(null); }}
              className={`w-full py-2 text-xs font-bold border rounded-xl cursor-pointer flex items-center justify-center gap-2 transition ${dk?'border-rose-800/50 text-rose-400 hover:bg-rose-950/30':'border-rose-200 text-rose-500 hover:bg-rose-50'}`}>
              <Trash2 className="w-3.5 h-3.5" />
              {currentLang==='uz'?'Hammasini tozalash':currentLang==='ru'?'Очистить всё':'Clear all'}
            </button>
          )}
        </div>

        {/* ── CENTER: PAPER ── */}
        <div className="xl:col-span-6 flex flex-col gap-3">

          {/* Toolbar */}
          <div className={`rounded-2xl border p-2 flex flex-wrap items-center gap-1.5 ${card}`}>
            {/* B / I / U */}
            <button className={`${btnBase} ${bold   ? btnActive : btnIdle}`} onClick={() => { setBold(!bold);   applyToActive({ bold: !bold });   }}><Bold  className="w-3.5 h-3.5" /></button>
            <button className={`${btnBase} ${italic ? btnActive : btnIdle}`} onClick={() => { setItalic(!italic); applyToActive({ italic: !italic }); }}><Italic className="w-3.5 h-3.5" /></button>
            <button className={`${btnBase} ${uline  ? btnActive : btnIdle}`} onClick={() => { setUline(!uline);  applyToActive({ underline: !uline });  }}><Underline className="w-3.5 h-3.5" /></button>
            <div className={`w-px h-5 ${dk?'bg-slate-700':'bg-slate-200'} mx-0.5`} />
            {/* Alignment */}
            {(['left','center','right'] as const).map(a => (
              <button key={a} className={`${btnBase} ${align===a ? btnActive : btnIdle}`}
                onClick={() => { setAlign(a); applyToActive({ align: a } as any); }}>
                {a==='left' ? <AlignLeft className="w-3.5 h-3.5" /> : a==='center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
              </button>
            ))}
            <div className={`w-px h-5 ${dk?'bg-slate-700':'bg-slate-200'} mx-0.5`} />
            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(0.5, +(z-0.1).toFixed(1)))} className={`${btnBase} ${btnIdle}`}><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className={`text-[11px] font-mono font-bold w-9 text-center ${dk?'text-slate-300':'text-slate-600'}`}>{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, +(z+0.1).toFixed(1)))} className={`${btnBase} ${btnIdle}`}><ZoomIn className="w-3.5 h-3.5" /></button>
            <div className="flex-1" />
            {/* Delete active block */}
            {mode==='blocks' && activeId && (
              <button onClick={() => { setBlocks(p=>p.filter(b=>b.id!==activeId)); setActiveId(null); }}
                className={`${btnBase} border-rose-700 text-rose-400 hover:bg-rose-950/30`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Paper viewport */}
          <div className={`rounded-2xl border overflow-auto ${card}`}
            style={{ maxHeight: '75vh', background: dk ? '#0d111c' : '#e5e7eb' }}>
            <div className="flex justify-center py-5 px-4">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: PW, flexShrink: 0 }}>
                {/* ── SIMPLE MODE: textarea directly on paper ── */}
                {mode === 'simple' && (
                  <div style={{ ...paperBg(paper, lh), width: PW, minHeight: PH, boxShadow: '0 4px 28px rgba(0,0,0,.22)' }}>
                    {/* Margin line */}
                    {(paper==='ruled'||paper==='yellow') && (
                      <div style={{ position:'absolute', top:0, bottom:0, left:ML, width:2, background:'#fca5a5', pointerEvents:'none' }} />
                    )}
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      spellCheck={false}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        background: 'transparent',
                        border: 'none', resize: 'none', outline: 'none',
                        fontFamily: `"${font}", cursive`,
                        fontSize: fsize,
                        color,
                        fontWeight: bold ? 'bold' : 'normal',
                        fontStyle: italic ? 'italic' : 'normal',
                        textDecoration: uline ? 'underline' : 'none',
                        textAlign: align,
                        lineHeight: `${lh}px`,
                        paddingTop: MT,
                        paddingLeft: ML + 8,
                        paddingRight: 40,
                        paddingBottom: 40,
                        caretColor: color,
                        minHeight: PH,
                        filter: jitter > 0 ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='j'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${(0.012 + jitter * 0.004).toFixed(3)}' numOctaves='3' seed='42'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='${jitter * 1.5}'/%3E%3C/filter%3E%3C/svg%3E#j")` : 'none',
                      }}
                    />
                    {/* Character count */}
                    <div style={{ position:'absolute', bottom:8, right:12, fontSize:10, color:'#94a3b8', fontFamily:'monospace', pointerEvents:'none', userSelect:'none' }}>
                      {text.length} {currentLang==='uz'?'belgi':currentLang==='ru'?'симв':'chars'}
                    </div>
                  </div>
                )}

                {/* ── BLOCKS MODE: click to add, drag to move ── */}
                {mode === 'blocks' && (
                  <div
                    ref={paperRef}
                    onClick={handlePaperClick}
                    style={{ ...paperBg(paper, lh), width: PW, minHeight: PH, boxShadow: '0 4px 28px rgba(0,0,0,.22)', cursor: 'crosshair', userSelect: 'none' }}>
                    {(paper==='ruled'||paper==='yellow') && (
                      <div style={{ position:'absolute', top:0, bottom:0, left:ML, width:2, background:'#fca5a5', pointerEvents:'none' }} />
                    )}
                    {/* Empty state hint */}
                    {blocks.length === 0 && (
                      <div style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', color:'#94a3b8', fontSize:14, fontFamily:'sans-serif', pointerEvents:'none', width:260 }}>
                        <div style={{ fontSize:40, marginBottom:10 }}>✍️</div>
                        <div style={{ fontWeight:600 }}>
                          {currentLang==='uz'?"Istalgan joyga bosib matn yozing":currentLang==='ru'?"Кликните в любое место для ввода текста":"Click anywhere to add text"}
                        </div>
                      </div>
                    )}
                    {blocks.map(b => {
                      const isAct = activeId === b.id;
                      return (
                        <div
                          key={b.id}
                          data-bid={b.id}
                          style={{ position:'absolute', left:b.x, top:b.y, width:b.w, zIndex: isAct?20:10, outline: isAct?'2px solid #6366f1':'1px dashed transparent', borderRadius:4 }}
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Drag handle */}
                          {isAct && (
                            <div
                              onMouseDown={e => handleBlockMouseDown(e, b.id)}
                              style={{ position:'absolute', top:-22, left:0, right:0, height:22, background:'#4f46e5', borderRadius:'4px 4px 0 0', cursor:'grab', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px', fontSize:10, color:'#fff', fontFamily:'sans-serif', userSelect:'none' }}>
                              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                                ⠿ {b.font} · {b.fontSize}px
                              </span>
                              <button onMouseDown={e=>{e.stopPropagation();setBlocks(p=>p.filter(x=>x.id!==b.id));setActiveId(null);}}
                                style={{ background:'transparent', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:14, lineHeight:1 }}>✕</button>
                            </div>
                          )}
                          <textarea
                            value={b.text}
                            onChange={e => updateBlock(b.id, { text: e.target.value })}
                            onFocus={() => setActiveId(b.id)}
                            autoFocus={isAct && b.text === ''}
                            rows={Math.max(1, b.text.split('\n').length + 1)}
                            style={{
                              width:'100%', background:'transparent', border:'none', resize:'none', outline:'none', overflow:'hidden', display:'block',
                              fontFamily:`"${b.font}",cursive`, fontSize:b.fontSize, color:b.color,
                              fontWeight:b.bold?'bold':'normal', fontStyle:b.italic?'italic':'normal', textDecoration:b.underline?'underline':'none',
                              lineHeight:`${lh}px`, caretColor:b.color,
                            }}
                            placeholder={isAct ? '...' : ''}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className={`text-center text-[11px] ${dk?'text-slate-600':'text-slate-400'}`}>
            {mode==='simple'
              ? (currentLang==='uz'?'To\'g\'ridan-to\'g\'ri varaqda yozing':currentLang==='ru'?'Пишите прямо на листе':'Type directly on the paper')
              : (currentLang==='uz'?'Bosing → matn qo\'shing · Sarlavhani sudrang → ko\'chiring':currentLang==='ru'?'Кликните → добавить текст · Перетащите за заголовок':'Click → add text · Drag header → move block')}
          </p>
        </div>

        {/* ── RIGHT: EXPORT ── */}
        <div className="xl:col-span-3 space-y-4">
          <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
            <label className={lbl}>
              {currentLang==='uz'?'Eksport va Chop':currentLang==='ru'?'Экспорт и Печать':'Export & Print'}
            </label>

            <button onClick={handlePrint}
              className={`w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl cursor-pointer transition ${dk?'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700':'bg-slate-800 hover:bg-slate-700 text-white'}`}>
              <Printer className="w-4 h-4" />
              {currentLang==='uz'?'Chop etish / Print':currentLang==='ru'?'Печать':'Print'}
            </button>

            <button onClick={handleExportPdf} disabled={exporting}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-wait text-white cursor-pointer transition shadow-lg shadow-rose-600/20">
              <FileDown className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? (currentLang==='uz'?'Yuklanmoqda...':currentLang==='ru'?'Загрузка...':'Loading...') : 'PDF'}
            </button>

            <button onClick={handleExportPng} disabled={exporting}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-wait text-white cursor-pointer transition shadow-lg shadow-violet-600/20">
              <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? (currentLang==='uz'?'Yuklanmoqda...':currentLang==='ru'?'Загрузка...':'Loading...') : 'PNG'}
            </button>

            <button onClick={handleExportDocx}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition shadow-lg shadow-blue-600/20">
              <FileDown className="w-4 h-4" />
              Word (.docx)
            </button>
          </div>

          {/* Zoom info */}
          <div className={`rounded-2xl border p-4 text-center ${card}`}>
            <div className={`text-2xl font-black ${dk?'text-white':'text-slate-900'}`}>{Math.round(zoom*100)}%</div>
            <div className={`text-xs mt-0.5 ${dk?'text-slate-500':'text-slate-400'}`}>
              {currentLang==='uz'?'Ko\'rish kattaligi':currentLang==='ru'?'Масштаб':'Zoom'}
            </div>
            {mode==='blocks' && blocks.length > 0 && (
              <div className={`mt-2 pt-2 border-t ${dk?'border-slate-800':'border-slate-100'}`}>
                <div className={`text-xl font-black ${dk?'text-indigo-400':'text-indigo-600'}`}>{blocks.length}</div>
                <div className={`text-[11px] ${dk?'text-slate-500':'text-slate-400'}`}>
                  {currentLang==='uz'?'blok':currentLang==='ru'?'блоков':'blocks'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Privacy notice */}
      <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${dk?'bg-slate-950/20 border-slate-800 text-slate-500':'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          {currentLang==='uz'
            ? "Barcha fayllar va amallar faqat brauzeringizda bajariladi — hech narsa serverga yuklanmaydi."
            : currentLang==='ru'
            ? "Все файлы обрабатываются только в вашем браузере — ничего не загружается на сервер."
            : "All files are processed locally in your browser — nothing is uploaded to any server."}
        </span>
      </div>

      {/* Font preloader */}
      <div aria-hidden style={{ position:'absolute', opacity:0, pointerEvents:'none', width:1, height:1, overflow:'hidden' }}>
        {FONTS.map(f => (
          <span key={f.id} style={{ fontFamily:`"${f.id}"` }}>salom qolyozma handwrite</span>
        ))}
      </div>
    </div>
  );
}

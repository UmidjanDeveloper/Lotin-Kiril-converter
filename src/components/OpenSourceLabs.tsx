/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Handwriting Studio — WYSIWYG Word-like editor
 * Click anywhere on the page to add text, drag to reposition, print or export.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import {
  PenTool, Plus, Trash2, Move, Printer, Download, FileDown,
  UploadCloud, X, Check, AlertCircle, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, RefreshCw,
  Type, Layers, Eye, EyeOff, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextBlock {
  id: string;
  text: string;
  x: number;      // px from paper left
  y: number;      // px from paper top
  w: number;      // px width
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

type PaperType = 'ruled' | 'grid' | 'blank' | 'yellow';
type FontKey  = 'Caveat' | 'Marck Script' | 'Bad Script';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAPER_W = 794;   // A4 96-dpi width  px
const PAPER_H = 1123;  // A4 96-dpi height px
const PAPER_MARGIN_L = 90;
const PAPER_MARGIN_T = 80;

const FONTS: { id: FontKey; label: string }[] = [
  { id: 'Caveat',       label: 'Caveat (Standart)'   },
  { id: 'Marck Script', label: 'Marck Script (Nozik)' },
  { id: 'Bad Script',   label: 'Bad Script (Kursiv)'  },
];

const PEN_COLORS = [
  { hex: '#2563eb', label: "Ko'k",      bg: 'bg-blue-600'  },
  { hex: '#1e3a8a', label: "To'q ko'k", bg: 'bg-blue-900'  },
  { hex: '#111827', label: 'Qora',      bg: 'bg-gray-900'  },
  { hex: '#dc2626', label: 'Qizil',     bg: 'bg-red-600'   },
];

const TR = {
  uz: {
    title: "Qo'lyozma Studiyasi",
    sub: "Varoqda istalgan joyga bosib matn yozing — Word kabi tahrirlang, chop eting.",
    addBlock: "Matn qo'shish",
    deleteBlock: "O'chirish",
    clearAll: "Hammasini tozalash",
    print: "Chop etish",
    exportPdf: "PDF yuklab olish",
    exportPng: "PNG rasm",
    exportDocx: "Word (.docx)",
    upload: "Fayl yuklash (.docx / .pdf / .txt)",
    dropzone: "Faylni bu yerga tashlang yoki bosing",
    font: "Shrift",
    paper: "Qog'oz turi",
    penColor: "Ruchka rangi",
    fontSize: "Shrift o'lchami",
    paperRuled: "Chiziqli daftar",
    paperGrid: "Katak (matematika)",
    paperBlank: "Bo'sh oq qog'oz",
    paperYellow: "Sariq daftarcha",
    zoom: "Ko'rish kattaligi",
    clickHint: "Varoqning istalgan joyiga bosib, matn yozing",
    uploadOk: "Fayl muvaffaqiyatli o'qildi!",
    uploadErr: "Faqat .docx, .pdf va .txt fayllari qo'llab-quvvatlanadi.",
    reading: "O'qilmoqda...",
    privacy: "Barcha amallar faqat brauzeringizda bajariladi — hech narsa serverga yuklanmaydi.",
  },
  ru: {
    title: "Студия Почерка",
    sub: "Кликните в любом месте страницы чтобы написать — редактируйте как в Word.",
    addBlock: "Добавить текст",
    deleteBlock: "Удалить",
    clearAll: "Очистить всё",
    print: "Печать",
    exportPdf: "Скачать PDF",
    exportPng: "PNG изображение",
    exportDocx: "Word (.docx)",
    upload: "Загрузить файл (.docx / .pdf / .txt)",
    dropzone: "Перетащите файл сюда или нажмите",
    font: "Шрифт",
    paper: "Тип бумаги",
    penColor: "Цвет чернил",
    fontSize: "Размер шрифта",
    paperRuled: "Тетрадь в линейку",
    paperGrid: "Тетрадь в клетку",
    paperBlank: "Чистый белый лист",
    paperYellow: "Желтый блокнот",
    zoom: "Масштаб",
    clickHint: "Кликните в любое место страницы для ввода текста",
    uploadOk: "Файл успешно прочитан!",
    uploadErr: "Поддерживаются только .docx, .pdf и .txt файлы.",
    reading: "Чтение...",
    privacy: "Все операции выполняются только в вашем браузере — ничего не загружается на сервер.",
  },
  en: {
    title: "Handwriting Studio",
    sub: "Click anywhere on the page to place text — edit like Word, print or export.",
    addBlock: "Add Text",
    deleteBlock: "Delete",
    clearAll: "Clear All",
    print: "Print",
    exportPdf: "Download PDF",
    exportPng: "PNG Image",
    exportDocx: "Word (.docx)",
    upload: "Upload file (.docx / .pdf / .txt)",
    dropzone: "Drop file here or click to browse",
    font: "Font",
    paper: "Paper Type",
    penColor: "Pen Color",
    fontSize: "Font Size",
    paperRuled: "Ruled Notebook",
    paperGrid: "Grid / Math Paper",
    paperBlank: "Blank White",
    paperYellow: "Yellow Legal Pad",
    zoom: "Zoom",
    clickHint: "Click anywhere on the page to place a text block",
    uploadOk: "File imported successfully!",
    uploadErr: "Only .docx, .pdf and .txt files are supported.",
    reading: "Reading...",
    privacy: "All processing happens locally in your browser — nothing is uploaded to any server.",
  },
} as const;

// ─── Paper background helper ───────────────────────────────────────────────────

function paperBgStyle(paper: PaperType, lineH = 36): React.CSSProperties {
  if (paper === 'blank') return { background: '#fbfbfa' };
  if (paper === 'yellow') return {
    background: '#fef9c3',
    backgroundImage: `repeating-linear-gradient(transparent, transparent ${lineH - 1}px, #cab614 ${lineH - 1}px, #cab614 ${lineH}px)`,
    backgroundPositionY: `${PAPER_MARGIN_T}px`,
  };
  if (paper === 'grid') return {
    background: '#fff',
    backgroundImage: `
      repeating-linear-gradient(#dde3ea 0px, #dde3ea 1px, transparent 1px, transparent 25px),
      repeating-linear-gradient(90deg, #dde3ea 0px, #dde3ea 1px, transparent 1px, transparent 25px)
    `,
  };
  // ruled
  return {
    background: '#fff',
    backgroundImage: `repeating-linear-gradient(transparent, transparent ${lineH - 1}px, #93c5fd ${lineH - 1}px, #93c5fd ${lineH}px)`,
    backgroundPositionY: `${PAPER_MARGIN_T}px`,
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
  const t = TR[currentLang] ?? TR.uz;

  // ── Paper / style settings ──────────────────────────────────────────────────
  const [paper, setPaper]       = useState<PaperType>('ruled');
  const [font,  setFont]        = useState<FontKey>('Caveat');
  const [color, setColor]       = useState('#2563eb');
  const [fSize, setFSize]       = useState(22);
  const [bold,  setBold]        = useState(false);
  const [italic, setItalic]     = useState(false);
  const [uline, setUline]       = useState(false);
  const [align, setAlign]       = useState<'left'|'center'|'right'>('left');
  const [lineH, setLineH]       = useState(36);
  const [zoom,  setZoom]        = useState(0.9);

  // ── Text blocks (WYSIWYG) ────────────────────────────────────────────────────
  const [blocks,    setBlocks]    = useState<TextBlock[]>([]);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; ox: number; oy: number } | null>(null);

  // ── File upload ──────────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [upMsg,     setUpMsg]     = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const paperRef    = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  // ── Shared text from other tabs ─────────────────────────────────────────────
  useEffect(() => {
    if (!sharedHandwriteText) return;
    const lines = sharedHandwriteText.split('\n');
    let y = PAPER_MARGIN_T + 20;
    const newBlocks: TextBlock[] = lines.filter(l => l.trim()).map((line) => {
      const b: TextBlock = {
        id: `${Date.now()}-${Math.random()}`,
        text: line,
        x: PAPER_MARGIN_L,
        y,
        w: PAPER_W - PAPER_MARGIN_L - 30,
        fontSize: fSize,
        fontFamily: font,
        color,
        bold, italic, underline: uline,
        align,
      };
      y += lineH * 2;
      return b;
    });
    setBlocks(newBlocks);
    if (clearSharedHandwriteText) clearSharedHandwriteText();
  }, [sharedHandwriteText]);

  // ── Click on paper → add block ───────────────────────────────────────────────
  const handlePaperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-block-id]')) return;

    const rect = paperRef.current!.getBoundingClientRect();
    const scale = PAPER_W / rect.width;
    const x = Math.max(10, (e.clientX - rect.left) * scale);
    const y = Math.max(10, (e.clientY - rect.top)  * scale);

    const id = `b-${Date.now()}`;
    const nb: TextBlock = {
      id, text: '', x, y,
      w: Math.min(PAPER_W - x - 20, 500),
      fontSize: fSize, fontFamily: font, color,
      bold, italic, underline: uline, align,
    };
    setBlocks(p => [...p, nb]);
    setActiveId(id);
  }, [dragState, fSize, font, color, bold, italic, uline, align]);

  // ── Drag handling ────────────────────────────────────────────────────────────
  const startDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = paperRef.current!.getBoundingClientRect();
    const scale = PAPER_W / rect.width;
    const block = blocks.find(b => b.id === id)!;
    setDragState({
      id,
      ox: e.clientX * scale - block.x,
      oy: e.clientY * scale - block.y,
    });
    setActiveId(id);
  };

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const rect = paperRef.current!.getBoundingClientRect();
    const scale = PAPER_W / rect.width;
    const nx = Math.max(0, Math.min(PAPER_W - 60, e.clientX * scale - dragState.ox));
    const ny = Math.max(0, Math.min(PAPER_H - 40, e.clientY * scale - dragState.oy));
    setBlocks(p => p.map(b => b.id === dragState.id ? { ...b, x: nx, y: ny } : b));
  }, [dragState]);

  const onMouseUp = useCallback(() => setDragState(null), []);

  // ── Block text edit ──────────────────────────────────────────────────────────
  const updateBlockText = (id: string, text: string) => {
    setBlocks(p => p.map(b => b.id === id ? { ...b, text } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(p => p.filter(b => b.id !== id));
    if (activeId === id) setActiveId(null);
  };

  // Apply toolbar settings to active block
  const applyToActive = (patch: Partial<TextBlock>) => {
    if (!activeId) return;
    setBlocks(p => p.map(b => b.id === activeId ? { ...b, ...patch } : b));
  };

  const activeBlock = blocks.find(b => b.id === activeId);

  // ── File parsers ─────────────────────────────────────────────────────────────
  const parseDocx = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: ab });
    return res.value.trim();
  };

  const parsePdf = async (file: File): Promise<string> => {
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      let out = '';
      for (const page of doc.getPages()) {
        const content = (page as any).node?.Contents?.();
        if (!content) continue;
        const raw = new TextDecoder().decode(content.decode());
        const m = raw.matchAll(/\(([^)]+)\)\s*Tj/g);
        for (const match of m) out += match[1] + ' ';
      }
      return out.trim() || '(PDF matni o\'qib bo\'lmadi — qo\'l bilan yozing)';
    } catch {
      return '(PDF tahlilida xato)';
    }
  };

  const parseTxt = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = e => res(e.target?.result as string ?? '');
      fr.onerror = () => rej(new Error('txt error'));
      fr.readAsText(file);
    });

  const handleFile = async (file: File) => {
    setUploading(true);
    setUpMsg(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let text = '';
      if (ext === 'docx') text = await parseDocx(file);
      else if (ext === 'pdf') text = await parsePdf(file);
      else if (ext === 'txt') text = await parseTxt(file);
      else throw new Error(t.uploadErr);

      if (!text.trim()) throw new Error('Fayl bo\'sh yoki matn topilmadi');

      // Distribute text into blocks
      const lines = text.split('\n').filter(l => l.trim());
      let y = PAPER_MARGIN_T + 20;
      const nb: TextBlock[] = lines.map(line => {
        const b: TextBlock = {
          id: `import-${Date.now()}-${Math.random()}`,
          text: line,
          x: PAPER_MARGIN_L,
          y,
          w: PAPER_W - PAPER_MARGIN_L - 30,
          fontSize: fSize,
          fontFamily: font,
          color,
          bold: false, italic: false, underline: false,
          align: 'left',
        };
        y += lineH * Math.ceil(line.length / 60) + lineH * 0.5;
        return b;
      });
      setBlocks(nb);
      setUpMsg({ type: 'ok', text: t.uploadOk });
    } catch (err: any) {
      setUpMsg({ type: 'err', text: err.message || t.uploadErr });
    } finally {
      setUploading(false);
    }
  };

  // ── Canvas render (for PNG/PDF export) ───────────────────────────────────────
  const renderCanvas = (): HTMLCanvasElement => {
    const canvas = canvasRef.current!;
    canvas.width  = PAPER_W * 2;
    canvas.height = PAPER_H * 2;
    const ctx = canvas.getContext('2d')!;
    const s = 2; // 2× for retina

    // Background
    ctx.fillStyle = paper === 'yellow' ? '#fef9c3' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lines
    if (paper === 'ruled' || paper === 'yellow') {
      const lh = lineH * s;
      ctx.strokeStyle = paper === 'yellow' ? '#cab614' : '#93c5fd';
      ctx.lineWidth = 1;
      for (let y = (PAPER_MARGIN_T + lineH) * s; y < canvas.height; y += lh) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAPER_MARGIN_L * s, 0);
      ctx.lineTo(PAPER_MARGIN_L * s, canvas.height);
      ctx.stroke();
    } else if (paper === 'grid') {
      const gs = 25 * s;
      ctx.strokeStyle = '#dde3ea';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    // Render each block
    for (const b of blocks) {
      const style = `${b.italic ? 'italic ' : ''}${b.bold ? 'bold ' : ''}${b.fontSize * s}px "${b.fontFamily}", cursive`;
      ctx.font  = style;
      ctx.fillStyle = b.color;

      const maxW = b.w * s;
      const words = b.text.split(' ');
      let line = '';
      const wrapped: string[] = [];
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxW && line) {
          wrapped.push(line); line = word;
        } else line = test;
      }
      if (line) wrapped.push(line);

      wrapped.forEach((wl, i) => {
        const y = (b.y + b.fontSize * (i + 1)) * s;
        const x = b.x * s;
        const lineW = ctx.measureText(wl).width;

        let dx = x;
        if (b.align === 'center') dx = x + (maxW - lineW) / 2;
        else if (b.align === 'right') dx = x + maxW - lineW;

        ctx.fillText(wl, dx, y, maxW);

        if (b.underline) {
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dx, y + 2); ctx.lineTo(dx + lineW, y + 2); ctx.stroke();
        }
      });
    }

    return canvas;
  };

  // ── Export handlers ───────────────────────────────────────────────────────────
  const handleExportPng = () => {
    const canvas = renderCanvas();
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qolyozma_${Date.now()}.png`;
    link.click();
  };

  const handleExportPdf = () => {
    const canvas = renderCanvas();
    const img = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
    pdf.save(`qolyozma_${Date.now()}.pdf`);
  };

  const handleExportDocx = async () => {
    const zip = new JSZip();
    const esc = (s: string) => s
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&apos;');

    const paras = blocks
      .sort((a, b) => a.y - b.y)
      .map(b => `
        <w:p>
          <w:pPr><w:jc w:val="${b.align === 'center' ? 'center' : b.align === 'right' ? 'right' : 'left'}"/></w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
              <w:sz w:val="${b.fontSize * 2}"/>
              ${b.bold ? '<w:b/>' : ''}
              ${b.italic ? '<w:i/>' : ''}
              ${b.underline ? '<w:u w:val="single"/>' : ''}
            </w:rPr>
            <w:t xml:space="preserve">${esc(b.text)}</w:t>
          </w:r>
        </w:p>`).join('');

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/markup-compatibility/2006"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.folder('_rels')?.file('.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.folder('word')?.file('document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1700" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `qolyozma_${Date.now()}.docx`;
    link.click();
  };

  const handlePrint = () => {
    const paper = paperRef.current;
    if (!paper) return;

    const fontUrl = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Marck+Script&family=Bad+Script&display=swap';
    const blocksHtml = blocks.sort((a,b) => a.y - b.y).map(b => `
      <div style="
        position:absolute;
        left:${b.x}px; top:${b.y}px; width:${b.w}px;
        font-family:'${b.fontFamily}',cursive;
        font-size:${b.fontSize}px;
        color:${b.color};
        font-weight:${b.bold?'bold':'normal'};
        font-style:${b.italic?'italic':'normal'};
        text-decoration:${b.underline?'underline':'none'};
        text-align:${b.align};
        white-space:pre-wrap;
        word-break:break-word;
        line-height:${lineH}px;
      ">${b.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}</div>
    `).join('');

    const bgStyle = (() => {
      if (paper === 'blank') return 'background:#fbfbfa;';
      if (paper === 'yellow') return `background:#fef9c3;background-image:repeating-linear-gradient(transparent,transparent ${lineH-1}px,#cab614 ${lineH-1}px,#cab614 ${lineH}px);background-position-y:${PAPER_MARGIN_T}px;`;
      if (paper === 'grid') return `background:#fff;background-image:repeating-linear-gradient(#dde3ea 0,#dde3ea 1px,transparent 1px,transparent 25px),repeating-linear-gradient(90deg,#dde3ea 0,#dde3ea 1px,transparent 1px,transparent 25px);`;
      return `background:#fff;background-image:repeating-linear-gradient(transparent,transparent ${lineH-1}px,#93c5fd ${lineH-1}px,#93c5fd ${lineH}px);background-position-y:${PAPER_MARGIN_T}px;`;
    })();

    const pw = window.open('', '_blank');
    if (!pw) { alert("Popup ruxsatini yoqing"); return; }
    pw.document.write(`<!DOCTYPE html><html><head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="${fontUrl}" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        @media print{
          @page{size:A4;margin:0}
          body{margin:0;padding:0}
          .no-print{display:none!important}
          .paper{box-shadow:none!important;border:none!important}
        }
        body{background:#e5e7eb;display:flex;flex-direction:column;align-items:center;padding:20px;font-family:sans-serif}
        .paper{
          ${bgStyle}
          width:${PAPER_W}px;min-height:${PAPER_H}px;position:relative;
          box-shadow:0 4px 24px rgba(0,0,0,.18);
        }
        ${(paper==='ruled'||paper==='yellow')
          ? `.paper::before{content:'';position:absolute;top:0;bottom:0;left:${PAPER_MARGIN_L}px;width:2px;background:#fca5a5;pointer-events:none;}`
          : ''}
        .btn{margin:12px 8px 0;padding:10px 22px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px}
        .btn:hover{background:#4338ca}
      </style>
    </head><body>
      <div class="no-print">
        <button class="btn" onclick="window.print()">🖨️ Chop etish / Print</button>
        <button class="btn" style="background:#6b7280" onclick="window.close()">✕ Yopish</button>
      </div>
      <div class="paper">${blocksHtml}</div>
    </body></html>`);
    pw.document.close();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const dk = theme === 'dark';
  const card = dk
    ? 'bg-slate-900/60 border-slate-800'
    : 'bg-white border-slate-200 shadow-sm';

  const paperScale = zoom;

  return (
    <div className="space-y-6 animate-slide-up" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-black font-display flex items-center gap-2 ${dk?'text-white':'text-slate-900'}`}>
            <PenTool className="w-5 h-5 text-indigo-500 animate-pulse" />
            {t.title}
          </h2>
          <p className={`text-xs mt-0.5 ${dk?'text-slate-400':'text-slate-500'}`}>{t.sub}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${dk?'bg-emerald-950/30 text-emerald-400 border-emerald-800/40':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          <RefreshCw className="w-3 h-3 animate-spin" />
          100% Offline
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── Left panel ── */}
        <div className="xl:col-span-3 space-y-4">

          {/* File upload */}
          <div className={`rounded-2xl border p-4 ${card}`}>
            <p className={`text-[11px] font-black font-mono uppercase tracking-widest mb-3 flex items-center gap-1.5 ${dk?'text-slate-400':'text-slate-500'}`}>
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              {t.upload}
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${dk?'border-slate-700 hover:border-indigo-600 bg-slate-900/40 hover:bg-slate-900':'border-slate-200 hover:border-indigo-400 bg-slate-50'}`}
            >
              <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto mb-1.5" />
              <p className={`text-xs font-semibold ${dk?'text-slate-300':'text-slate-600'}`}>
                {uploading ? t.reading : t.dropzone}
              </p>
              <span className={`text-[10px] ${dk?'text-slate-500':'text-slate-400'}`}>Max 10 MB</span>
            </div>
            {upMsg && (
              <div className={`mt-2 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold border ${upMsg.type==='ok'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                <span>{upMsg.text}</span>
                <button onClick={() => setUpMsg(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
            <p className={`text-[11px] font-black font-mono uppercase tracking-widest flex items-center gap-1.5 ${dk?'text-slate-400':'text-slate-500'}`}>
              <Layers className="w-4 h-4 text-indigo-500" />
              {t.paper}
            </p>

            {/* Paper type */}
            <div className="grid grid-cols-2 gap-1.5">
              {([
                ['ruled', t.paperRuled], ['grid', t.paperGrid],
                ['blank', t.paperBlank], ['yellow', t.paperYellow],
              ] as [PaperType, string][]).map(([id, label]) => (
                <button key={id} onClick={() => setPaper(id)}
                  className={`py-1.5 px-2 text-[11px] font-semibold border rounded-xl transition cursor-pointer text-center ${
                    paper === id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : dk ? 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-900/40'
                           : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Font */}
            <div>
              <label className={`text-[10px] font-bold font-mono uppercase block mb-1.5 ${dk?'text-slate-500':'text-slate-400'}`}>{t.font}</label>
              <div className="flex flex-col gap-1.5">
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => { setFont(f.id); applyToActive({ fontFamily: f.id }); }}
                    className={`py-1.5 px-3 text-[11px] font-semibold border rounded-xl transition cursor-pointer text-left ${
                      font === f.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : dk ? 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white bg-slate-900/40'
                             : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white'
                    }`}
                    style={{ fontFamily: `"${f.id}", cursive` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pen color */}
            <div>
              <label className={`text-[10px] font-bold font-mono uppercase block mb-1.5 ${dk?'text-slate-500':'text-slate-400'}`}>{t.penColor}</label>
              <div className="flex gap-2 flex-wrap">
                {PEN_COLORS.map(c => (
                  <button key={c.hex}
                    onClick={() => { setColor(c.hex); applyToActive({ color: c.hex }); }}
                    title={c.label}
                    className={`w-8 h-8 rounded-xl border-2 transition cursor-pointer ${c.bg} ${color === c.hex ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className={`text-[10px] font-bold font-mono uppercase flex justify-between ${dk?'text-slate-500':'text-slate-400'}`}>
                <span>{t.fontSize}</span>
                <span className="text-indigo-400">{fSize}px</span>
              </label>
              <input type="range" min={12} max={36} value={fSize}
                onChange={e => { const v = +e.target.value; setFSize(v); applyToActive({ fontSize: v }); }}
                className="w-full mt-1.5 accent-indigo-500 cursor-col-resize" />
            </div>

            {/* Line spacing */}
            <div>
              <label className={`text-[10px] font-bold font-mono uppercase flex justify-between ${dk?'text-slate-500':'text-slate-400'}`}>
                <span>{currentLang === 'uz' ? 'Qator oralig\'i' : currentLang === 'ru' ? 'Интервал строк' : 'Line spacing'}</span>
                <span className="text-indigo-400">{lineH}px</span>
              </label>
              <input type="range" min={28} max={56} value={lineH}
                onChange={e => setLineH(+e.target.value)}
                className="w-full mt-1.5 accent-indigo-500 cursor-col-resize" />
            </div>
          </div>

          {/* Clear all */}
          <button
            onClick={() => { setBlocks([]); setActiveId(null); }}
            className={`w-full py-2 text-xs font-bold border rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              dk ? 'border-rose-800/50 text-rose-400 hover:bg-rose-950/30' : 'border-rose-200 text-rose-500 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.clearAll}
          </button>
        </div>

        {/* ── Paper area ── */}
        <div className="xl:col-span-6 flex flex-col gap-4">

          {/* Toolbar */}
          <div className={`rounded-2xl border p-2.5 flex flex-wrap items-center gap-1.5 ${card}`}>
            {/* Bold / Italic / Underline */}
            {([
              ['bold',       bold,   setBold,   <Bold  className="w-3.5 h-3.5" />],
              ['italic',     italic, setItalic, <Italic className="w-3.5 h-3.5" />],
              ['underline',  uline,  setUline,  <Underline className="w-3.5 h-3.5" />],
            ] as [string, boolean, (v: boolean) => void, React.ReactNode][]).map(([key, val, setter, icon]) => (
              <button key={key}
                onClick={() => { setter(!val); applyToActive({ [key]: !val } as any); }}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : dk ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {icon}
              </button>
            ))}

            <div className={`w-px h-6 ${dk?'bg-slate-700':'bg-slate-200'} mx-1`} />

            {/* Align */}
            {([
              ['left', <AlignLeft className="w-3.5 h-3.5" />],
              ['center', <AlignCenter className="w-3.5 h-3.5" />],
              ['right', <AlignRight className="w-3.5 h-3.5" />],
            ] as ['left'|'center'|'right', React.ReactNode][]).map(([a, icon]) => (
              <button key={a}
                onClick={() => { setAlign(a); applyToActive({ align: a }); }}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  align === a
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : dk ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {icon}
              </button>
            ))}

            <div className={`w-px h-6 ${dk?'bg-slate-700':'bg-slate-200'} mx-1`} />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className={`p-2 rounded-lg border cursor-pointer ${dk?'border-slate-700 text-slate-400 hover:text-white':'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[11px] font-mono font-bold w-10 text-center ${dk?'text-slate-300':'text-slate-600'}`}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className={`p-2 rounded-lg border cursor-pointer ${dk?'border-slate-700 text-slate-400 hover:text-white':'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {/* Delete active block */}
            {activeId && (
              <button onClick={() => deleteBlock(activeId!)}
                className="p-2 rounded-lg border border-rose-800/50 text-rose-400 hover:bg-rose-950/30 cursor-pointer transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Paper scroll viewport */}
          <div className={`rounded-2xl border overflow-auto ${card}`}
            style={{ maxHeight: '74vh', background: dk ? '#0f172a' : '#f1f5f9' }}>

            <div className="flex items-start justify-center py-5 px-4">
              <div
                ref={paperRef}
                onClick={handlePaperClick}
                style={{
                  ...paperBgStyle(paper, lineH),
                  width: PAPER_W,
                  minHeight: PAPER_H,
                  position: 'relative',
                  transform: `scale(${paperScale})`,
                  transformOrigin: 'top center',
                  cursor: 'crosshair',
                  flexShrink: 0,
                  boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                  userSelect: 'none',
                }}
              >
                {/* Red margin line for ruled/yellow */}
                {(paper === 'ruled' || paper === 'yellow') && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: PAPER_MARGIN_L, width: 2,
                    background: '#fca5a5', pointerEvents: 'none',
                  }} />
                )}

                {/* Hint when empty */}
                {blocks.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '45%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    color: '#94a3b8',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    width: 280,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
                    <div style={{ fontWeight: 600 }}>{t.clickHint}</div>
                  </div>
                )}

                {/* Text blocks */}
                {blocks.map(b => (
                  <TextBlockNode
                    key={b.id}
                    block={b}
                    isActive={activeId === b.id}
                    isDragging={dragState?.id === b.id}
                    lineH={lineH}
                    onSelect={() => setActiveId(b.id)}
                    onDragStart={e => startDrag(e, b.id)}
                    onTextChange={text => updateBlockText(b.id, text)}
                    onDelete={() => deleteBlock(b.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hint */}
          <p className={`text-center text-[11px] ${dk?'text-slate-600':'text-slate-400'}`}>
            {currentLang==='uz'
              ? "Bosib matn yozing • Sarlavhani sudrab joyini o'zgartiring • Ustiga bosib tahrirlang"
              : currentLang==='ru'
              ? "Кликните для добавления текста • Перетащите за заголовок • Кликните для редактирования"
              : "Click to add text • Drag header to reposition • Click to edit"}
          </p>
        </div>

        {/* ── Right export panel ── */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
            <p className={`text-[11px] font-black font-mono uppercase tracking-widest mb-1 ${dk?'text-slate-400':'text-slate-500'}`}>
              {currentLang==='uz'
                ? 'Eksport va Chop Etish'
                : currentLang==='ru' ? 'Экспорт и Печать' : 'Export & Print'}
            </p>

            <button onClick={handlePrint}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 text-white cursor-pointer transition shadow">
              <Printer className="w-4 h-4" />
              {t.print}
            </button>

            <button onClick={handleExportPdf}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 text-white cursor-pointer transition shadow-lg shadow-rose-500/20">
              <FileDown className="w-4 h-4" />
              {t.exportPdf}
            </button>

            <button onClick={handleExportPng}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 text-white cursor-pointer transition shadow-lg shadow-purple-500/20">
              <Download className="w-4 h-4" />
              {t.exportPng}
            </button>

            <button onClick={handleExportDocx}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 text-white cursor-pointer transition shadow-lg shadow-blue-500/20">
              <FileDown className="w-4 h-4" />
              {t.exportDocx}
            </button>
          </div>

          {/* Block count info */}
          {blocks.length > 0 && (
            <div className={`rounded-2xl border p-4 text-center ${card}`}>
              <div className={`text-3xl font-black ${dk?'text-white':'text-slate-900'}`}>{blocks.length}</div>
              <div className={`text-xs mt-0.5 ${dk?'text-slate-400':'text-slate-500'}`}>
                {currentLang==='uz' ? 'matn blok' : currentLang==='ru' ? 'текстовых блоков' : 'text blocks'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Privacy notice */}
      <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${dk?'bg-slate-950/20 border-slate-800 text-slate-500':'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <span>{t.privacy}</span>
      </div>

      {/* Invisible font preloader */}
      <div style={{ position:'absolute', opacity:0, pointerEvents:'none', width:1, height:1, overflow:'hidden' }}>
        <span style={{ fontFamily:'"Caveat"' }}>ўғқҳ ЎҒҚҲ qolyozma</span>
        <span style={{ fontFamily:'"Marck Script"' }}>ўғқҳ ЎҒҚҲ qolyozma</span>
        <span style={{ fontFamily:'"Bad Script"' }}>ўғқҳ ЎҒҚҲ qolyozma</span>
      </div>
    </div>
  );
}

// ─── TextBlock Node ────────────────────────────────────────────────────────────

interface TBNodeProps {
  block: TextBlock;
  isActive: boolean;
  isDragging: boolean;
  lineH: number;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onTextChange: (t: string) => void;
  onDelete: () => void;
}

const TextBlockNode: React.FC<TBNodeProps> = function TextBlockNode({ block: b, isActive, isDragging, lineH, onSelect, onDragStart, onTextChange, onDelete }) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive && taRef.current) {
      taRef.current.focus();
    }
  }, [isActive]);

  const textStyle: React.CSSProperties = {
    fontFamily: `"${b.fontFamily}", cursive`,
    fontSize: b.fontSize,
    color: b.color,
    fontWeight: b.bold ? 'bold' : 'normal',
    fontStyle: b.italic ? 'italic' : 'normal',
    textDecoration: b.underline ? 'underline' : 'none',
    textAlign: b.align,
    lineHeight: `${lineH}px`,
  };

  return (
    <div
      data-block-id={b.id}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      style={{
        position: 'absolute',
        left: b.x,
        top: b.y,
        width: b.w,
        zIndex: isActive ? 20 : 10,
        outline: isActive ? '2px solid #6366f1' : isDragging ? '2px dashed #6366f1' : '1px dashed transparent',
        borderRadius: 4,
      }}
    >
      {/* Drag handle */}
      {isActive && (
        <div
          onMouseDown={onDragStart}
          style={{
            position: 'absolute',
            top: -22,
            left: 0,
            right: 0,
            height: 20,
            background: '#4f46e5',
            borderRadius: '4px 4px 0 0',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 6,
            fontSize: 10,
            color: '#fff',
            fontFamily: 'sans-serif',
            userSelect: 'none',
          }}
        >
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Move style={{ width:12, height:12 }} />
            {b.fontFamily}
          </span>
          <button
            onMouseDown={e => { e.stopPropagation(); onDelete(); }}
            style={{ background:'transparent', border:'none', color:'#fca5a5', cursor:'pointer', padding:'2px 4px', borderRadius:3, lineHeight:1 }}
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        ref={taRef}
        value={b.text}
        onChange={e => onTextChange(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        rows={Math.max(1, Math.ceil(b.text.length / 40) + 1)}
        style={{
          ...textStyle,
          width: '100%',
          background: 'transparent',
          border: 'none',
          resize: 'none',
          outline: 'none',
          overflow: 'hidden',
          display: 'block',
        }}
        placeholder={isActive ? '...' : ''}
      />
    </div>
  );
}

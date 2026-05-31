/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, ArrowDownToLine, Sparkles, PenTool, HelpCircle, Download, 
  ZoomIn, ZoomOut, RefreshCw, FileDown, Sliders, AlertCircle, UploadCloud, Check, X
} from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

interface OpenSourceLabsProps {
  currentLang?: 'uz' | 'ru' | 'en';
  theme?: 'light' | 'dark';
  sharedHandwriteText?: string;
  clearSharedHandwriteText?: () => void;
}

// Translations specific to Handwriting Studio
const LAB_TRANSLATIONS = {
  uz: {
    title: "Qo'lyozma Studiyasi (Handwrite)",
    subtitle: "Oddiy matn, Word (.docx) va .txt hujjatlarini insoniy qo'lyozmaga o'tkazish tizimi",
    privateBadge: "Off-Grid (100% Offline & Xavfsiz)",
    
    // Handwrite
    hwTitle: "Hujjatlarni Qo'lyozmaga O'tkazish",
    hwDesc: "Kiritilgan rasmiy matnlarni chiroyli, tushunarli qo'lyozmaga aylantiring. Haqiqiy maktab daftari, katakli varaqlar yoki sariq bloknot andozalarida.",
    hwInputLabel: "Daftarga tushiriladigan matn (Tahrirlash mumkin)",
    hwSheetPreview: "Qo'lyozma Varaqi (A4)",
    hwSettings: "Ruchka va Daftar Sozlamalari",
    hwFontFamily: "Yozuv Shrifti / Poçerk",
    hwPaperType: "Daftar / Qog'oz turi",
    hwPaperRuled: "Chiziqli Daftar (Notebook)",
    hwPaperGrid: "Katakli Matematika (Graph)",
    hwPaperBlank: "Oq Qog'oz (Premium Blank)",
    hwPaperLegal: "Sariq Daftarcha (Legal Yellow)",
    hwPenColor: "Gel Ruchka Rangi",
    hwPenBlue: "Moviy Ko'k",
    hwPenRoyalBlue: "To'q Qirollik Ko'k",
    hwPenBlack: "Qora Ko'mir",
    hwPenRed: "Qizil Ruchka",
    hwFontSize: "Yozuv O'lchami",
    hwJitter: "Insoniy Tebranish (Jitter)",
    hwLineSpacing: "Qator Oralig'i",
    hwExportJpg: "Rasm Sifatida Yuklash (PNG)",
    
    // File upload
    hwUploadTitle: "Word (.docx), PDF yoki Matn (.txt) Faylini Yuklash",
    hwUploadDropzone: "Word (.docx), PDF yoki oddiy matn (.txt) faylini bu yerga tashlang yoki bosing",
    hwUploadError: "Hujjatni o'qishda xatolik yuz berdi. Faqat .docx, .pdf va .txt formatlari qo'llab-quvvatlanadi.",
    hwUploadSuccess: "Hujjat matni muvaffaqiyatli o'qildi va daftar sahifasiga o'tkazildi!",
    hwUploadReading: "Fayl tahlil qilinmoqda...",
    
    laNotice: "Ushbu qo'lyozma generatori to'liq offline rejimda ishlaydi va barcha amallar faqat kompyuteringiz ichida bajariladi. Qo'lyozmalaringiz, shablon va fayllaringiz ochiq internet tarmoqlariga yuklanmaydi va mutlaqo maxfiy qoladi."
  },
  ru: {
    title: "Студия Почерка (Handwrite)",
    subtitle: "Система перевода печатного текста, файлов Word (.docx) и .txt в реалистичный рукописный вид",
    privateBadge: "Off-Grid (100% Offline & Безопасно)",
    
    // Handwrite
    hwTitle: "Перевод Документов в Рукопись",
    hwDesc: "Превращайте набранный текст или импортированные файлы в реалистичный рукописный вид на симуляции различных тетрадей и бланков.",
    hwInputLabel: "Текст для переноса в тетрадь (можно редактировать)",
    hwSheetPreview: "Рукописный Лист (A4)",
    hwSettings: "Настройки письма",
    hwFontFamily: "Рукописный Шрифт",
    hwPaperType: "Тип бумаги",
    hwPaperRuled: "Тетрадь в линейку (Ruled)",
    hwPaperGrid: "Тетрадь в клетку (Graph)",
    hwPaperBlank: "Чистый белый лист (Blank)",
    hwPaperLegal: "Желтый блокнот (Yellow Legal)",
    hwPenColor: "Цвет чернил",
    hwPenBlue: "Синяя паста",
    hwPenRoyalBlue: "Королевский синий",
    hwPenBlack: "Угольно-черный",
    hwPenRed: "Красная паста",
    hwFontSize: "Размер симуляции",
    hwJitter: "Эффект дрожания руки (Jitter)",
    hwLineSpacing: "Межстрочный интервал",
    hwExportJpg: "Скачать как изображение (PNG)",
    
    // File upload
    hwUploadTitle: "Загрузить Word (.docx), PDF или Текст (.txt)",
    hwUploadDropzone: "Перетащите файл Word (.docx), PDF или .txt сюда или нажмите для выбора",
    hwUploadError: "Ошибка при чтении документа. Поддерживаются только форматы .docx, .pdf и .txt.",
    hwUploadSuccess: "Текст документа успешно импортирован на страницу тетради!",
    hwUploadReading: "Чтение файла...",
    
    laNotice: "Этот генератор рукописного текста работает полностью локально внутри вашего браузера. Hикакие данные, черновики или загруженные файлы не покидают ваше устройство и остаются строго конфиденциальными."
  },
  en: {
    title: "Handwriting Studio",
    subtitle: "Convert typed text, Word documents (.docx), plain text (.txt), or PDF into realistic handwriting templates",
    privateBadge: "Off-Grid (100% Offline & Reliable)",
    
    // Handwrite
    hwTitle: "Convert Documents to Handwritten Style",
    hwDesc: "Convert virtual transcripts, letters, and templates into organic, realistic handwriting with custom spacing, ruling styles, and fluid pen inks.",
    hwInputLabel: "Text to write in notebook (Editable)",
    hwSheetPreview: "Handwritten Page (A4)",
    hwSettings: "Writing Parameters",
    hwFontFamily: "Handwriting Font",
    hwPaperType: "Paper Type",
    hwPaperRuled: "Ruled Notebook Paper",
    hwPaperGrid: "Grid Mathematics Paper",
    hwPaperBlank: "Premium Blank Leaf",
    hwPaperLegal: "Yellow Legal Page",
    hwPenColor: "Gel Pen Color",
    hwPenBlue: "Water Gel Blue",
    hwPenRoyalBlue: "Royal Vault Blue",
    hwPenBlack: "Charcoal Black",
    hwPenRed: "Red Marking Pen",
    hwFontSize: "Font Size Scale",
    hwJitter: "Hand Jitter Factor",
    hwLineSpacing: "Line Height Spacing",
    hwExportJpg: "Download as Image (PNG)",
    
    // File upload
    hwUploadTitle: "Upload Word (.docx), PDF, or Text (.txt)",
    hwUploadDropzone: "Drop Word document (.docx), PDF, or plain text (.txt) here or click to import",
    hwUploadError: "Error parsing file. Only standard, non-password .docx, .pdf, and .txt files are supported.",
    hwUploadSuccess: "Document content compiled successfully into handwriting sandbox!",
    hwUploadReading: "Compiling document...",
    
    laNotice: "This handwriting generator executes robustly offline inside the local sandbox. Your private files, writing outcomes, and templates are protected and never cross the network."
  }
};

export default function OpenSourceLabs({ 
  currentLang = 'uz', 
  theme = 'dark',
  sharedHandwriteText = '',
  clearSharedHandwriteText
}: OpenSourceLabsProps) {
  const t = LAB_TRANSLATIONS[currentLang] || LAB_TRANSLATIONS.uz;

  // --- HANDWRITE DATA & CONFIG STATE ---
  const [hwText, setHwText] = useState('Salom! Bu insoniy qo\'lyozma simulyatori va studiyasidir.\nMen ushbu yozilgan matnlarni shunchaki kompyuter shriftida emas, balki xuddi haqiqiy daftar varag\'ida oobiydiy chiziqli, matematika kataklarida yoki rasmiy va oq varaqda yozilgan insoniy qo\'lyozmaga aylantira olaman!\n\nHattoki kompyuterdan tayyor Word (.docx) yoki matnli (.txt) hujjat yuklasangiz ham, men uni o\'qib avtomatik ravishda chiroyli daftarga tushirib beraman!\n\nYozuvning chekka chizig\'ini (margin), harflar tebranishi va jitterini boshqaring hamda tayyor natijani bitta tugma orqali rasm qilib yuklab oling.\n\nSana: ' + new Date().toLocaleDateString() + '\nImzo: ________________');
  const [hwFont, setHwFont] = useState<'Caveat' | 'Marck Script' | 'Bad Script'>('Caveat');
  const [hwPaper, setHwPaper] = useState<'ruled' | 'grid' | 'blank' | 'yellow'>('ruled');
  const [hwPen, setHwPen] = useState<'#2563eb' | '#1e3a8a' | '#111827' | '#dc2626'>('#2563eb');
  const [hwSize, setHwSize] = useState<number>(20);
  const [hwJitterValue, setHwJitterValue] = useState<number>(1);
  const [hwLineSpace, setHwLineSpace] = useState<number>(28);
  const [hwZoom, setHwZoom] = useState<number>(1.0);
  
  // File upload state for DOCX/.txt handler
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvas sheet when params change
  useEffect(() => {
    drawHandwriteSheet();
  }, [hwText, hwFont, hwPaper, hwPen, hwSize, hwJitterValue, hwLineSpace]);

  // Keep re-drawing the canvas as fonts load dynamically in the browser
  useEffect(() => {
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        drawHandwriteSheet();
      });
    }
  }, [hwText, hwFont]);

  // Listen to shared handwrite updates
  useEffect(() => {
    if (sharedHandwriteText) {
      setHwText(sharedHandwriteText);
      if (clearSharedHandwriteText) {
        clearSharedHandwriteText();
      }
    }
  }, [sharedHandwriteText, clearSharedHandwriteText]);

  // --- FILE PARSERS (DOCX, PDF AND TXT) ---
  const parseDocxFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file("word/document.xml")?.async("text");
      if (!docXml) {
        throw new Error("Invalid format");
      }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXml, "text/xml");
      const paragraphs = xmlDoc.getElementsByTagName("w:p");
      const lines: string[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const textElements = p.getElementsByTagName("w:t");
        let pText = "";
        for (let j = 0; j < textElements.length; j++) {
          pText += textElements[j].textContent || "";
        }
        lines.push(pText);
      }
      return lines.join("\n").trim();
    } catch (err) {
      throw new Error(t.hwUploadError);
    }
  };

  const parsePdfFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      let extractedText = "";

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const contentStream = (page as any).node.Contents();
        if (contentStream) {
          const streamData = contentStream.decode();
          const textDecoder = new TextDecoder('utf-8');
          const decodedStr = textDecoder.decode(streamData);
          
          const tjRegex = /\(([^)]+)\)\s*Tj/g;
          let match;
          let pageText = "";
          while ((match = tjRegex.exec(decodedStr)) !== null) {
            pageText += match[1] + " ";
          }
          
          if (!pageText.trim()) {
            const tjComplexRegex = /\[([^\]]+)\]\s*TJ/g;
            while ((match = tjComplexRegex.exec(decodedStr)) !== null) {
              const innerParentheses = /\(([^)]+)\)/g;
              let innerMatch;
              while ((innerMatch = innerParentheses.exec(match[1])) !== null) {
                pageText += innerMatch[1] + " ";
              }
            }
          }

          pageText = pageText
            .replace(/\\r/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\( /g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\/g, '');

          if (pageText.trim()) {
            extractedText += pageText + "\n\n";
          }
        }
      }

      if (!extractedText.trim()) {
        const textDecoder = new TextDecoder('utf-8');
        const rawText = textDecoder.decode(arrayBuffer);
        const chunks: string[] = [];
        const parenthesizedRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
        let m;
        while ((m = parenthesizedRegex.exec(rawText)) !== null && chunks.length < 350) {
          if (m[1].length > 1 && !m[1].includes('/') && !m[1].includes('\\')) {
            chunks.push(m[1]);
          }
        }
        extractedText = chunks.join(' ');
      }

      return extractedText.trim() || (currentLang === 'uz' ? "PDF hujjati matni o'qib bo'lmadi yoki u skanerlangan rasm formatida. Quyida yozib davom ettirishingiz mumkin." : "Не удалось извлечь текст из PDF. Вы можете ввести его вручную ниже.");
    } catch (err) {
      throw new Error(currentLang === 'uz' ? "PDF faylni tahlil qilishda xatolik" : "Ошибка парсинга PDF документа");
    }
  };

  const readTxtFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || "");
      };
      reader.onerror = () => reject(new Error("TXT error"));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let extractedText = "";
      if (ext === 'docx') {
        extractedText = await parseDocxFile(file);
      } else if (ext === 'pdf') {
        extractedText = await parsePdfFile(file);
      } else if (ext === 'txt') {
        extractedText = await readTxtFile(file);
      } else {
        throw new Error(currentLang === 'uz' ? "Faqat Word (.docx), PDF va matn (.txt) fayllari qo'llab-quvvatlanadi" : currentLang === 'ru' ? "Поддерживаются только Word (.docx), PDF и текст (.txt)" : "Only Word (.docx), PDF and plain text (.txt) files are supported");
      }

      if (!extractedText.trim()) {
        throw new Error(currentLang === 'uz' ? "Hujjat bo'sh yoki undan matn topilmadi" : currentLang === 'ru' ? "Документ пуст или текст не обнаружен" : "Parsed document has empty content");
      }

      setHwText(extractedText);
      setUploadSuccess(t.hwUploadSuccess);
    } catch (err: any) {
      setUploadError(err.message || t.hwUploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // --- HANDWRITE EXPORTERS ---
  const handleExportPdf = () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save(`qolyozma_${Date.now()}.pdf`);
  };

  const handleExportDocx = async () => {
    try {
      const zip = new JSZip();
      zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

      zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

      const escapeXml = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const paragraphsXml = hwText.split('\n').map(p => `
        <w:p>
          <w:pPr>
            <w:jc w:val="left"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
              <w:sz w:val="24"/>
            </w:rPr>
            <w:t>${escapeXml(p)}</w:t>
          </w:r>
        </w:p>`).join('');

      zip.folder("word")?.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `qolyozma_matni_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Docx generation error", err);
    }
  };

  // --- CANVAS GENERATOR ENGINE ---
  const drawHandwriteSheet = () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set A4 Aspect ratio dimensions (High resolution 800 x 1120 pixels)
    canvas.width = 800;
    canvas.height = 1120;

    // 1. Draw Paper Colors
    if (hwPaper === 'yellow') {
      ctx.fillStyle = '#fef08a'; // Pastel yellow legal pad
    } else if (hwPaper === 'blank') {
      ctx.fillStyle = '#fbfbfa'; // Off-white parchment
    } else {
      ctx.fillStyle = '#ffffff'; // Classic notebook white
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Geometry configuration for rulings
    const topMargin = 95;
    const bottomMargin = 40;
    const leftMargin = 95;

    if (hwPaper === 'ruled' || hwPaper === 'yellow') {
      // Draw notebook horizontal ruled lines
      ctx.strokeStyle = '#93c5fd'; // Soft notebook blue
      ctx.lineWidth = 1;
      for (let y = topMargin; y < canvas.height - bottomMargin; y += hwLineSpace) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Left-margin red vertical anchor line
      ctx.strokeStyle = '#fca5a5'; // Left sidebar red line
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftMargin, 0);
      ctx.lineTo(leftMargin, canvas.height);
      ctx.stroke();
    } else if (hwPaper === 'grid') {
      // Katakli Daftar (Grid mathematics blocks)
      ctx.strokeStyle = '#e2e8f0'; // Very soft grid slate
      ctx.lineWidth = 0.8;
      const gridSize = 25;
      
      // Vertical grid columns
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // Horizontal grid rows
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw red margin lines on grid paper
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gridSize * 3, 0);
      ctx.lineTo(gridSize * 3, canvas.height);
      ctx.stroke();
    }

    // 3. Draw authentic handwriting text
    ctx.fillStyle = hwPen;
    ctx.font = `${hwSize}px "${hwFont}", cursive`;
    
    const lines = hwText.split('\n');
    let currentY = topMargin + hwLineSpace * 0.7; // Vertical offset cursor
    const maxTextWidth = canvas.width - leftMargin - 55;

    lines.forEach((line) => {
      // Respect paper bounds limit
      if (currentY > canvas.height - bottomMargin) return;

      // Smart responsive word wrapping limits
      const words = line.split(' ');
      let currentLineText = '';
      const wrappedLines: string[] = [];

      words.forEach((word) => {
        const testLine = currentLineText + (currentLineText ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLineText) {
          wrappedLines.push(currentLineText);
          currentLineText = word;
        } else {
          currentLineText = testLine;
        }
      });
      if (currentLineText) {
        wrappedLines.push(currentLineText);
      }

      // Draw character paths with organic, simulated jitter transitions
      wrappedLines.forEach((subline) => {
        if (currentY > canvas.height - bottomMargin) return;

        ctx.save();
        
        // Random tilts for simulated natural human flow
        const tiltAngle = (Math.random() * 0.012 - 0.006) * hwJitterValue;
        const xOffset = leftMargin + 12 + (Math.random() * 3 - 1.5) * hwJitterValue;
        const yOffset = currentY + (Math.random() * 2.5 - 1.25) * hwJitterValue;

        ctx.translate(xOffset, yOffset);
        ctx.rotate(tiltAngle);

        // Render letters individually with micro jitter to emulate standard real cursive
        let cursorX = 0;
        const letters = subline.split('');
        
        letters.forEach((char) => {
          const charTilt = (Math.random() * 0.05 - 0.025) * hwJitterValue;
          const charYOffset = (Math.random() * 1.5 - 0.75) * hwJitterValue;
          
          ctx.save();
          ctx.translate(cursorX, charYOffset);
          ctx.rotate(charTilt);
          ctx.fillText(char, 0, 0);
          ctx.restore();

          cursorX += ctx.measureText(char).width;
        });

        ctx.restore();
        
        // Advance lines
        currentY += hwPaper === 'grid' ? 25 : hwLineSpace;
      });
    });
  };

  const handleExportHandwriteJpg = () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qolyozma_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Brand Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2.5 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <PenTool className="w-6 h-6 text-indigo-500 animate-pulse" />
            {t.title}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-550'}`}>
            {t.subtitle}
          </p>
        </div>

        <div className={`px-4 py-2 flex items-center gap-2 rounded-2xl border text-xs font-bold font-mono ${
          theme === 'dark' ? 'bg-indigo-950/20 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
        }`}>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          {t.privateBadge}
        </div>
      </div>

      {/* Main Double Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
        
        {/* Left Column Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Word / TXT File Dragger Importer */}
          <div className={`p-6 rounded-3xl border transition ${
            theme === 'dark' ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-black font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5/2">
                <UploadCloud className="w-4.5 h-4.5 text-indigo-500" />
                {t.hwUploadTitle}
              </span>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition group relative ${
                theme === 'dark' 
                  ? 'border-slate-800 hover:border-slate-600 bg-slate-900/10 hover:bg-slate-900/20' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".docx,.pdf,.txt"
              />
              <UploadCloud className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition mx-auto mb-2" />
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {isUploading ? t.hwUploadReading : t.hwUploadDropzone}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Max size: 10MB. 100% offline document translation.
              </span>
            </div>

            {/* Upload notifications */}
            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-400 text-xs flex items-center justify-between gap-1">
                <span className="font-semibold">{uploadError}</span>
                <button onClick={() => setUploadError('')} className="p-0.5 hover:bg-rose-500/10 rounded-lg cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs flex items-center justify-between gap-1">
                <span className="font-semibold">{uploadSuccess}</span>
                <button onClick={() => setUploadSuccess('')} className="p-0.5 hover:bg-emerald-500/10 rounded-lg cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Styling configuration controls */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2.5 mb-4">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <h3 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t.hwSettings}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Font chooser */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 font-mono block mb-2 uppercase">{t.hwFontFamily}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Caveat', name: 'Caveat (Lotin & Kirill)' },
                    { id: 'Marck Script', name: 'Marck Script (Nozik)' },
                    { id: 'Bad Script', name: 'Bad Script (Tabiiy Cursive)' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHwFont(f.id as any)}
                      className={`p-2.5 text-[11px] font-bold border rounded-xl leading-tight transition cursor-pointer flex items-center justify-center text-center ${
                        hwFont === f.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : theme === 'dark' 
                            ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white' 
                            : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper Background Style chooser */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 font-mono block mb-2 uppercase">{t.hwPaperType}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ruled', name: t.hwPaperRuled },
                    { id: 'grid', name: t.hwPaperGrid },
                    { id: 'blank', name: t.hwPaperBlank },
                    { id: 'yellow', name: t.hwPaperLegal }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setHwPaper(p.id as any)}
                      className={`p-2 text-xs font-bold border rounded-xl transition cursor-pointer ${
                        hwPaper === p.id
                          ? 'bg-indigo-650 text-white border-indigo-650 shadow'
                          : theme === 'dark'
                            ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inks colors chooser */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 font-mono block mb-2 uppercase">{t.hwPenColor}</label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { code: '#2563eb', label: t.hwPenBlue, bg: 'bg-blue-600' },
                    { code: '#1e3a8a', label: t.hwPenRoyalBlue, bg: 'bg-blue-900' },
                    { code: '#111827', label: t.hwPenBlack, bg: 'bg-slate-900' },
                    { code: '#dc2626', label: t.hwPenRed, bg: 'bg-red-600' }
                  ].map((color) => (
                    <button
                      key={color.code}
                      onClick={() => setHwPen(color.code as any)}
                      className={`px-3 py-2 flex items-center gap-2 text-xs font-bold border rounded-xl transition cursor-pointer hover:scale-102 ${
                        hwPen === color.code
                          ? 'border-indigo-505 bg-indigo-500/5 ring-1 ring-indigo-500/40'
                          : theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-400 text-slate-400/90' : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                      }`}
                      title={color.label}
                    >
                      <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                      <span className="text-[10px]">{color.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaling and adjustments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase">
                    {t.hwFontSize}: {hwSize}px
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={32}
                    value={hwSize}
                    onChange={(e) => setHwSize(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 mt-2 cursor-col-resize"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase">
                    {t.hwJitter}: {hwJitterValue}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={hwJitterValue}
                    onChange={(e) => setHwJitterValue(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 mt-2 cursor-col-resize"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase">
                  {t.hwLineSpacing}: {hwLineSpace}px
                </label>
                <input
                  type="range"
                  min={22}
                  max={48}
                  value={hwLineSpace}
                  onChange={(e) => setHwLineSpace(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 mt-2 cursor-col-resize"
                />
              </div>
            </div>
          </div>

          {/* 3. Text composition area */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <label className="text-xs font-bold text-slate-400 font-mono block mb-2 uppercase">{t.hwInputLabel}</label>
            <textarea
              rows={9}
              value={hwText}
              onChange={(e) => setHwText(e.target.value)}
              placeholder="Daftarga yoziladigan xatni yoki matnni kiritishingiz mumkin..."
              className={`w-full p-4 rounded-2xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Right Column virtual canvas viewport */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-3xl border flex flex-col items-center justify-between min-h-[580px] relative overflow-hidden ${
            theme === 'dark' ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            
            {/* Top row sheet visual settings */}
            <div className="w-full flex items-center justify-between border-b pb-4 border-slate-150 dark:border-slate-850">
              <span className="text-xs font-extrabold font-mono text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <PenTool className="w-4 h-4 text-indigo-500" />
                {t.hwSheetPreview}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHwZoom(prev => Math.max(0.6, prev - 0.1))}
                  className={`p-1.5 rounded-xl border cursor-pointer ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-150 text-slate-600 hover:text-slate-900'}`}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold font-mono px-1">{(hwZoom * 100).toFixed(0)}%</span>
                <button
                  onClick={() => setHwZoom(prev => Math.min(1.4, prev + 0.1))}
                  className={`p-1.5 rounded-xl border cursor-pointer ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-150 text-slate-600 hover:text-slate-900'}`}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* High resolution canvas container */}
            <div className="w-full py-4 flex items-center justify-center overflow-auto max-h-[510px]">
              <div 
                className="rounded-xl overflow-hidden shadow-2xl border transition-transform origin-center border-slate-300 dark:border-slate-800"
                style={{ transform: `scale(${hwZoom})` }}
              >
                <canvas 
                  ref={sheetCanvasRef}
                  className="max-w-full block bg-white"
                  style={{ width: '420px', height: '588px' }} // Interactive visual bounds, real high resolution handles printing!
                />
              </div>
            </div>

            {/* Downloader triggers */}
            <div className="w-full pt-4 border-t border-slate-200 dark:border-slate-850 space-y-3">
              <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block text-left">
                {currentLang === 'uz' ? "CHIQARISH VA UKLAB OLISH FORMATLARINI TANLANG:" : currentLang === 'ru' ? "ВЫБЕРИТЕ ФОРМАТ ПРИ ЭКСПОРТЕ:" : "SELECT EXPORT FORMAT FOR DOWNLOAD:"}
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. PDF Export */}
                <button
                  onClick={handleExportPdf}
                  className="py-3 px-2 bg-gradient-to-br from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white text-[11px] font-black rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition duration-200 active:scale-98"
                >
                  <FileDown className="w-4 h-4 text-white" />
                  <span>PDF HAQIQIY DAFTAR</span>
                </button>

                {/* 2. PNG Export */}
                <button
                  onClick={handleExportHandwriteJpg}
                  className="py-3 px-2 bg-gradient-to-br from-purple-500 to-indigo-650 hover:from-purple-600 hover:to-indigo-750 text-white text-[11px] font-black rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition duration-200 active:scale-98"
                >
                  <FileDown className="w-4 h-4 text-white" />
                  <span>PNG RASM FORMATI</span>
                </button>

                {/* 3. DOCX Export */}
                <button
                  onClick={handleExportDocx}
                  className="py-3 px-2 bg-gradient-to-br from-blue-500 to-cyan-650 hover:from-blue-600 hover:to-cyan-750 text-white text-[11px] font-black rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition duration-200 active:scale-98"
                >
                  <FileDown className="w-4 h-4 text-white" />
                  <span>WORD (.DOCX) MATN</span>
                </button>
              </div>

              <p className={`text-[10px] text-center italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentLang === 'uz' 
                  ? "Word shaklida yuklasangiz, kelgusida matnni o'zingiz xohlagancha o'zgartirishingiz mumkin." 
                  : currentLang === 'ru' 
                    ? "Скачивая в формате Word, вы всегда сможете свободно изменить текст позже." 
                    : "Downloading in Word format lets you customize and edit the text easily later."}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Security Info footer notice */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 mt-4 text-xs font-medium max-w-4xl mx-auto leading-relaxed ${
        theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200/80 text-slate-650'
      }`}>
        <AlertCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="font-sans text-left">
          {t.laNotice}
        </p>
      </div>

      {/* Invisible Cyrillic and Uzbek characters force preloader to ensure canvas drawing picks up handwriting woff2 subsets immediately */}
      <div 
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          pointerEvents: 'none', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        <span style={{ fontFamily: '"Caveat"' }}>ўғқҳ ЎҒҚҲ аёжзийклмнопрстуфхцчшщъыь</span>
        <span style={{ fontFamily: '"Marck Script"' }}>ўғқҳ ЎҒҚҲ аёжзийклмнопрстуфхцчшщъыь</span>
        <span style={{ fontFamily: '"Bad Script"' }}>ўғқҳ ЎҒҚҲ аёжзийклмнопрстуфхцчшщъыь</span>
      </div>

    </div>
  );
}

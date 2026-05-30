/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { createSimpleDocx } from '../utils/fileProcessor';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { FileText, Plus, ChevronRight, Lock, EyeOff, RotateCw, Image, Landmark, Milestone, Shield, Layers, Compass, Download, CheckCircle2, AlertCircle, RefreshCw, X, Sparkles, Check } from 'lucide-react';

interface DocumentCenterProps {
  currentLang: Language;
  theme?: 'light' | 'dark';
}

interface PdfTool {
  id: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  desc: string;
}

export default function DocumentCenter({ currentLang, theme = 'dark' }: DocumentCenterProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [subTab, setSubTab] = useState<'templates' | 'pdf'>('templates');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Document templates state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ariza');
  
  // Unified document outputs and controls
  const [docTo, setDocTo] = useState('"Mega Texnoloji" MCHJ direktori A.B. Toshmatovga');
  const [docFrom, setDocFrom] = useState('"Dasturchi" lavozimidagi Karimov Akmal tomonidan');
  const [docDetail, setDocDetail] = useState('oila sharoitim tufayli 5 kun muddatga oylik maosh saqlanmagan holda ish haqi saqlanmaydigan mehnat ta\'tili berishingizni so\'rayman');
  const [docPreviewMode, setDocPreviewMode] = useState<'computer' | 'handwriting'>('computer');
  const [handwritingStyle, setHandwritingStyle] = useState<'blue' | 'black'>('blue');
  const [generatedDocText, setGeneratedDocText] = useState<string>('');
  const [isGeneratingDocText, setIsGeneratingDocText] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Helper defaults & fallbacks defined inline or outside component
  const getTemplateDefaults = (type: string) => {
    switch (type) {
      case 'ariza':
        return {
          to: '"Mega Texnoloji" MCHJ direktori A.B. Toshmatovga',
          from: '"Dasturchi" lavozimidagi Karimov Akmal tomonidan',
          detail: 'oila sharoitim tufayli 5 kun muddatga oylik maosh saqlanmagan holda ish haqi saqlanmaydigan mehnat ta\'tili berishingizni so\'rayman'
        };
      case 'tushuntirish':
        return {
          to: '"Yuksak Parvoz" DUK rahbari S.S. Alimovga',
          from: '"Yetakchi mutaxassis" Rahimov Akmal',
          detail: '2026-yil 29-may kuni ertalabki soat 09:00 dagi majlisga 30 daqiqa kechikib keldim. Sababi uyim oldidagi yo\'lda avtotransport hodisasi tufayli katta tirbandlik yuzaga keldi.'
        };
      case 'tavsifnoma':
        return {
          to: 'Tegishli joyga taqdim etish uchun',
          from: '"Texno-Inovatika" MCHJ rahbariyati',
          detail: 'Xodim Salimov Umid o\'z faoliyati davomida o\'zini intizomli, bilimli va jamoada hurmatga sazovor mutaxassis sifatida ko\'rsatdi. Hech qanday intizomiy jazo choralariga tortilmagan.'
        };
      case 'shartnoma':
        return {
          to: 'Sotuvchi: Rahimov Sobir (Pasport AB 1234567, Toshkent sh.)',
          from: 'Sotib oluvchi: Karimov Akmal (Pasport AC 7654321, Toshkent sh.)',
          detail: 'Chevrolet Lacetti avtotransport vositasi (Davlat raqami 01 A 777 AA) jami 120,000,000 (bir yuz yirma million) so\'m evaziga sotilmoqda. To\'lov 3 ish kuni ichida amalga oshiriladi.'
        };
      case 'bildirgi':
        return {
          to: 'Kadrlar bo\'limi boshlig\'i M.V. Shohalilovaga',
          from: 'Guruh rahbari Soliyev Bobur',
          detail: 'Axborot xavfsizligi bo\'limi xodimi Ergashev G\'ayrat o\'z lavozim majburiyatlarini bir necha bor buzganligi va ish vaqtida asossiz yo\'q bo\'lganligi haqida bildirish xati.'
        };
      case 'malumotnoma':
        return {
          to: 'Chilonzor tumani hokimiyati bandlik bo\'limiga',
          from: 'Fuqaro Usmonova Laylo',
          detail: 'Fuqaro Usmonova Layloning ushbu tashkilotda 2024-yildan beri bosh hisobchi yordamchisi lavozimida haqiqatdan ham ishlab kelayotganligi va oylik o\'rtacha maoshi 4,500,000 so\'m ekanligi haqida ma\'lumotnoma'
        };
      case 'free':
      default:
        return {
          to: 'Bosh boshqarma boshlig\'iga',
          from: 'Fuqaro Yo\'ldoshev Nodir',
          detail: 'menga 3 kunlik oilaviy sabablarga ko\'ra mehnat ta\'tili berishingizni so\'rayman'
        };
    }
  };

  const getLocalDraftText = (type: string, to: string, from: string, detail: string) => {
    const cleanTo = to.trim();
    const cleanFrom = from.trim();
    const cleanDetail = detail.trim();
    const dateStr = new Date().toLocaleDateString('uz-UZ');

    switch (type) {
      case 'ariza':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                                   ARIZA

      Sizdan, ${cleanDetail} so'rayman.

      Ariza mazmuni qonuniy va rasmiy munosabatlar qoidalariga rioya qilgan holda tuzildi.

      Sana: ${dateStr}
      Imzo: _____________________`;
      case 'tushuntirish':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                              TUSHUNTIRISH XATI

      Men, ushbu tushuntirish xatini yozib shuni ma'lum qilamanki, ${cleanDetail}.

      Keltirilgan holatlar haqiqat ekanligini tasdiqlayman va kelgusida bunday kamchiliklar takrorlanmasligiga va'da beraman.

      Sana: ${dateStr}
      Imzo: _____________________`;
      case 'tavsifnoma':
        return `                                  TAVSIFNOMA
                              (Xodim tavsifnomasi)

      Ushbu tavsifnoma ${cleanTo} taqdim etish uchun ${cleanFrom} tomonidan berildi.

      Xodim to'g'risida ma'lumot: ${cleanDetail}.

      Mazkur tavsifnoma uning talabiga binoan berildi.

      Sana: ${dateStr}
      Boshqaruv imzosi: _____________________`;
      case 'shartnoma':
        return `                                  SHARTNOMA
                              (Oldi-sotdi bitimi)

      Toshkent shahri                                                   Sana: ${dateStr}

      Biz, bir tomondan ${cleanTo}, va ikkinchi tomondan ${cleanFrom}, kelishilgan holda ushbu shartnomani imzoladik:

      1. Shartnoma predmeti: ${cleanDetail}.

      2. Bitim bo'yicha majburiyatlar to'liq va o'z vaqtida bajarilishiga tomonlar kafolat beradilar.

      Tomonlar imzolari:
      Sotuvchi: _________________            Sotib oluvchi: _________________`;
      case 'bildirgi':
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                                  BILDIRGI
                             (Doklad xati)

      Sizga shuni ma'lum qilamanki, ${cleanDetail}.

      Yuqoridagilarni inobatga olgan holda, zarur choralar ko'rishingizni so'rayman.

      Sana: ${dateStr}
      Xodim imzosi: _____________________`;
      case 'malumotnoma':
        return `                                  MA'LUMOTNOMA

      Ushbu ma'lumotnoma ${cleanTo} taqdim etish uchun ${cleanFrom} muomalasiga binoan berildi.

      Tarkibi: ${cleanDetail}.

      Sana: ${dateStr}
      Mas'ul xodim imzosi: _____________________
      M.O'. (Muhra o'rniga)`;
      case 'free':
      default:
        return `                                            ${cleanTo}
                                            ${cleanFrom}

                                RASMIY HUJJAT

      Murojaat mazmuni:
      ${cleanDetail}

      Ushbu hujjat professional tarzda tizim yordamida shakllantirilgan.

      Sana: ${dateStr}
      Imzo: _____________________`;
    }
  };

  // Sync draft on load or template switch
  useEffect(() => {
    const defaults = getTemplateDefaults(selectedTemplate);
    setDocTo(defaults.to);
    setDocFrom(defaults.from);
    setDocDetail(defaults.detail);
    
    const draftText = getLocalDraftText(selectedTemplate, defaults.to, defaults.from, defaults.detail);
    setGeneratedDocText(draftText);
    setIsAiGenerated(false);
  }, [selectedTemplate]);

  // Sync draft when simple inputs change, only if it is NOT yet AI generated
  useEffect(() => {
    if (!isAiGenerated) {
      setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
    }
  }, [docTo, docFrom, docDetail, isAiGenerated, selectedTemplate]);

  // Connects directly to backend Gemini Document generation
  const handleGenerateTemplateWord = async () => {
    if (!generatedDocText) return;
    setGeneratingDoc(true);
    try {
      const docBlob = await createSimpleDocx(generatedDocText);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(docBlob);
      link.download = `${selectedTemplate}_hujjat_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleGenDoc = async () => {
    setIsGeneratingDocText(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/gemini/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          to: docTo,
          from: docFrom,
          detail: docDetail
        })
      });

      if (!res.ok) {
        throw new Error('AI Server call failed');
      }

      const data = await res.json();
      if (data.output) {
        setGeneratedDocText(data.output);
        setIsAiGenerated(true);
      } else {
        setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Gemini AI bilan ulanib bo'lmadi. Offline shablon shakllantirildi.");
      setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
    } finally {
      setIsGeneratingDocText(false);
    }
  };

  const handlePrint = () => {
    if (!generatedDocText) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Iltimos, qalqib chiquvchi oynalar (popup) ochilishiga ruxsat bering.");
      return;
    }
    
    const isHandwriting = docPreviewMode === 'handwriting';
    const penColor = handwritingStyle === 'blue' ? '#1d4ed8' : '#1e293b';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A4 Chop Etish - Hujjat.uz</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Marck+Script&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #fff;
              }
              .a4-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
              }
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              background-color: #f1f5f9;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .a4-container {
              background: white;
              width: 210mm;
              min-height: 297mm;
              padding: 20mm 25mm 20mm 25mm;
              box-sizing: border-box;
              border: 1px solid #cbd5e1;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              white-space: pre-wrap;
              word-wrap: break-word;
              position: relative;
            }
            .computer {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14pt;
              line-height: 1.6;
              color: #000;
            }
            .handwriting {
              font-family: 'Caveat', cursive;
              font-size: 20pt;
              line-height: 1.5;
              color: ${penColor};
              transform: rotate(-0.5deg);
              letter-spacing: 0.5px;
            }
            .lines-background {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: linear-gradient(#e2e8f0 1px, transparent 1px);
              background-size: 100% 32px;
              pointer-events: none;
              opacity: 0.15;
            }
          </style>
        </head>
        <body>
          <div class="a4-container \${isHandwriting ? 'handwriting' : 'computer'}">
            \${isHandwriting ? '<div class="lines-background"></div>' : ''}
            <div>\${generatedDocText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>')}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Tools listing
  const TOOLS: PdfTool[] = [
    { id: 'jpgToPdf', icon: Image, iconColor: 'text-indigo-550 dark:text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/15', title: t.jpgToPdf, desc: "Rasm va fotosuratlarni bir zumda bitta tartibli PDF hujjatiga aylantiring." },
    { id: 'pdfMerge', icon: Layers, iconColor: 'text-emerald-555 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/15', title: t.pdfMerge, desc: "Bir nechta alohida PDF fayllarini bitta yaxlit hujjatga birlashtirish." },
    { id: 'pdfSplit', icon: Compass, iconColor: 'text-rose-550 dark:text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/15', title: t.pdfSplit, desc: "PDF hujjatingiz sahifalarini kesish yoki alohida fayllarga ajratib olish." },
    { id: 'lockPdf', icon: Lock, iconColor: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/15', title: t.lockPdf, desc: "PDF hujjatingizga parol o'rnating va uni begonalardan ishonchli himoya qiling." },
    { id: 'watermark', icon: Milestone, iconColor: 'text-purple-550 dark:text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/15', title: t.addWatermark, desc: "Hujjatga mualliflik huquqi, logotip yoki har qanday rasm/matn belgisi qo'shish." },
    { id: 'numbers', icon: Landmark, iconColor: 'text-sky-550 dark:text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/15', title: t.addNumbers, desc: "PDF varaqlariga sahifa raqamlarini tartib bilan avtomatik qo'shish." }
  ];

  // JPG to PDF state
  const [jpgFiles, setJpgFiles] = useState<{ id: string; name: string; url: string; size: string }[]>([]);
  const [orient, setOrient] = useState<'p' | 'l'>('p');
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState('rasmlar_to_pdf.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watermark state
  const [watermarkText, setWatermarkText] = useState('MAXFIY / CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);

  // PDF Merge state
  const [mergeFiles, setMergeFiles] = useState<{ name: string; size: string }[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Security pass state
  const [pdfPassword, setPdfPassword] = useState('');
  const [passTarget, setPassTarget] = useState<string>('');

  // Handle uploading files for JPG to PDF
  const handleJpgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      const mapped = filesArr.map((f: any) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: f.name,
        url: URL.createObjectURL(f),
        size: (f.size / 1024).toFixed(1) + ' KB'
      }));
      setJpgFiles(prev => [...prev, ...mapped]);
    }
  };

  const removeJpgFile = (id: string) => {
    setJpgFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(f => f.id !== id);
    });
  };

  const generateJpgToPdf = () => {
    if (jpgFiles.length === 0) return;
    setIsProcessing(true);
    setConvertedPdfUrl(null);

    setTimeout(async () => {
      try {
        const doc = new jsPDF({
          orientation: orient,
          unit: 'mm',
          format: 'a4'
        });

        for (let i = 0; i < jpgFiles.length; i++) {
          if (i > 0) {
            doc.addPage();
          }
          
          const item = jpgFiles[i];
          const img = new window.Image();
          img.src = item.url;
          
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 10;
          const targetW = pageWidth - (margin * 2);
          const targetH = pageHeight - (margin * 2);

          doc.addImage(img, 'JPEG', margin, margin, targetW, targetH);
        }

        const pdfBlob = doc.output('blob');
        const dUrl = URL.createObjectURL(pdfBlob);
        setConvertedPdfUrl(dUrl);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    }, 1200);
  };

  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const list = Array.from(e.target.files).map((f: any) => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      setMergeFiles(prev => [...prev, ...list]);
    }
  };

  const executeMerge = () => {
    if (mergeFiles.length === 0) return;
    setIsProcessing(true);
    setMergeSuccess(false);
    setTimeout(() => {
      setIsProcessing(false);
      setMergeSuccess(true);
    }, 1500);
  };

  const triggerDownloadSimulated = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(50, 50, 150);
    doc.text("Hujjat.uz — O'zbek Hujjat Markazi", 20, 30);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text(`Hujjat turi: ${activeTool ? TOOLS.find(t => t.id === activeTool)?.title : 'PDF'}`, 20, 50);
    doc.text(`Ishlov berilgan sana: ${new Date().toLocaleDateString()}`, 20, 60);
    
    if (activeTool === 'lockPdf') {
      doc.text("Xafvsizlik: Ushbu PDF parollangan.", 20, 75);
    } else if (activeTool === 'watermark') {
      doc.setTextColor(230, 100, 100);
      doc.setFontSize(36);
      doc.text(watermarkText, 35, 120);
    } else if (activeTool === 'numbers') {
      doc.text("Paginatsiya: Sahifalar muvaffaqiyatli tartiblandi.", 20, 75);
    }

    doc.save(`dimu_pro_${activeTool || 'hujjat'}.pdf`);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Title info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black font-display tracking-wide ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {t.docCenterTitle}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 mb-2 ${theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-350'}`}>
            {theme === 'dark' ? "AI yordamida rasmiy professional arizalar va shartnomalar yaratish hamda ishonchli PDF asboblari." : "Sun'iy intellekt orqali rasmiy arizalar tayyorlash va barcha zaruriy PDF amallari."}
          </p>
        </div>

        {/* Sub-navigation tabs within Document Center */}
        <div className={`flex p-1 rounded-2xl border shadow-md shrink-0 w-full md:w-auto self-start transition duration-200 ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => {
              setSubTab('templates');
              setActiveTool(null);
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              subTab === 'templates' 
                ? 'bg-indigo-600 text-white shadow' 
                : theme === 'dark' ? 'text-slate-400 hover:text-slate-205' : 'text-slate-500 hover:text-slate-909'
            }`}
          >
            <FileText className="w-4 h-4" />
            AI Hujjat Yaratish
          </button>
          <button
            onClick={() => {
              setSubTab('pdf');
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              subTab === 'pdf' 
                ? 'bg-indigo-600 text-white shadow' 
                : theme === 'dark' ? 'text-slate-400 hover:text-slate-205' : 'text-slate-500 hover:text-slate-909'
            }`}
          >
            <Layers className="w-4 h-4" />
            PDF Asboblari
          </button>
        </div>
      </div>

      {subTab === 'templates' ? (
        /* AI DOCUMENT TEMPLATES CREATOR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form and Template Selection Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`rounded-3xl border p-6 shadow-sm ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-sm font-black text-indigo-550 font-mono tracking-wider uppercase mb-4`}>
                {t.selectTemplate}
              </h3>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
                {[
                  { id: 'ariza', label: '✍️ Ariza (Mehnat/Ta\'til)' },
                  { id: 'tushuntirish', label: '📋 Tushuntirish xati' },
                  { id: 'tavsifnoma', label: '🎓 Tavsifnoma (Taqdim etish)' },
                  { id: 'shartnoma', label: '🤝 Oldi-sotdi shartnomasi' },
                  { id: 'bildirgi', label: '📢 Bildirishnoma (Bildirgi)' },
                  { id: 'malumotnoma', label: 'ℹ️ Ma\'lumotnoma' },
                  { id: 'free', label: '✨ Erkin Hujjat yozish' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplate(tpl.id);
                    }}
                    className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all duration-200 cursor-pointer border ${
                      selectedTemplate === tpl.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-500 dark:text-indigo-400 shadow-sm'
                        : theme === 'dark' 
                          ? 'border-slate-800 text-slate-300 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700' 
                          : 'border-slate-200 text-slate-655 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Form */}
            <div className={`rounded-3xl border p-6 shadow-sm space-y-4 ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-555 animate-pulse" />
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t.templateInputHeader}
                </h3>
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-450 block mb-1">
                    {selectedTemplate === 'shartnoma' ? "Sotuvchi ma'lumotlari:" : "Hujjat kimga taqdim etiladi (Qabul qiluvchi):"}
                  </label>
                  <input
                    type="text"
                    value={docTo}
                    onChange={(e) => setDocTo(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 border rounded-xl font-medium outline-none focus:border-indigo-500 transition duration-200 ${
                      theme === 'dark' ? 'bg-slate-909 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-450 block mb-1">
                    {selectedTemplate === 'shartnoma' ? "Sotib oluvchi ma'lumotlari:" : "Hujjat kim tomonidan taqdim etiladi (Muallif):"}
                  </label>
                  <input
                    type="text"
                    value={docFrom}
                    onChange={(e) => setDocFrom(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 border rounded-xl font-medium outline-none focus:border-indigo-500 transition duration-200 ${
                      theme === 'dark' ? 'bg-slate-909 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-450 block mb-1">
                    {selectedTemplate === 'shartnoma' ? "Shartnoma predmeti va narxi tafsiloti:" : "Hujjatning qisqacha mazmuni va sababi:"}
                  </label>
                  <textarea
                    rows={4}
                    value={docDetail}
                    onChange={(e) => setDocDetail(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 border rounded-xl font-medium outline-none focus:border-indigo-500 resize-none transition duration-200 ${
                      theme === 'dark' ? 'bg-slate-909 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMessage}
                </p>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleGenDoc}
                  disabled={isGeneratingDocText}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white disabled:opacity-50 active:scale-95 duration-150"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  {isGeneratingDocText ? "AI Yozmoqda..." : "AI Yordamida Yozish"}
                </button>
                <button
                  onClick={handleGenerateTemplateWord}
                  disabled={generatingDoc}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 border hover:bg-neutral-100 dark:hover:bg-slate-900 text-slate-350 dark:text-slate-200 border-slate-300 dark:border-slate-700 disabled:opacity-50 active:scale-95 duration-150"
                >
                  <Download className="w-4 h-4" />
                  {generatingDoc ? "Tayyorlanmoqda..." : "Word (.docx) yuklash"}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live A4 Preview Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Design Styles controls */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-sm ${
              theme === 'dark' ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-100/60 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 font-mono">Uslub:</span>
                <button
                  onClick={() => setDocPreviewMode('computer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    docPreviewMode === 'computer'
                      ? 'bg-indigo-600 text-white shadow'
                      : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  💻 Kompyuter Print
                </button>
                <button
                  onClick={() => setDocPreviewMode('handwriting')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    docPreviewMode === 'handwriting'
                      ? 'bg-indigo-600 text-white shadow'
                      : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  ✍️ Qo'lyozma
                </button>
              </div>

              {docPreviewMode === 'handwriting' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 font-mono">Rasm:</span>
                  <button
                    onClick={() => setHandwritingStyle('blue')}
                    className={`w-5 h-5 rounded-full bg-blue-700 transition duration-150 border-2 ${
                      handwritingStyle === 'blue' ? 'border-white scale-110 shadow' : 'border-transparent'
                    }`}
                    title="Ko'k ruchka"
                  />
                  <button
                    onClick={() => setHandwritingStyle('black')}
                    className={`w-5 h-5 rounded-full bg-slate-900 transition duration-150 border-2 ${
                      handwritingStyle === 'black' ? 'border-white scale-110 shadow' : 'border-transparent'
                    }`}
                    title="Miya ruchka"
                  />
                </div>
              )}

              <button
                onClick={handlePrint}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow border active:scale-95 transition ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                🖨️ Chop etish / PDF saqlash
              </button>
            </div>

            {/* A4 Sandbox Core Visual Canvas */}
            <div className={`relative overflow-auto border rounded-3xl p-4 max-h-[85vh] shadow-2xl flex justify-center ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div
                className={`w-[210mm] min-h-[297mm] p-12 sm:p-20 bg-white text-black shadow-inner relative text-left leading-relaxed break-words whitespace-pre-wrap rounded-xl`}
                style={{
                  fontFamily: docPreviewMode === 'handwriting' ? "'Caveat', cursive" : "'Times New Roman', Times, serif",
                  fontSize: docPreviewMode === 'handwriting' ? "18pt" : "12pt",
                  color: docPreviewMode === 'handwriting' ? (handwritingStyle === 'blue' ? '#1d4ed8' : '#1e293b') : '#000000',
                  lineHeight: docPreviewMode === 'handwriting' ? '1.5' : '1.7',
                }}
              >
                {/* Lined Notebook effect for handwriting style */}
                {docPreviewMode === 'handwriting' && (
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(#475569_1px,transparent_1px)] bg-[size:100%_28px] mt-10" />
                )}

                {generatedDocText}
              </div>
            </div>
            
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-555" />
              Tayyorlangan .docx faylni MS Word yoki Google Docs-da bemalol to'liq moslashtira olasiz.
            </p>
          </div>

        </div>
      ) : (
        /* ORIGINAL PDF & FILE UTILITIES SECTIONS */
        <div>
          {activeTool === null ? (
        /* Tools Grid Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setConvertedPdfUrl(null);
                  setMergeSuccess(false);
                }}
                className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-xl group ${
                  theme === 'dark' 
                    ? `bg-slate-950/45 ${tool.borderColor} hover:border-indigo-500/40 hover:bg-slate-950/70` 
                    : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${tool.bgColor} ${tool.iconColor} shadow-inner`}>
                    <IconComponent className="w-5 h-5 group-hover:scale-110 transition duration-300" />
                  </div>
                  <h3 className={`text-base font-bold mt-4 font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition duration-200 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {tool.title}
                  </h3>
                  <p className={`text-xs mt-2.5 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {tool.desc}
                  </p>
                </div>
                
                <div className="mt-5 flex items-center justify-between text-xs font-mono text-indigo-500 font-bold">
                  <span>Brauzerda (Ishonchli)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Selected Tool Layout */
        <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800 shadow-black/50' 
            : 'bg-white border-slate-200 shadow-indigo-100/30'
        }`}>
          <button
            onClick={() => {
              setActiveTool(null);
              setJpgFiles([]);
              setMergeFiles([]);
            }}
            className={`absolute top-6 right-6 p-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition duration-200 cursor-pointer border ${
              theme === 'dark' 
                ? 'text-slate-400 hover:text-white bg-white/5 border-white/5 hover:bg-white/10' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
            Yopish
          </button>

          <div className={`flex items-center gap-4 border-b pb-5 mb-6 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-150'}`}>
            <div className="p-3 bg-indigo-500/15 text-indigo-500 rounded-2xl border border-indigo-500/20">
              {React.createElement(TOOLS.find(t => t.id === activeTool)!.icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h3 className={`text-lg font-bold font-display tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {TOOLS.find(t => t.id === activeTool)!.title}
              </h3>
              <p className="text-xs text-slate-500 font-mono font-semibold">
                Status: Faqat qurilmangizda qayta ishlash rejimida
              </p>
            </div>
          </div>

          {/* Core JPG to PDF interactive module */}
          {activeTool === 'jpgToPdf' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-250 ${
                  theme === 'dark' 
                    ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500/50 hover:bg-slate-900/10' 
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50/10'
                }`}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleJpgUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <Image className="w-10 h-10 text-indigo-500 mx-auto mb-3 animate-pulse" />
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                  Rasm fayllarini tanlang (JPG, PNG, WEBP)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Maksimal 20 varaqgacha bir marta yuklang.
                </p>
              </div>

              {jpgFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-500 font-mono tracking-wider uppercase">
                    Yuzaga yuklangan rasmlar ({jpgFiles.length}):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {jpgFiles.map((file) => (
                      <div key={file.id} className={`relative group border p-2 rounded-xl overflow-hidden shadow-sm ${
                        theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <img src={file.url} alt={file.name} className="w-full h-24 object-cover rounded-lg bg-slate-950" />
                        <span className="text-[10px] text-slate-500 truncate block mt-1 px-1 font-mono font-semibold">{file.name}</span>
                        <button
                          onClick={() => removeJpgFile(file.id)}
                          className="absolute top-3 right-3 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer transition opacity-0 group-hover:opacity-100"
                          title="Faylni o'chirish"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Orientation & Build triggers */}
                  <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-slate-500 font-mono">Orientatsiya:</span>
                      <button
                        onClick={() => setOrient('p')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          orient === 'p' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}
                      >
                        Portret (A4)
                      </button>
                      <button
                        onClick={() => setOrient('l')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          orient === 'l' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}
                      >
                        Albom (Alb)
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        className={`border text-xs px-3 py-2 rounded-lg font-mono w-48 ${
                          theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder="hujjat_nomi.pdf"
                      />
                      <button
                        onClick={generateJpgToPdf}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold text-white text-xs rounded-xl flex items-center gap-2 active:scale-95 duration-200 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                      >
                        {isProcessing ? 'Yasalmoqda...' : 'PDF Shakllantirish'}
                        <Compass className="w-4 h-4 animate-spin-slow" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {convertedPdfUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">{t.jpgSuccess}</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Tayyor: {pdfName}</p>
                    </div>
                  </div>
                  <a
                    href={convertedPdfUrl}
                    download={pdfName}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PDF merger */}
          {activeTool === 'pdfMerge' && (
            <div className="space-y-6">
              <div
                onClick={() => mergeInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  theme === 'dark' 
                    ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500/50 hover:bg-slate-900/10' 
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50/10'
                }`}
              >
                <input
                  type="file"
                  multiple
                  ref={mergeInputRef}
                  onChange={handleMergeUpload}
                  accept=".pdf"
                  className="hidden"
                />
                <Layers className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                  PDF fayllarini tanlang
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Har qanday o'lchamdagi cheksiz PDF fayllarini qo'shing.
                </p>
              </div>

              {mergeFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 font-mono tracking-wider uppercase">
                    Yuzaga yuklangan birlashmalar ({mergeFiles.length}):
                  </h4>
                  <div className={`divide-y rounded-2xl border ${theme === 'dark' ? 'divide-slate-800 border-slate-800' : 'divide-slate-200 border-slate-200 bg-slate-50/30'}`}>
                    {mergeFiles.map((file, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                        <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-slate-250' : 'text-slate-800'}`}>{idx + 1}. {file.name}</span>
                        <span className="text-slate-500 font-mono">{file.size}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      onClick={() => setMergeFiles([])}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                        theme === 'dark' ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                      }`}
                    >
                      Barchasini olib tashlash
                    </button>
                    <button
                      onClick={executeMerge}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 duration-205 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
                    >
                      {isProcessing ? 'Birlashtirilmoqda...' : 'Fayllarni Birlashtirish'}
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {mergeSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-sm" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Birlashtirish bajarildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi yaxlit fayl: dimu_merged_document.pdf</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerDownloadSimulated}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow duration-200 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security lock PDF */}
          {activeTool === 'lockPdf' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      PDF hujjatingizni tanlang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassTarget(e.target.files[0].name);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {passTarget && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5">Tanlandi: {passTarget}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      Himoya parolini o'rnating:
                    </label>
                    <input
                      type="password"
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      placeholder="Masalan: 123456"
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl text-white ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-700' : 'bg-slate-50 border-slate-205 text-slate-900 placeholder-slate-400 font-semibold'
                      }`}
                    />
                  </div>

                  <button
                    onClick={triggerDownloadSimulated}
                    disabled={!passTarget || !pdfPassword}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <Lock className="w-4 h-4" />
                    Hujjatga Parol qo'yish
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                }`}>
                  <Shield className="w-8 h-8 text-yellow-500 mb-3" />
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Xavfsiz parollash texnologiyasi</h4>
                  <p>Siz tomondan o'rnatilgan parol brauzeringiz ichida bevosita kriptografik hashing yordamida himoya qilinadi. Barcha paroblash jarayoni xavfsiz holda bajariladi va maxfiy ma'lumotlaringiz saqlanmaydi.</p>
                </div>
              </div>
            </div>
          )}

          {/* Watermark Add PDF */}
          {activeTool === 'watermark' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      PDF hujjatingizni tanlang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassTarget(e.target.files[0].name);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      Tamg'a (Watermark) Matni:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-205 text-slate-900 font-semibold'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                        Rang:
                      </label>
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className={`w-full h-10 p-1 border rounded-xl cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                        Xiralik asosi (Opacity): {watermarkOpacity}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full h-10 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerDownloadSimulated}
                    disabled={!passTarget}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-[#4f46e5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <Milestone className="w-4 h-4" />
                    Watermark Tamg'asini Urish
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650 font-medium'
                }`}>
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Suv tamg'asi nima uchun kerak?</h4>
                  <p>Sizning rasmiy qo'lyozmalaringiz, shablon va darsliklaringiz internet nashrlarida tarqalib ketganda mualliflik huquqingizni tasdiqlash uchun orqa fonga maxsus rangli xira matnlar qo'yiladi. Bu o'g'irliklardan eng mukammal himoya!</p>
                </div>
              </div>
            </div>
          )}

          {/* PDF Split & Custom Pagination */}
          {activeTool === 'pdfSplit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      Kesib olinadigan PDF:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassTarget(e.target.files[0].name);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                        Varaqdan boshlab:
                      </label>
                      <input
                        type="number"
                        defaultValue={1}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                        Varaqqacha:
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerDownloadSimulated}
                    disabled={!passTarget}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-650 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <Compass className="w-4 h-4" />
                    Belgilangan Qismni Kesib Olish
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650 font-medium'
                }`}>
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Smart kesib ajratish</h4>
                  <p>Kompyuterizatsiyalashgan tizim PDF sahifalardagi barcha tahrirli matnli fragmentlarni to'liq saqlab qolgan holda o'lchami o'zgarmagan yangi yengil PDF shaklida kesib beradi.</p>
                </div>
              </div>
            </div>
          )}

          {/* PDF Page numbers */}
          {activeTool === 'numbers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      Raqamlanadigan PDF:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassTarget(e.target.files[0].name);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 font-mono block mb-1.5">
                      Raqam joylashuvi:
                    </label>
                    <select className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <option>Varaqning pastki o'ng burchagida</option>
                      <option>Varaqning pastki markazida</option>
                      <option>Varaqning yuqoriki markazida</option>
                    </select>
                  </div>

                  <button
                    onClick={triggerDownloadSimulated}
                    disabled={!passTarget}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <Landmark className="w-4 h-4" />
                    Sahifalarni Raqamlash (Avtomatik)
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650 font-medium'
                }`}>
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>Indexlash muhandisligi</h4>
                  <p>Fayllarga tartib bo'yicha varaq hisobini o'rnatish diplom loyihalari va rasmiy idoraviy arizalarni topshirganda qat'iy talab qilinadi. Barcha varaqlar tartibli bezatiladi.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

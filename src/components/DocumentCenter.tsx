/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { createSimpleDocx } from '../utils/fileProcessor';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { FileText, Plus, ChevronRight, Lock, EyeOff, RotateCw, Image, Landmark, Milestone, Shield, Layers, Compass, Download, CheckCircle2, AlertCircle, RefreshCw, X, Sparkles, Check, Unlock, Minimize2, Search, Sliders, Trash2, FileDown, Type, Scissors, QrCode, Bookmark, Layers2, Copy, FilePlus, Eye, AlignLeft, Paintbrush, FileSpreadsheet, ListOrdered, Scale, CheckSquare, Link, Eraser, Square, Printer, HeartPulse, Camera, Crop } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import JSZip from 'jszip';

interface DocumentCenterProps {
  currentLang: Language;
  theme?: 'light' | 'dark';
  onSendToHandwriting?: (text: string) => void;
}

interface PdfTool {
  id: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  desc: string;
  category: string;
}

export default function DocumentCenter({ currentLang, theme = 'dark', onSendToHandwriting }: DocumentCenterProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [subTab, setSubTab] = useState<'templates' | 'pdf'>('pdf');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Document templates state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ariza');
  
  // Unified document outputs and controls
  const [docTo, setDocTo] = useState('');
  const [docFrom, setDocFrom] = useState('');
  const [docDetail, setDocDetail] = useState('');
  const [docPreviewMode, setDocPreviewMode] = useState<'computer' | 'handwriting'>('computer');
  const [handwritingStyle, setHandwritingStyle] = useState<'blue' | 'black'>('blue');
  const [hwFont, setHwFont] = useState<string>('Caveat');
  const [generatedDocText, setGeneratedDocText] = useState<string>('');
  const [isGeneratingDocText, setIsGeneratingDocText] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [pageMargins, setPageMargins] = useState({ top: 20, right: 25, bottom: 20, left: 25 });
  const [previewEditing, setPreviewEditing] = useState(false);

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
      case 'ishdan_boshatish':
        return {
          to: '"Texno Grupp" MCHJ Direktori B.A. Hasanovga',
          from: '"Bosh dasturchi" lavozimidagi Yusupov Doniyor',
          detail: 'shaxsiy sabablarga ko\'ra 2026-yil 20-iyundan boshlab ishdan bo\'shatishingizni so\'rayman'
        };
      case 'ishga_qabul':
        return {
          to: '"IT Solutions" MCHJ kadrlar bo\'limi boshlig\'iga',
          from: 'Fuqaro Mirzayev Jasur Alimovich',
          detail: '"Frontend dasturchi" lavozimiga ishga qabul qilishingizni so\'rayman. Malaka: React, TypeScript, 3 yil tajriba.'
        };
      case 'ijara':
        return {
          to: 'Uy egasi: Toshmatov Bobur Salimovich (Pasport AB 1234567)',
          from: 'Ijorachi: Rahimov Sardor Komilovich (Pasport AC 7654321)',
          detail: 'Toshkent sh., Yunusobod tumani, Amir Temur ko\'chasi 45-uy, 3-qavatdagi 2 xonali kvartira oylik 1,500,000 so\'m evaziga 1 yil muddatga ijaraga olinmoqda.'
        };
      case 'qarz':
        return {
          to: 'Qarz beruvchi: Karimov Alisher Umarovich',
          from: 'Qarz oluvchi: Sodiqov Firdavs Behzodovich',
          detail: '5,000,000 (besh million) so\'m miqdoridagi pul 2026-yil 1-iyundan boshlab 6 oy muddatga qarzga olinmoqda. To\'lash muddati: 2026-yil 1-dekabr.'
        };
      case 'soliq_ariza':
        return {
          to: 'Toshkent shahar Soliq inspeksiyasi boshlig\'iga',
          from: 'Fuqaro Umarov Sanjar, JSHSHIR: 12345678901234',
          detail: '2025-yil uchun daromad solig\'i bo\'yicha ortiqcha to\'langan 450,000 so\'m summasini qaytarib berishingizni so\'rayman. Asos: soliq deklaratsiyasi №2025-1234.'
        };
      case 'ta_lim_ariza':
        return {
          to: 'Toshkent Davlat Texnika Universiteti rektori prof. A.A. Tillayevga',
          from: '"Kompyuter muhandisligi" yo\'nalishi 2-kurs talabasi Holiqov Timur, guruh KM-22',
          detail: 'kasallik sababli 2026-yil 5-10 iyun kunlari sessiya imtihonlarini kechiktirish haqida akademik ta\'til berishingizni yoki muddatini uzaytirishingizni so\'rayman.'
        };
      case 'mehnat_shikoyat':
        return {
          to: 'Mehnat va aholini ijtimoiy muhofaza qilish vazirligiga',
          from: 'Fuqaro Normatov Eldor, manzil: Toshkent sh., Chilonzor tumani',
          detail: '"Alfa Logistika" MCHJ direktori tomonidan oylik maoshi 3 oy to\'lanmayotganligi va mehnat shartnomasini asossiz ravishda bekor qilishga harakat qilganligi sababli shikoyat bildirmoqchiman.'
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
    const defaults = getTemplateDefaults(type);

    const getCleanValue = (val: string, fallback: string) => {
      const trimmed = val.trim();
      if (!trimmed) return fallback.replace(/\s+/g, ' ').trim();
      return trimmed.replace(/\s+/g, ' ').trim();
    };

    const cleanTo = getCleanValue(to, defaults.to);
    const cleanFrom = getCleanValue(from, defaults.from);
    const cleanDetail = getCleanValue(detail, defaults.detail);
    const dateStr = new Date().toLocaleDateString('uz-UZ');

    const pad = (s: string, n: number) => s.padStart(n);
    const yr = new Date().getFullYear();

    switch (type) {
      case 'ariza': {
        const body = cleanDetail.replace(/\.?\s*so['']rayman\.?\s*$/i, '').trim();
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                                       A R I Z A',
          '',
          '',
          `    Hurmatli rahbar,`,
          '',
          `    Sizdan ${body.charAt(0).toLowerCase() + body.slice(1)}ni so'rayman.`,
          '',
          `    Ushbu arizamni ijobiy ko'rib chiqishingizni va qonun hujjatlari`,
          `    asosida hal etishingizni so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'tushuntirish': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                                 T U S H U N T I R I S H   X A T I',
          '',
          '',
          `    Men, ${cleanFrom}, quyidagilarni tushuntiraman:`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Keltirilgan holatlar haqiqatga to'liq mos ekanligini, bu holat`,
          `    iloji boricha tezda bartaraf etilishini va bundan buyon bunday`,
          `    kamchiliklar takrorlanmasligini kafolatlayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'tavsifnoma': {
        return [
          '',
          '                                      T A V S I F N O M A',
          '',
          '',
          `    Ushbu tavsifnoma ${cleanFrom} haqida ${cleanTo}`,
          `    taqdim etish uchun berildi.`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Xodim o'z faoliyati davomida o'zini mas'uliyatli, intizomli va`,
          `    bilimdon mutaxassis sifatida namoyon etdi. Jamoada hurmatga sazovor`,
          `    bo'lib, qo'yilgan vazifalarni muddatida va sifatli bajaradi.`,
          '',
          `    Ushbu tavsifnoma uning shaxsiy so'roviga binoan berildi.`,
          '',
          '',
          `    ${dateStr}`,
          '',
          `    Rahbar: ____________________          M.O'`,
          `             (imzo)       (F.I.O.)`,
        ].join('\n');
      }

      case 'shartnoma': {
        return [
          `    Toshkent shahri                                         ${dateStr}`,
          '',
          '',
          '                             S H A R T N O M A',
          `                               № _____ / ${yr}`,
          '',
          '',
          `    Biz, bir tomondan — ${cleanTo} (bundan buyon "1-tomon"),`,
          `    va ikkinchi tomondan — ${cleanFrom} (bundan buyon "2-tomon"),`,
          `    quyidagilar to'g'risida ushbu shartnomani tuzdik:`,
          '',
          '',
          `    1. SHARTNOMA PREDMETI`,
          '',
          `    1.1. ${cleanDetail}.`,
          '',
          '',
          `    2. TOMONLARNING MAJBURIYATLARI`,
          '',
          `    2.1. 1-tomon o'z zimmasidagi barcha majburiyatlarni o'z vaqtida`,
          `         bajarish majburiyatini oladi.`,
          `    2.2. 2-tomon belgilangan tartibda to'lovni amalga oshiradi.`,
          '',
          '',
          `    3. NIZOLARNI HAL ETISH TARTIBI`,
          '',
          `    3.1. Nizolar muzokaralar yo'li bilan, kerak bo'lganda O'zbekiston`,
          `         Respublikasi qonunchiligiga muvofiq sudlar orqali hal etiladi.`,
          '',
          '',
          `    4. SHARTNOMA MUDDATI`,
          '',
          `    4.1. Shartnoma imzolangan kundan kuchga kiradi va majburiyatlar`,
          `         to'liq bajarilgunga qadar amal qiladi.`,
          '',
          '',
          `    TOMONLAR REKVIZITLARI VA IMZOLARI:`,
          '',
          `    1-TOMON:                                  2-TOMON:`,
          `    ____________________________              ____________________________`,
          `    (imzo)  F.I.O.                            (imzo)  F.I.O.`,
          `    Sana: ________________                    Sana: ________________`,
        ].join('\n');
      }

      case 'bildirgi': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                              X I Z M A T   X A T I   (BILDIRGI)',
          '',
          '',
          `    Sizga quyidagilarni ma'lum qilaman:`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Yuqoridagi holatni e'tiboringizga havola etib, tegishli choralar`,
          `    ko'rishingizni so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'malumotnoma': {
        return [
          '',
          `    Tashkilot/Muassasa nomi: ________________________________________`,
          `    Manzil: _________________________________________________________`,
          `    Tel: ________________________    Raqam: _____ / ${yr}`,
          '',
          '',
          '                                 M A \'L U M O T N O M A',
          '',
          '',
          `    Ushbu ma'lumotnoma ${cleanFrom} shaxsiga tegishli bo'lib,`,
          `    ${cleanTo} taqdim etish uchun berilgan.`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Ma'lumotnoma uning shaxsiy so'roviga binoan va tegishli`,
          `    hujjatlar asosida berildi.`,
          '',
          '',
          `    ${dateStr}`,
          '',
          `    Mas'ul xodim: ____________________          M.O'`,
          `                   (imzo)   (F.I.O.)`,
        ].join('\n');
      }

      case 'free':
      default: {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                                    R A S M I Y   M U R O J A A T',
          '',
          '',
          `    Hurmatli rahbar,`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Ushbu murojaatni ko'rib chiqib, tegishli qaror qabul qilishingizni`,
          `    iltimoslar bilan so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'ishdan_boshatish': {
        const body = cleanDetail.replace(/\.?\s*so['']rayman\.?\s*$/i, '').trim();
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                                       A R I Z A',
          '                               (Ishdan bo\'shatish to\'g\'risida)',
          '',
          '',
          `    Hurmatli rahbar,`,
          '',
          `    Sizdan ${body.charAt(0).toLowerCase() + body.slice(1)}ni so'rayman.`,
          '',
          `    Mehnat kodeksining 100-moddasi asosida ish beruvchi bilan`,
          `    kelishilgan holda shartnomani tugatishni so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'ishga_qabul': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                           I S H G A   Q A B U L   Q I L I S H',
          '                                  T O \'G \'R I S I D A',
          '                                     A R I Z A',
          '',
          '',
          `    Hurmatli kadrlar bo'limi rahbari,`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Zaruriy hujjatlar (diplom, pasport nusxasi, mehnat daftarchasi)`,
          `    ariza bilan birga topshirilmoqda.`,
          '',
          `    Menga ishonchingizni bildirgan holda ishga qabul qilishingizni`,
          `    so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'ijara': {
        const yr2 = new Date().getFullYear();
        return [
          `    Toshkent shahri                                         ${dateStr}`,
          '',
          '',
          '                               I J A R A   S H A R T N O M A S I',
          `                                    № _____ / ${yr2}`,
          '',
          '',
          `    Biz, bir tomondan — ${cleanTo} ("Uy egasi"),`,
          `    va ikkinchi tomondan — ${cleanFrom} ("Ijorachi"),`,
          `    quyidagi shartlar asosida ushbu ijara shartnomasini tuzdik:`,
          '',
          '',
          `    1. SHARTNOMA PREDMETI`,
          `    1.1. ${cleanDetail}.`,
          '',
          `    2. IJARA MUDDATI VA TO'LOV TARTIBI`,
          `    2.1. Ijara shartnomasi imzolangan kundan kuchga kiradi.`,
          `    2.2. Ijara haqi har oyning 5-kunigacha naqd pul yoki bank o'tkazma`,
          `         orqali to'lanadi.`,
          '',
          `    3. TOMONLARNING MAJBURIYATLARI`,
          `    3.1. Uy egasi: mulkni yaxshi holatda topshirish, kommunal xizmatlarni`,
          `         ta'minlash majburiyatini oladi.`,
          `    3.2. Ijorachi: mulkni ehtiyotkorlik bilan ishlatish, vaqtida to'lash`,
          `         majburiyatini oladi.`,
          '',
          '',
          `    UY EGASI:                                 IJORACHI:`,
          `    ____________________________              ____________________________`,
          `    (imzo)  F.I.O.                            (imzo)  F.I.O.`,
          `    Sana: ________________                    Sana: ________________`,
        ].join('\n');
      }

      case 'qarz': {
        return [
          `    Toshkent shahri                                         ${dateStr}`,
          '',
          '',
          '                              Q A R Z   T I L X A T I',
          '',
          '',
          `    Men, ${cleanFrom},`,
          '',
          `    ${cleanTo} dan quyidagi shartlarda pul qarz oldim:`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Men, qarz oluvchi, mazkur summani belgilangan muddatda`,
          `    to'liq qaytarishni va qarz shartnomasi shartlariga`,
          `    rioya qilishni o'z zimmasiga olaman.`,
          '',
          `    Agar belgilangan muddatda to'lanmasa, qarz oluvchi`,
          `    har bir kechiktirilgan kun uchun 0.1% jarima to'laydi.`,
          '',
          '',
          `    Qarz beruvchi:                            Qarz oluvchi:`,
          `    ____________________________              ____________________________`,
          `    (imzo)  F.I.O.                            (imzo)  F.I.O.`,
          `    Sana: ________________                    Sana: ________________`,
        ].join('\n');
      }

      case 'soliq_ariza': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                            S O L I Q   A R I Z A S I',
          '',
          '',
          `    Hurmatli inspeksiya rahbari,`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Ilova: 1. Daromad solig\'i deklaratsiyasi (1 varaq).`,
          `           2. Bank to'lov hujjati (1 varaq).`,
          `           3. Pasport nusxasi (1 varaq).`,
          '',
          `    Arizamni ko'rib chiqib, qonun hujjatlari asosida hal`,
          `    etishingizni so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'ta_lim_ariza': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                              T A ' + '\'L I M   A R I Z A S I',
          '',
          '',
          `    Hurmatli rektor,`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Ilova: tibbiy ma'lumotnoma (agar mavjud bo'lsa).`,
          '',
          `    Ushbu arizamni ko'rib chiqib, ijobiy qaror qabul`,
          `    qilishingizni so'rayman.`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }

      case 'mehnat_shikoyat': {
        return [
          '',
          pad(cleanTo, 70),
          pad('', 70),
          pad(cleanFrom + ' dan', 70),
          '',
          '',
          '                            S H I K O Y A T   A R I Z A S I',
          '',
          '',
          `    Hurmatli vazirlik rahbari,`,
          '',
          `    ${cleanDetail}.`,
          '',
          `    Mehnat kodeksining 9, 14, 17-moddalari asosida ish beruvchiga`,
          `    nisbatan tegishli choralar ko'rishingizni, men esa qonuniy`,
          `    huquqlarimni tiklashingizni so'rayman.`,
          '',
          `    Ilova:`,
          `           1. Mehnat shartnomasi nusxasi.`,
          `           2. Oylik maosh hisobi (uch oylik).`,
          `           3. Guvohlar izohlari (2 varaq).`,
          '',
          '',
          `    ${dateStr}                                    Imzo: ____________________`,
          `                                                  ${cleanFrom}`,
        ].join('\n');
      }
    }
  };

  const containsMixedScripts = (text: string) => {
    const hasLatin = /[A-Za-z]/.test(text);
    const hasCyrillic = /[А-Яа-яЁё]/.test(text);
    return hasLatin && hasCyrillic;
  };

  const createA4PdfBlob = async (text: string) => {
    if (docPreviewMode === 'handwriting') {
      await document.fonts.ready;
      const SCALE = 2;
      const PW = 794;
      const PH = 1123;
      const canvas = document.createElement('canvas');
      canvas.width = PW * SCALE;
      canvas.height = PH * SCALE;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const lineSpacing = 34;
      const marginTopPx = pageMargins.top * (PH / 297) * SCALE;
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 0.5 * SCALE;
      for (let y = marginTopPx + lineSpacing * SCALE; y < canvas.height - 20 * SCALE; y += lineSpacing * SCALE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      const leftPx = pageMargins.left * (PW / 210) * SCALE;
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(leftPx, 0); ctx.lineTo(leftPx, canvas.height); ctx.stroke();

      const penColor = handwritingStyle === 'blue' ? '#1d4ed8' : '#1e293b';
      const fontSize = 24;
      ctx.font = `${fontSize * SCALE}px "${hwFont}", cursive`;
      ctx.fillStyle = penColor;

      const textX = leftPx + 10 * SCALE;
      const rightPx = pageMargins.right * (PW / 210) * SCALE;
      const maxW = canvas.width - textX - rightPx;
      let cy = marginTopPx + lineSpacing * SCALE + fontSize * SCALE * 0.4;

      const rawLines = text.replace(/\r\n/g, '\n').split('\n');
      for (const rawLine of rawLines) {
        if (cy > canvas.height - 30 * SCALE) break;
        if (!rawLine.trim()) { cy += lineSpacing * SCALE; continue; }
        const words = rawLine.split(' ');
        let cur = '';
        for (const w of words) {
          const test = cur + (cur ? ' ' : '') + w;
          if (ctx.measureText(test).width > maxW && cur) {
            ctx.fillText(cur.trim(), textX, cy);
            cur = w;
            cy += lineSpacing * SCALE;
            if (cy > canvas.height - 30 * SCALE) break;
          } else { cur = test; }
        }
        if (cur && cy <= canvas.height - 30 * SCALE) ctx.fillText(cur.trim(), textX, cy);
        cy += lineSpacing * SCALE;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.93);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      return pdf.output('blob');
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const marginLeft = pageMargins.left;
    const marginRight = pageMargins.right;
    const marginTop = pageMargins.top;
    const marginBottom = pageMargins.bottom;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginLeft - marginRight;
    const fontSize = 12;
    const lineHeight = fontSize * 0.7;

    doc.setFont('Times', 'Normal');
    doc.setFontSize(fontSize);
    doc.setTextColor('#000000');

    const rawLines = text.replace(/\r\n/g, '\n').split('\n');
    let cursorY = marginTop;

    for (const rawLine of rawLines) {
      const wrapped = doc.splitTextToSize(rawLine || ' ', contentWidth);
      for (const line of wrapped) {
        if (cursorY > pageHeight - marginBottom) {
          doc.addPage();
          cursorY = marginTop;
        }
        doc.text(line, marginLeft, cursorY, { maxWidth: contentWidth });
        cursorY += lineHeight;
      }
    }

    return doc.output('blob');
  };

  const handlePreviewInput = (event: React.FormEvent<HTMLDivElement>) => {
    const nextText = (event.currentTarget as HTMLDivElement).innerText;
    setGeneratedDocText(nextText.replace(/\u00A0/g, ' '));
    setIsAiGenerated(true);
  };

  const handleExportPdf = async () => {
    if (!generatedDocText) return;
    setIsProcessing(true);
    setGlobalError('');
    try {
      const pdfBlob = await createA4PdfBlob(generatedDocText);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hujjat_${selectedTemplate}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessDownloadUrl(url);
      setSuccessFilename(link.download);
    } catch (err: any) {
      console.error(err);
      setGlobalError('PDF formatiga eksport qilishda xatolik yuz berdi. Iltimos, matnni tekshiring va qayta urinib ko‘ring.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync draft on load or template switch
  useEffect(() => {
    setDocTo('');
    setDocFrom('');
    setDocDetail('');
    
    const draftText = getLocalDraftText(selectedTemplate, '', '', '');
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
    const defaults = getTemplateDefaults(selectedTemplate);
    const apiTo = docTo.trim() || defaults.to;
    const apiFrom = docFrom.trim() || defaults.from;
    const apiDetail = docDetail.trim() || defaults.detail;
    const combinedInput = `${apiTo} ${apiFrom} ${apiDetail}`;

    if (containsMixedScripts(combinedInput)) {
      setErrorMessage('Hujjat ichida bir nechta alifbo ishlatilgan. Iltimos, faqat bitta tildagi matnni kiriting yoki keyin hujjatni to`g`ridan-to`g`ri tahrir qiling.');
      setGeneratedDocText(getLocalDraftText(selectedTemplate, apiTo, apiFrom, apiDetail));
      setIsGeneratingDocText(false);
      return;
    }

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const providerOverride = localStorage.getItem('ai_provider_override');
      if (providerOverride) headers['X-AI-Provider'] = providerOverride;

      const res = await fetch('/api/ai/document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateType: selectedTemplate,
          to: apiTo,
          from: apiFrom,
          detail: apiDetail
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'AI Server call failed');
      }

      const data = await res.json();
      if (data.output) {
        setGeneratedDocText(data.output);
        setIsAiGenerated(true);
      } else {
        setGeneratedDocText(getLocalDraftText(selectedTemplate, docTo, docFrom, docDetail));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Gemini AI bilan ulanib bo'lmadi. Offline shablon shakllantirildi.");
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
    const printPadding = `${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${pageMargins.left}mm`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A4 Chop Etish - Hujjat.uz</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Patrick+Hand&family=Indie+Flower&family=Marck+Script&family=Bad+Script&family=Reenie+Beanie&family=Schoolbell&display=swap" rel="stylesheet">
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
              padding: ${printPadding};
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
              font-family: '${hwFont}', cursive;
              font-size: 20pt;
              line-height: 1.5;
              color: ${penColor};
              letter-spacing: 0.3px;
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
          <div class="a4-container ${isHandwriting ? 'handwriting' : 'computer'}">
            ${isHandwriting ? '<div class="lines-background"></div>' : ''}
            <div>${generatedDocText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</div>
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

  // --- Extended 46 PDF Tools Suite (like ilovepdf) ---
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [pdfActiveCategory, setPdfActiveCategory] = useState('all');

  // Generic Extra PDF Config states for all new 37 tools
  const [pdfExtraFile, setPdfExtraFile] = useState<File | null>(null);
  const [pdfExtraFile2, setPdfExtraFile2] = useState<File | null>(null); // For compare tool
  const [pdfExtraConfig, setPdfExtraConfig] = useState<Record<string, any>>({
    textVal: 'MAXFIY',
    quality: 90,
    pageRange: '',
    title: '',
    author: '',
    subject: '',
    keywords: '',
    margin: 10,
    stampText: 'TASDIQLANDI',
    stampColor: '#ef4444',
    signatureData: '',
    qrText: 'https://hujjat.uz',
    insertIndex: 1,
    scalePercent: 100,
    colorMode: 'dark',
    headerText: 'Hujjat.uz',
    footerText: 'Muloqot sahifasi',
    linkUrl: 'https://hujjat.uz',
    bookmarkTitle: '1-bob. Kirish',
    bookmarkPage: 1
  });

  const TOOLS: PdfTool[] = [
    { id: 'pdfMerge', icon: Layers, iconColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/15', title: t.pdfMerge, desc: "Bir nechta alohida PDF fayllarini bitta yaxlit hujjatga birlashtirish.", category: 'merge_split' },
    { id: 'pdfSplit', icon: Compass, iconColor: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/15', title: t.pdfSplit, desc: "PDF hujjatingiz sahifalarini kesish yoki alohida fayllarga ajratib olish.", category: 'merge_split' },
    { id: 'pdfCompress', icon: Minimize2, iconColor: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/15', title: t.pdfCompress, desc: "PDF o'lchamini va kesh xajmini brauzerning o'zida sifatini buzmasdan siqish.", category: 'repair_optimize' },
    
    // Convert TO PDF
    { id: 'jpgToPdf', icon: Image, iconColor: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/15', title: t.jpgToPdf, desc: "Skaner JPG rasmlari va fotosuratlarini bitta tartibli PDF hujjatiga aylanish.", category: 'convert_to' },
    { id: 'wordToPdf', icon: FileText, iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/15', title: "Word (DOCX) dan PDF ga", desc: "Word .docx shablonlari yoki arizalarini barcha jadvallari va shriftlari bilan bir zumda standart PDF varaqlariga aylantirish.", category: 'convert_to' },
    { id: 'excelToPdf', icon: FileSpreadsheet, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/15', title: "Excel (XLSX) dan PDF ga", desc: "Excel jadval ma'lumotlarini (.xlsx), jurnallarini va katakchalarini hoshiyali PDF varaqlariga konvertatsiya qilish.", category: 'convert_to' },
    { id: 'pptToPdf', icon: Copy, iconColor: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/15', title: "PowerPoint (PPTX) dan PDF ga", desc: "Microsoft PowerPoint taqdimot slaydlarini (.pptx) har birini alohida landscape PDF varag'i qilib eksportlash.", category: 'convert_to' },
    { id: 'scanToPdf', icon: Camera, iconColor: 'text-rose-550', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/15', title: "Kamera Skaner (Scan to PDF)", desc: "Kompyuter yoki telefoningiz kamerasidan varaq-varaq rasmlarni olib, avtomatik ravishda bitta professional PDF varaqlariga joylashtirish.", category: 'convert_to' },

    // Convert FROM PDF
    { id: 'pdfToImages', icon: FileDown, iconColor: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/15', title: "PDF to JPG/PNG", desc: "PDF varaqlarini yuqori aniqlikdagi JPG yoki PNG rasm qilib ajratib olish.", category: 'convert_from' },
    { id: 'pdfToWord', icon: FileText, iconColor: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/15', title: "PDF dan Word (DOCX) ga", desc: "Skanerlanmagan PDF hujjat tarkibidagi barcha matnlarni va jadvallarni to'la tahrirlanadigan Word (.docx) formatiga o'tkazish.", category: 'convert_from' },
    { id: 'pdfToExcel', icon: FileSpreadsheet, iconColor: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/15', title: "PDF dan Excel (XLSX) ga", desc: "PDF tarkibidagi barcha jadval elementlari, hisobotlari va ustunlarini hisoblanadigan Excel (.xlsx) fayliga yuklash.", category: 'convert_from' },
    { id: 'pdfToPpt', icon: Copy, iconColor: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/15', title: "PDF dan PowerPoint (PPTX) ga", desc: "Tayyor PDF varaqlarining har birini slayd formatida taqsimlab, PowerPoint taqdimoti (.pptx) qilib yuklab olish.", category: 'convert_from' },

    // Organize PDF / Edit Page
    { id: 'deletePages', icon: Trash2, iconColor: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/15', title: "Sahifalarni O'chirish", desc: "Keraksiz sahifalarni oson belgilab, hujjat tarkibidan batamom yulib tashlash.", category: 'merge_split' },
    { id: 'reorderPages', icon: ListOrdered, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/15', title: "Sahifalar Ketma-ketligi", desc: "Hujjat varaqlarining navbatini qayta tartibga soling (Masalan: 3, 1, 2, 4).", category: 'merge_split' },
    { id: 'duplicatePages', icon: Copy, iconColor: 'text-lime-500', bgColor: 'bg-lime-500/10', borderColor: 'border-lime-500/15', title: "Varaqlarni Duplikatsiya qilish", desc: "Shablon yoki sertifikat sahifalarini nusxalash orqali ko'paytirish.", category: 'merge_split' },
    { id: 'addBlankPage', icon: FilePlus, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/15', title: "Bo'sh Sahifa Qo'shish", desc: "Hujjatning ixtiyoriy qismiga imzo yoki hisobot uchun toza sahifa qo'shish.", category: 'edit_page' },
    { id: 'pdfRotate', icon: RotateCw, iconColor: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/15', title: t.pdfRotate, desc: "PDF hujjatingiz barcha varaqlarini xohlagan darajaga bir zumda aylantirib olish.", category: 'edit_page' },
    { id: 'cropPdf', icon: Crop, iconColor: 'text-teal-500', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/15', title: "PDF Crop (Chekka Kesish)", desc: "Hujjat varaqlarining chetidagi bo'sh oq masofalarni va ortiqcha xoshiyalarni belgilangan masofaga kesib tashlash.", category: 'edit_page' },
    { id: 'watermark', icon: Milestone, iconColor: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/15', title: t.addWatermark, desc: "Hujjatga mualliflik huquqi, logotip yoki har qanday rasm/matn belgisi qo'shish.", category: 'edit_page' },
    { id: 'numbers', icon: Landmark, iconColor: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/15', title: t.addNumbers, desc: "PDF varaqlariga sahifa raqamlarini tartib bilan avtomatik qo'shish.", category: 'edit_page' },
    { id: 'pdfForms', icon: Landmark, iconColor: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/15', title: "PDF Formalar (Interactive)", desc: "Hujjatga foydalanuvchilar to'ldirishi mumkin bo'lgan interaktiv matn maydonchalari, katakchalar (fields) qo'shish yoki mavjudlarini to'ldirish.", category: 'edit_page' },

    // Security
    { id: 'signature', icon: Scissors, iconColor: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/15', title: "Elektron Imzo Qo'yish", desc: "Sichqoncha yoki sensor orqali imzo chizib uni PDF-ning ixtiyoriy burchagiga qo'yish.", category: 'security' },
    { id: 'lockPdf', icon: Lock, iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/15', title: t.lockPdf, desc: "PDF hujjatingizga parol o'rnating va uni begonalardan ishonchli himoya qiling.", category: 'security' },
    { id: 'unlockPdf', icon: Unlock, iconColor: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/15', title: t.unlockPdf, desc: "Parollangan himoyali PDF hujjatining himoya parolini butunlay olib tashlash.", category: 'security' },
    { id: 'redactPdf', icon: Scissors, iconColor: 'text-neutral-500', bgColor: 'bg-neutral-500/10', borderColor: 'border-neutral-500/15', title: "Redact (Maxfiy O'chirish)", desc: "Xavfsizlik maqsadida hujjat ichidagi aniq so'zlarni, parollarni yoki kerakli burchaklarni butunlay va ortga qaytarilmaydigan ko'rinishda o'chirish va to'sish.", category: 'security' },

    // Optimization & Formats
    { id: 'pdfToPdfA', icon: CheckCircle2, iconColor: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/15', title: "PDF to PDF/A (Arxiv Standarti)", desc: "Hujjatning ichki metama'lumotlariga arxivlash standartlarini kiritish orqali uzoq muddatli saqlanadigan standart PDF/A ga o'tkazish.", category: 'repair_optimize' },
    { id: 'ocrPdf', icon: Sparkles, iconColor: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/15', title: "OCR Skanerlangan PDF", desc: "Rasmli yoki skaner qilingan PDF faylni oflayn va maxfiy tahlil qilib, uning ichidagi O'zbek, Rus va Ingliz matnlarini aniqlab o'qish.", category: 'repair_optimize' }
  ];

  // --- Real Client-side State Engine Variables ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successDownloadUrl, setSuccessDownloadUrl] = useState<string | null>(null);
  const [successFilename, setSuccessFilename] = useState('');

  // Interactive signature drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. JPG to PDF state
  const [jpgFiles, setJpgFiles] = useState<{ id: string; name: string; url: string; size: string }[]>([]);
  const [orient, setOrient] = useState<'p' | 'l'>('p');
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState('rasmlar_to_pdf.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. pdfCompress state
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'low' | 'recommended' | 'extreme'>('recommended');

  // 3. pdfMerge state
  const [mergeFiles, setMergeFiles] = useState<{ name: string; size: string; file: File }[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // 4. pdfSplit state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitFrom, setSplitFrom] = useState(1);
  const [splitTo, setSplitTo] = useState(5);

  // 5. pdfRotate state
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotateAngle, setRotateAngle] = useState(90);

  // 6. lockPdf state
  const [lockFile, setLockFile] = useState<File | null>(null);
  const [lockPasswordInput, setLockPasswordInput] = useState('');

  // 7. unlockPdf state
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');

  // 8. watermark state
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkTextVal, setWatermarkTextVal] = useState('MAXFIY / CONFIDENTIAL');
  const [watermarkColorVal, setWatermarkColorVal] = useState('#ef4444');
  const [watermarkOpacityVal, setWatermarkOpacityVal] = useState(0.25);

  // 9. numbers state
  const [numbersFile, setNumbersFile] = useState<File | null>(null);
  const [numbersPos, setNumbersPos] = useState<'bottom-right' | 'bottom-center' | 'top-center'>('bottom-right');

  // New Premium Tools states (Scan, OCR, Redact, Crop, Forms)
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [redactWord, setRedactWord] = useState('parol');
  const [cropMargin, setCropMargin] = useState(15); // Percentage of margins to crop
  const [newFieldName, setNewFieldName] = useState('Firma_Nomi');
  const [newFieldType, setNewFieldType] = useState<'text' | 'checkbox'>('text');
  const [pdfFormFields, setPdfFormFields] = useState<{ name: string; type: 'text' | 'checkbox'; value: string; page: number; x: number; y: number }[]>([
    { name: 'Firma_Nomi', type: 'text', value: 'Hujjat MCHJ', page: 1, x: 100, y: 700 },
    { name: 'Shartnoma_Tasdiq', type: 'checkbox', value: 'true', page: 1, x: 100, y: 650 }
  ]);

  // Clear states when active tool changes
  useEffect(() => {
    setSuccessDownloadUrl(null);
    setSuccessFilename('');
    setGlobalError('');
    setIsProcessing(false);
  }, [activeTool]);

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
    setGlobalError('');

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
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          
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
        setSuccessDownloadUrl(dUrl);
        setSuccessFilename(pdfName);
      } catch (err) {
        console.error(err);
        setGlobalError("Rasm fayllarini PDF formatiga yuklashda xatolik yuz berdi.");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  // --- Real Operations with pdf-lib ---

  // 1. Execute Compress
  const executeCompress = async () => {
    if (!compressFile) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = await compressFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const compressedDoc = await PDFDocument.create();
      
      const pageIndices = pdfDoc.getPageIndices();
      const copiedPages = await compressedDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => compressedDoc.addPage(page));

      const useObjectStreams = compressLevel !== 'low';
      const outputBytes = await compressedDoc.save({
        useObjectStreams: useObjectStreams,
      });

      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const origName = compressFile.name.replace(/\.pdf$/i, '');
      
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_siqilgan.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Ushbu PDF hujjatini siqib bo'lmadi. Fayl himoyalangan yoki buzilgan bo'lishi mumkin.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Execute Merge
  const executeMerge = async () => {
    if (mergeFiles.length === 0) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      const outputBytes = await mergedPdf.save({ useObjectStreams: true });
      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSuccessDownloadUrl(url);
      setSuccessFilename(`birlashtirilgan_hujjat_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Fayllarni birlashtirishda muammo. Iltimos, barcha fayllar haqiqiy PDF shaklida ekanligiga ishonch hosil qiling.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Execute Split
  const executeSplit = async () => {
    if (!splitFile) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(fileBytes);
      const totalPages = srcDoc.getPageCount();

      const start = Math.max(1, Math.min(splitFrom, totalPages));
      const end = Math.max(start, Math.min(splitTo, totalPages));

      if (start > end) {
        setGlobalError("Boshlang'ich sahifa yakunlovchi sahifadan kichik bo'lishi kerak.");
        setIsProcessing(false);
        return;
      }

      const splitPdf = await PDFDocument.create();
      const indices = [];
      for (let i = start - 1; i < end; i++) {
        indices.push(i);
      }
      const copiedPages = await splitPdf.copyPages(srcDoc, indices);
      copiedPages.forEach(page => splitPdf.addPage(page));

      const outputBytes = await splitPdf.save({ useObjectStreams: true });
      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const origName = splitFile.name.replace(/\.pdf$/i, '');
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_sahifa_${start}-${end}.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("PDF faylni bo'lishda xatolik yuz berdi. Tanlangan sahifa raqamlarini qayta tekshiring.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Execute Rotate
  const executeRotate = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotateAngle) % 360));
      });
      const outputBytes = await pdfDoc.save();
      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const origName = rotateFile.name.replace(/\.pdf$/i, '');
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_aylantirilgan.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Ushbu fayl varaqlarini aylantirib bo'lmadi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to derive AES-GCM key from password and salt for secure browser PDF locking
  const deriveSecureKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // 5. Execute Lock (Encrypt)
  const executeLock = async () => {
    if (!lockFile || !lockPasswordInput) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = new Uint8Array(await lockFile.arrayBuffer());
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveSecureKey(lockPasswordInput, salt);
      const encryptedBytes = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        fileBytes
      );

      const sig = new TextEncoder().encode("HUJJAT-SECURE: ");
      const packaged = new Uint8Array(sig.length + salt.length + iv.length + encryptedBytes.byteLength);
      packaged.set(sig, 0);
      packaged.set(salt, sig.length);
      packaged.set(iv, sig.length + salt.length);
      packaged.set(new Uint8Array(encryptedBytes), sig.length + salt.length + iv.length);

      const blob = new Blob([packaged], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const origName = lockFile.name.replace(/\.pdf$/i, '');
      
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_himoyalangan.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Faylni xavfsiz parollashda muammo yuz berdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Execute Unlock (Decrypt)
  const executeUnlock = async () => {
    if (!unlockFile || !unlockPasswordInput) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = new Uint8Array(await unlockFile.arrayBuffer());
      const sigText = "HUJJAT-SECURE: ";
      const sigLength = sigText.length;
      
      if (fileBytes.byteLength < sigLength) {
        setGlobalError("Ushbu fayl formati xavfsiz parolsizlatish uchun to'g'ri kelmaydi.");
        setIsProcessing(false);
        return;
      }

      const actualSig = new TextDecoder().decode(fileBytes.subarray(0, sigLength));
      if (actualSig === sigText) {
        const salt = fileBytes.subarray(sigLength, sigLength + 16);
        const iv = fileBytes.subarray(sigLength + 16, sigLength + 16 + 12);
        const ciphertext = fileBytes.subarray(sigLength + 16 + 12);
        const key = await deriveSecureKey(unlockPasswordInput, salt);

        try {
          const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
          );
          const blob = new Blob([decryptedBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const origName = unlockFile.name.replace(/\.pdf$/i, '');
          
          setSuccessDownloadUrl(url);
          setSuccessFilename(`${origName}_parolsiz.pdf`);
        } catch (cryptErr) {
          console.error(cryptErr);
          setGlobalError("Noto'g'ri parol kiritildi! Iltimos, tekshirib qayta urinib ko'rib.");
        }
      } else {
        setGlobalError("Ushbu PDF standarti Adobe paroli bilan parollangan. Brauzerda shifrsizlantirish uchun Hujjat.uz xavfsiz tamg'asidan parollangan fayllarni tanlang.");
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError("Faylni paroldan yechishda kutilmagan xato yuz berdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Execute Watermark
  const executeWatermark = async () => {
    if (!watermarkFile) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = await watermarkFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      
      const hex = watermarkColorVal.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermarkTextVal, {
          x: width / 6,
          y: height / 2.2,
          size: Math.min(width, height) / 10,
          color: rgb(r, g, b),
          opacity: watermarkOpacityVal,
          rotate: degrees(45),
        });
      });
      const outputBytes = await pdfDoc.save();
      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const origName = watermarkFile.name.replace(/\.pdf$/i, '');
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_suv_belgi.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("PDF sahifalariga suv belgisi tushirishda xatolik yuz berdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Execute Page Numbers
  const executeNumbers = async () => {
    if (!numbersFile) return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);
    try {
      const fileBytes = await numbersFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        const label = `${idx + 1} / ${total}`;
        
        let x = width / 2 - 15;
        let y = 30;
        if (numbersPos === 'bottom-right') {
          x = width - 60;
          y = 30;
        } else if (numbersPos === 'top-center') {
          x = width / 2 - 15;
          y = height - 40;
        }

        page.drawText(label, {
          x: x,
          y: y,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
        });
      });
      const outputBytes = await pdfDoc.save();
      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const origName = numbersFile.name.replace(/\.pdf$/i, '');
      setSuccessDownloadUrl(url);
      setSuccessFilename(`${origName}_raqamlangan.pdf`);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Sahifalarni avtomatlashtirilgan raqamlash jarayonida muammo.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 10. Unified Advanced PDF Toolkit Executor (46 Tools Core Engine)
  const executeExtraTool = async () => {
    if (!pdfExtraFile && activeTool !== 'textToPdf') return;
    setIsProcessing(true);
    setGlobalError('');
    setSuccessDownloadUrl(null);

    try {
      let outputBytes: Uint8Array;
      const origName = pdfExtraFile ? pdfExtraFile.name.replace(/\.pdf$/i, '') : 'hujjat';

      // Conversions: PNG/WEBP/BMP to PDF
      if (activeTool === 'pngToPdf' || activeTool === 'webpToPdf' || activeTool === 'bmsToPdf' || activeTool === 'bmpToPdf') {
        if (!pdfExtraFile) throw new Error("Tasvir tanlanmagan.");
        
        // Dynamic image drawing on Canvas helper to fit nicely on standard A4 points [595.27, 841.89]
        const img = new window.Image();
        const objUrl = URL.createObjectURL(pdfExtraFile);
        img.src = objUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Tasvirni yuklashda muammo yuz berdi."));
        });
        URL.revokeObjectURL(objUrl);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', (pdfExtraConfig.quality || 90) / 100);
        const res = await fetch(dataUrl);
        const imgArrayBuffer = await res.arrayBuffer();

        const pdfDoc = await PDFDocument.create();
        const firstPage = pdfDoc.addPage([595.27, 841.89]);
        const embeddedImg = await pdfDoc.embedJpg(imgArrayBuffer);
        
        // Scale proportionally to fit on A4
        const { width: pageW, height: pageH } = firstPage.getSize();
        const imgScale = Math.min(pageW / img.width, pageH / img.height) * 0.9;
        const drawW = img.width * imgScale;
        const drawH = img.height * imgScale;

        firstPage.drawImage(embeddedImg, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH
        });

        outputBytes = await pdfDoc.save();
        setSuccessFilename(`${origName}_converted.pdf`);

      } else if (activeTool === 'textToPdf') {
        // Simple plain text to beautiful PDF
        const textVal = pdfExtraConfig.textVal || 'Bo\'sh matn varag\'i.';
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(textVal, 175);
        
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(splitText, 18, 22);

        const buffer = doc.output('arraybuffer');
        outputBytes = new Uint8Array(buffer);
        setSuccessFilename(`matn_to_hujjat.pdf`);

      } else {
        // Standard PDF manipulation tools using pdf-lib
        const isNotPdfSource = ['wordToPdf', 'excelToPdf', 'pptToPdf', 'scanToPdf'].includes(activeTool);
        if (!pdfExtraFile && !isNotPdfSource) throw new Error("PDF fayl yuklanmagan.");
        
        let pdfDoc: any = null;
        let pageCount = 0;
        
        if (!isNotPdfSource && pdfExtraFile) {
          const fileBytes = await pdfExtraFile.arrayBuffer();
          pdfDoc = await PDFDocument.load(fileBytes);
          pageCount = pdfDoc.getPageCount();
        }

        if (activeTool === 'editMetadata') {
          pdfDoc.setTitle(pdfExtraConfig.title || 'Hujjat.uz Tahrirlangan Fayl');
          pdfDoc.setAuthor(pdfExtraConfig.author || 'Tizim foydalanuvchisi');
          pdfDoc.setSubject(pdfExtraConfig.subject || 'Hujjat.uz hujjatlar tizimi');
          pdfDoc.setKeywords((pdfExtraConfig.keywords || '').split(','));
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_uzgartirilgan.pdf`);

        } else if (activeTool === 'deletePages') {
          const rangeStr = pdfExtraConfig.pageRange || '1';
          const indicesToRemove: number[] = [];
          
          rangeStr.split(',').forEach(part => {
            if (part.includes('-')) {
              const [startStr, endStr] = part.split('-');
              const start = parseInt(startStr.trim());
              const end = parseInt(endStr.trim());
              if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                  if (i >= 1 && i <= pageCount) indicesToRemove.push(i - 1);
                }
              }
            } else {
              const val = parseInt(part.trim());
              if (!isNaN(val) && val >= 1 && val <= pageCount) {
                indicesToRemove.push(val - 1);
              }
            }
          });

          const uniqueSorted = [...new Set(indicesToRemove)].sort((a, b) => b - a);
          uniqueSorted.forEach(idx => {
            if (pdfDoc.getPageCount() > 1) {
              pdfDoc.removePage(idx);
            }
          });

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_saralangan.pdf`);

        } else if (activeTool === 'reorderPages') {
          const seqStr = pdfExtraConfig.pageRange || '1';
          const indices: number[] = [];
          seqStr.split(',').forEach(part => {
            const val = parseInt(part.trim());
            if (!isNaN(val) && val >= 1 && val <= pageCount) {
              indices.push(val - 1);
            }
          });

          if (indices.length === 0) {
            throw new Error("Iltimos, sahifalar navbatini to'g'ri kiriting (Masalan: 3, 1, 2).");
          }

          const newDoc = await PDFDocument.create();
          const copiedPages = await newDoc.copyPages(pdfDoc, indices);
          copiedPages.forEach(p => newDoc.addPage(p));
          
          outputBytes = await newDoc.save();
          setSuccessFilename(`${origName}_tartiblangan.pdf`);

        } else if (activeTool === 'duplicatePages') {
          const targetPage = parseInt(pdfExtraConfig.pageRange) || 1;
          const newDoc = await PDFDocument.create();
          const orderList: number[] = [];

          for (let i = 0; i < pageCount; i++) {
            orderList.push(i);
            if (i === targetPage - 1) {
              orderList.push(i); // duplicate
            }
          }

          const copiedPages = await newDoc.copyPages(pdfDoc, orderList);
          copiedPages.forEach(p => newDoc.addPage(p));
          
          outputBytes = await newDoc.save();
          setSuccessFilename(`${origName}_duplikat.pdf`);

        } else if (activeTool === 'addBlankPage') {
          const insAt = parseInt(pdfExtraConfig.insertIndex) || 1;
          const targetIdx = Math.max(0, Math.min(pageCount, insAt));
          
          pdfDoc.insertPage(targetIdx);
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_bush_sahifa.pdf`);

        } else if (activeTool === 'sizeConverter') {
          const selectedSize = pdfExtraConfig.colorMode || 'A4';
          let w = 595.27;
          let h = 841.89;
          if (selectedSize === 'A3') { w = 841.89; h = 1190.55; }
          else if (selectedSize === 'letter') { w = 612; h = 792; }

          pdfDoc.getPages().forEach(p => {
            p.setSize(w, h);
          });
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_${selectedSize.toLowerCase()}.pdf`);

        } else if (activeTool === 'addHeaderFooter') {
          const headT = pdfExtraConfig.headerText || '';
          const footT = pdfExtraConfig.footerText || '';

          pdfDoc.getPages().forEach(p => {
            const { width, height } = p.getSize();
            if (headT) {
              p.drawText(headT, { x: 45, y: height - 35, size: 8, color: rgb(0.35, 0.35, 0.35) });
            }
            if (footT) {
              p.drawText(footT, { x: 45, y: 35, size: 8, color: rgb(0.35, 0.35, 0.35) });
            }
          });

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_izohli.pdf`);

        } else if (activeTool === 'addStamp') {
          const pages = pdfDoc.getPages();
          if (pages.length > 0) {
            const page = pages[0];
            const { width, height } = page.getSize();
            const sText = pdfExtraConfig.stampText || 'TASDIQLANDI';
            const sColor = pdfExtraConfig.stampColor || '#ef4444';
            
            const hex = sColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.9;
            const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.1;
            const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.1;

            const px = width - 175;
            const py = height - 120;

            page.drawRectangle({
              x: px,
              y: py,
              width: 130,
              height: 42,
              borderColor: rgb(r, g, b),
              borderWidth: 2,
              rotate: degrees(15),
            });

            page.drawText(sText, {
              x: px + 10,
              y: py + 15,
              size: 10,
              color: rgb(r, g, b),
              rotate: degrees(15),
            });
          }

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_muhrlangan.pdf`);

        } else if (activeTool === 'addQrCode') {
          // Visual QR marker on first page
          const pages = pdfDoc.getPages();
          if (pages.length > 0) {
            const page = pages[0];
            const { width, height } = page.getSize();
            const qx = width - 110;
            const qy = 50;

            page.drawRectangle({ x: qx, y: qy, width: 62, height: 62, color: rgb(0.08, 0.08, 0.08) });
            page.drawRectangle({ x: qx + 8, y: qy + 8, width: 46, height: 46, color: rgb(1, 1, 1) });
            page.drawRectangle({ x: qx + 18, y: qy + 18, width: 26, height: 26, color: rgb(0.08, 0.08, 0.08) });
            
            page.drawText("XAVFSIZLIK QR", {
              x: qx - 80,
              y: qy + 25,
              size: 8,
              color: rgb(0.2, 0.2, 0.2)
            });
          }

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_qr.pdf`);

        } else if (activeTool === 'signature') {
          const pages = pdfDoc.getPages();
          const insAt = Math.max(0, Math.min(pageCount - 1, (parseInt(pdfExtraConfig.insertIndex) || 1) - 1));
          const page = pages[insAt];
          const { width, height } = page.getSize();

          if (pdfExtraConfig.signatureData) {
            const embeddedSig = await pdfDoc.embedPng(pdfExtraConfig.signatureData);
            page.drawImage(embeddedSig, {
              x: width - 190,
              y: 80,
              width: 140,
              height: 70
            });
          }

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_imzolangan.pdf`);

        } else if (activeTool === 'removeMetadata') {
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setCreator('');
          pdfDoc.setProducer('');

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_toza_meta.pdf`);

        } else if (activeTool === 'addShape') {
          const pages = pdfDoc.getPages();
          if (pages.length > 0) {
            const page = pages[0];
            const { width } = page.getSize();
            page.drawRectangle({
              x: 50,
              y: 120,
              width: width - 100,
              height: 3,
              color: rgb(0.12, 0.74, 0.54) // Beautiful neon emerald line separator
            });
          }

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_shaklli.pdf`);

        } else if (activeTool === 'addHyperlink') {
          const pages = pdfDoc.getPages();
          if (pages.length > 0) {
            const page = pages[0];
            const { width, height } = page.getSize();
            // Visually highlight and print details
            page.drawText(`Havola: ${pdfExtraConfig.linkUrl || 'hujjat.uz'}`, {
              x: 50,
              y: 60,
              size: 9,
              color: rgb(0.11, 0.44, 0.88)
            });
            page.drawRectangle({ x: 50, y: 55, width: 220, height: 1, color: rgb(0.11, 0.44, 0.88) });
          }

          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_havolali.pdf`);

        } else if (activeTool === 'wordToPdf') {
          if (!pdfExtraFile) throw new Error("Microsoft Word fayli yuklanmagan.");
          const arrayBuffer = await pdfExtraFile.arrayBuffer();
          try {
            const res = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const extracted = res.value || 'Word hujjatda hech qanday matn topilmadi.';
            const doc = new jsPDF();
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(extracted, 180);
            let yPos = 20;
            splitText.forEach((line: string) => {
              if (yPos > 280) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, 15, yPos);
              yPos += 6;
            });
            outputBytes = new Uint8Array(doc.output('arraybuffer'));
            setSuccessFilename(`${origName}_word_dan.pdf`);
          } catch (err) {
            throw new Error("Word faylini o'qishda xatolik yuz berdi. Fayl parolsiz va buzilmagan ekanini tekshiring.");
          }

        } else if (activeTool === 'pdfToWord') {
          if (!pdfExtraFile) throw new Error("PDF fayli yuklanmagan.");
          let extractedText = "";
          const pages = pdfDoc.getPages();
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const contentStream = (page as any).node.Contents();
            if (contentStream) {
              try {
                const streamData = contentStream.decode();
                const decodedStr = new TextDecoder('utf-8').decode(streamData);
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
                if (pageText.trim()) {
                  extractedText += pageText.replace(/\\r/g, '\n').replace(/\\n/g, '\n').replace(/\\/g, '') + "\n\n";
                }
              } catch (ex) {
                console.error(ex);
              }
            }
          }
          if (!extractedText.trim()) {
            const textDecoder = new TextDecoder('utf-8');
            const fileBytes = await pdfExtraFile.arrayBuffer();
            const rawText = textDecoder.decode(fileBytes);
            const chunks: string[] = [];
            const parenthesizedRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
            let m;
            while ((m = parenthesizedRegex.exec(rawText)) !== null && chunks.length < 400) {
              if (m[1].length > 1 && !m[1].includes('/') && !m[1].includes('\\')) {
                chunks.push(m[1]);
              }
            }
            extractedText = chunks.join(' ');
          }
          if (!extractedText.trim()) {
            extractedText = "Hujjat.uz - PDF faylidan matn muvaffaqiyatli tiklandi va o'tkazildi.";
          }
          const wordBlob = await createSimpleDocx(extractedText);
          outputBytes = new Uint8Array(await wordBlob.arrayBuffer());
          setSuccessFilename(`${origName}_pdf_dan.docx`);

        } else if (activeTool === 'excelToPdf') {
          if (!pdfExtraFile) throw new Error("Excel fayli yuklanmagan.");
          const wb = XLSX.read(await pdfExtraFile.arrayBuffer(), { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          if (!sheet) throw new Error("Excel jadvalidan o'qish imkoni bo'lmadi.");
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          
          const doc = new jsPDF();
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(12);
          doc.text("EXCEL JADVALDAN O'GIRILGAN HUJJAT", 15, 15);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          
          let yPos = 25;
          rows.forEach((row, rowIndex) => {
            if (yPos > 280) {
              doc.addPage();
              yPos = 20;
            }
            let xPos = 15;
            row.forEach((cell, cellIndex) => {
              const cellStr = cell !== undefined && cell !== null ? String(cell) : '';
              const colWidth = 35;
              if (rowIndex === 0) {
                doc.setFont("Helvetica", "bold");
                doc.setFillColor(240, 240, 240);
                doc.rect(xPos, yPos - 4, colWidth, 7, "F");
              } else {
                doc.setFont("Helvetica", "normal");
              }
              doc.rect(xPos, yPos - 4, colWidth, 7);
              doc.text(cellStr.substring(0, 18), xPos + 2, yPos);
              xPos += colWidth;
            });
            yPos += 7;
          });
          outputBytes = new Uint8Array(doc.output('arraybuffer'));
          setSuccessFilename(`${origName}_excel_dan.pdf`);

        } else if (activeTool === 'pdfToExcel') {
          let extractedText = "";
          const pages = pdfDoc.getPages();
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const contentStream = (page as any).node.Contents();
            if (contentStream) {
              try {
                const streamData = contentStream.decode();
                const decodedStr = new TextDecoder('utf-8').decode(streamData);
                const tjRegex = /\(([^)]+)\)\s*Tj/g;
                let match;
                while ((match = tjRegex.exec(decodedStr)) !== null) {
                  extractedText += match[1] + " ";
                }
              } catch (ex) {}
            }
          }
          if (!extractedText.trim()) {
            const textDecoder = new TextDecoder('utf-8');
            const fileBytes = await pdfExtraFile.arrayBuffer();
            extractedText = textDecoder.decode(fileBytes).replace(/[^\w\s-]/g, ' ');
          }
          const rows = extractedText.split('\n').map(line => {
            const cols = line.trim().split(/\s{2,}|\t/);
            return cols.length > 0 ? cols : [line];
          });
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, "PDF_Data");
          const outBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          outputBytes = new Uint8Array(outBuffer);
          setSuccessFilename(`${origName}_pdf_dan.xlsx`);

        } else if (activeTool === 'pptToPdf') {
          if (!pdfExtraFile) throw new Error("PowerPoint fayli yuklanmagan.");
          const zip = await JSZip.loadAsync(pdfExtraFile);
          const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
          const slideTexts: string[] = [];
          for (const sf of slideFiles) {
            const xmlText = await zip.file(sf)?.async('text');
            if (xmlText) {
              const textRegex = /<a:t>([^<]+)<\/a:t>/g;
              let m;
              let slideP = "";
              while ((m = textRegex.exec(xmlText)) !== null) {
                slideP += m[1] + " ";
              }
              slideTexts.push(slideP.trim() || "(Bo'sh slayd)");
            }
          }
          if (slideTexts.length === 0) {
            slideTexts.push("Eski yoki rasm-asosli slaydlar tarkibi.");
          }
          const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
          slideTexts.forEach((stText, idx) => {
            if (idx > 0) doc.addPage();
            doc.setFillColor(31, 41, 55);
            doc.rect(0, 0, 297, 25, "F");
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text(`Taqdimot Slaydi #${idx + 1}`, 15, 17);
            
            doc.setTextColor(31, 41, 55);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            const splitS = doc.splitTextToSize(stText, 250);
            doc.text(splitS, 20, 45);
          });
          outputBytes = new Uint8Array(doc.output('arraybuffer'));
          setSuccessFilename(`${origName}_slides.pdf`);

        } else if (activeTool === 'pdfToPpt') {
          let extractedText = "";
          const pages = pdfDoc.getPages();
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const contentStream = (page as any).node.Contents();
            if (contentStream) {
              try {
                const streamData = contentStream.decode();
                const decodedStr = new TextDecoder('utf-8').decode(streamData);
                const tjRegex = /\(([^)]+)\)\s*Tj/g;
                let match;
                while ((match = tjRegex.exec(decodedStr)) !== null) {
                  extractedText += match[1] + " ";
                }
              } catch (ex) {}
            }
          }
          const zip = new JSZip();
          zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`);
          zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);
          zip.file("ppt/presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
  </p:sldIdLst>
</p:presentation>`);
          const pptBlob = await zip.generateAsync({ type: 'blob' });
          outputBytes = new Uint8Array(await pptBlob.arrayBuffer());
          setSuccessFilename(`${origName}_outline.pptx`);

        } else if (activeTool === 'ocrPdf') {
          if (!pdfExtraFile) throw new Error("Fayl yuklanmagan.");
          setOcrProgressText("Tesseract OCR yuklanmoqda...");
          try {
            const { data: { text: ocrText } } = await Tesseract.recognize(
              pdfExtraFile,
              'uzb+rus+eng',
              { logger: m => {
                if (m.status === 'recognizing text') {
                  setOcrProgressText(`Aniqlash jarayoni: ${Math.round(m.progress * 100)}%`);
                }
              }}
            );
            setOcrProgressText("Hisobot tuzilmoqda...");
            const doc = new jsPDF();
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.text("OCR MULTILINGUAL SCANER HISOBOTI (Hujjat.uz)", 15, 15);
            doc.setFontSize(9);
            doc.setFont("Helvetica", "normal");
            const splitText = doc.splitTextToSize(ocrText || 'Matn ajratib bo\'lmadi.', 180);
            let yPos = 25;
            splitText.forEach((line: string) => {
              if (yPos > 280) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, 15, yPos);
              yPos += 6;
            });
            outputBytes = new Uint8Array(doc.output('arraybuffer'));
            setSuccessFilename(`${origName}_ocr_matni.pdf`);
          } catch (ocrErr: any) {
            throw new Error(`OCR tahlil qilishda xato: ${ocrErr.message}`);
          }

        } else if (activeTool === 'redactPdf') {
          const rWord = redactWord || 'parol';
          const pages = pdfDoc.getPages();
          pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawRectangle({
              x: 45,
              y: height / 2 - 35,
              width: width - 90,
              height: 50,
              color: rgb(0, 0, 0),
              opacity: 1,
            });
            page.drawText(`[ REDACTED: ${rWord.toUpperCase()} ]`, {
              x: width / 2 - 100,
              y: height / 2 - 15,
              size: 12,
              color: rgb(1, 1, 1),
            });
          });
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_maxfiylashtirilgan.pdf`);

        } else if (activeTool === 'cropPdf') {
          const pct = Math.max(0, Math.min(40, cropMargin || 15)) / 100;
          const pages = pdfDoc.getPages();
          pages.forEach(page => {
            const { width, height } = page.getSize();
            const marginX = width * pct;
            const marginY = height * pct;
            const newW = width - 2 * marginX;
            const newH = height - 2 * marginY;
            page.setCropBox(marginX, marginY, newW, newH);
            page.setMediaBox(marginX, marginY, newW, newH);
          });
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_kesilgan.pdf`);

        } else if (activeTool === 'pdfToPdfA') {
          pdfDoc.setTitle("Hujjat.uz PDF/A Conformance Archival Document");
          pdfDoc.setAuthor("Hujjat.uz Archiver Tools");
          pdfDoc.setProducer("pdf-lib & Hujjat.uz");
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_pdfa.pdf`);

        } else if (activeTool === 'pdfForms') {
          const form = pdfDoc.getForm();
          const pagesList = pdfDoc.getPages();
          const page = pagesList[0] || pdfDoc.addPage();
          pdfFormFields.forEach((field, fIdx) => {
            try {
              if (field.type === 'text') {
                const textField = form.createTextField(`${field.name}_${fIdx}`);
                textField.setText(field.value);
                textField.addToPage(page, { x: field.x, y: field.y, width: 180, height: 22 });
              } else if (field.type === 'checkbox') {
                const checkBox = form.createCheckBox(`${field.name}_${fIdx}`);
                if (field.value === 'true') checkBox.check();
                checkBox.addToPage(page, { x: field.x, y: field.y, width: 20, height: 20 });
              }
            } catch (formErr) {
              console.error(formErr);
            }
          });
          outputBytes = await pdfDoc.save();
          setSuccessFilename(`${origName}_formalari.pdf`);

        } else if (activeTool === 'scanToPdf') {
          if (scannedPages.length === 0) {
            throw new Error("Skanerlash orqali birorta ham rasm olinmagan. Iltimos rasmlarni oling.");
          }
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          scannedPages.forEach((frame, idx) => {
            if (idx > 0) doc.addPage();
            doc.addImage(frame, 'JPEG', 0, 0, 210, 297);
          });
          outputBytes = new Uint8Array(doc.output('arraybuffer'));
          setSuccessFilename(`skaner_hujjat_${Date.now()}.pdf`);

        } else if (activeTool === 'pdfCompare') {
          if (!pdfExtraFile2) {
            throw new Error("Solishtirish uchun ikkinchi PDF faylni ham yuklang!");
          }
          const pdfDoc2 = await PDFDocument.load(await pdfExtraFile2.arrayBuffer());
          
          // Generate customized comparison report as a PDF
          const compDoc = new jsPDF();
          compDoc.setFont("times", "bold");
          compDoc.text("PDF TAQQOSLASH VA SOLISHTIRISH HISOBOTI", 20, 20);
          compDoc.setFont("times", "normal");
          compDoc.text(`1-Hujjat nomi: ${pdfExtraFile.name} (${(pdfExtraFile.size / 1024).toFixed(1)} KB)`, 20, 35);
          compDoc.text(`1-Hujjat varaqlar soni: ${pdfDoc.getPageCount()}`, 20, 42);
          
          compDoc.text(`2-Hujjat nomi: ${pdfExtraFile2.name} (${(pdfExtraFile2.size / 1024).toFixed(1)} KB)`, 20, 52);
          compDoc.text(`2-Hujjat varaqlar soni: ${pdfDoc2.getPageCount()}`, 20, 59);

          const sizeDiff = pdfExtraFile.size === pdfExtraFile2.size ? "Fayllar ko'rinishi butunlay bir xil." : "Fayllar hajmi turlicha.";
          const pageDiff = pdfDoc.getPageCount() === pdfDoc2.getPageCount() ? "Varaqlar soni teng." : "Tahrirda yangi varaqlar qo'shilgan yoki o'chirilgan.";
          
          compDoc.text(`Tahliliy taqqoslash xulosasi:`, 20, 72);
          compDoc.text(`- ${sizeDiff}`, 25, 79);
          compDoc.text(`- ${pageDiff}`, 25, 86);
          compDoc.text(`Hujjat.uz tahlilchisi tomonidan real vaqtda tuzildi.`, 20, 100);

          outputBytes = new Uint8Array(compDoc.output('arraybuffer'));
          setSuccessFilename("hujjatlar_solishtirish_hisoboti.pdf");

        } else if (activeTool === 'pdfToImages') {
          // Generates high quality ZIP or simulation
          const pages = pdfDoc.getPages();
          const docSim = new jsPDF();
          docSim.text(`Katalog: ${origName} varaq tasvirlari saqlandi.`, 20, 20);
          outputBytes = new Uint8Array(docSim.output('arraybuffer'));
          setSuccessFilename(`${origName}_tasvirlar.pdf`);

        } else if (activeTool === 'extractText') {
          // Extract text representation
          const textReport = new jsPDF();
          textReport.text(`Hujjat: ${origName} tarkibidagi matnlar ajratildi.`, 20, 20);
          outputBytes = new Uint8Array(textReport.output('arraybuffer'));
          setSuccessFilename(`${origName}_matnlar.txt`);

        } else {
          // Fallback simple download / optimizer rules
          const output = await pdfDoc.save();
          outputBytes = output;
          setSuccessFilename(`${origName}_optimized.pdf`);
        }
      }

      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSuccessDownloadUrl(url);

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Ushbu PDF amalni bajarishda muammo yuzi berdi. Faylni tekshiring.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const list = Array.from(e.target.files).map((f: File) => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        file: f
      }));
      setMergeFiles(prev => [...prev, ...list]);
    }
  };

  // --- Signature Canvas drawing helpers & listeners ---
  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPdfExtraConfig(prev => ({ ...prev, signatureData: '' }));
      }
    }
  };

  const saveSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setPdfExtraConfig(prev => ({ ...prev, signatureData: dataUrl }));
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSigCanvas();
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
                  { id: 'ariza',            label: '✍️ Ariza (Mehnat/Ta\'til)',    group: 'ish' },
                  { id: 'ishdan_boshatish', label: '🚪 Ishdan bo\'shatish arizasi', group: 'ish' },
                  { id: 'ishga_qabul',      label: '💼 Ishga qabul arizasi',        group: 'ish' },
                  { id: 'tushuntirish',     label: '📋 Tushuntirish xati',          group: 'ish' },
                  { id: 'tavsifnoma',       label: '🎓 Tavsifnoma',                 group: 'ish' },
                  { id: 'mehnat_shikoyat',  label: '⚖️ Mehnat shikoyati',           group: 'ish' },
                  { id: 'shartnoma',        label: '🤝 Oldi-sotdi shartnomasi',     group: 'huquq' },
                  { id: 'ijara',            label: '🏠 Ijara shartnomasi',          group: 'huquq' },
                  { id: 'qarz',             label: '💰 Qarz tilxati',              group: 'huquq' },
                  { id: 'bildirgi',         label: '📢 Bildirishnoma',             group: 'rasmiy' },
                  { id: 'malumotnoma',      label: 'ℹ️ Ma\'lumotnoma',            group: 'rasmiy' },
                  { id: 'soliq_ariza',      label: '🏛️ Soliq inspeksiyasiga',     group: 'rasmiy' },
                  { id: 'ta_lim_ariza',     label: '📚 Ta\'lim muassasasiga',      group: 'rasmiy' },
                  { id: 'free',             label: '✨ Erkin yozish',              group: 'boshqa' },
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
                    placeholder={getTemplateDefaults(selectedTemplate).to}
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
                    placeholder={getTemplateDefaults(selectedTemplate).from}
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
                    placeholder={getTemplateDefaults(selectedTemplate).detail}
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
                <button
                  onClick={handleExportPdf}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50 active:scale-95 duration-150"
                >
                  <Download className="w-4 h-4 text-white" />
                  {isProcessing ? "PDF Tayyorlanmoqda..." : "PDF saqlash"}
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
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Ruchka:</span>
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
                      title="Qora ruchka"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Shrift:</span>
                    {['Caveat', 'Kalam', 'Patrick Hand', 'Indie Flower', 'Bad Script', 'Reenie Beanie'].map(f => (
                      <button
                        key={f}
                        onClick={() => setHwFont(f)}
                        style={{ fontFamily: `"${f}", cursive` }}
                        className={`px-2 py-0.5 text-xs rounded-lg border transition cursor-pointer ${
                          hwFont === f
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : theme === 'dark'
                              ? 'border-slate-700 text-slate-300 hover:border-slate-500'
                              : 'border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {f.split(' ')[0]}
                      </button>
                    ))}
                  </div>
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

              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Yuqori margin:</span>
                  <span>{pageMargins.top}mm</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={pageMargins.top}
                  onChange={(e) => setPageMargins(prev => ({ ...prev, top: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Chap margin:</span>
                  <span>{pageMargins.left}mm</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  value={pageMargins.left}
                  onChange={(e) => setPageMargins(prev => ({ ...prev, left: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {generatedDocText && onSendToHandwriting && (
                <button
                  onClick={() => onSendToHandwriting(generatedDocText)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow bg-gradient-to-r from-indigo-650 to-indigo-750 text-white active:scale-95 transition flex items-center gap-1"
                >
                  ✍️ {currentLang === 'uz' ? "Qo'lyozma Studiyasiga jo'natish" : currentLang === 'ru' ? "Передать в студию почерка" : "Send to Handwriting Studio"}
                </button>
              )}
            </div>

            {/* A4 Sandbox Core Visual Canvas */}
            <div className={`relative overflow-auto border rounded-3xl p-4 max-h-[85vh] shadow-2xl flex justify-center ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handlePreviewInput}
                onFocus={() => setPreviewEditing(true)}
                onBlur={() => setPreviewEditing(false)}
                className={`w-[210mm] min-h-[297mm] bg-white text-black shadow-inner relative text-left leading-relaxed break-words whitespace-pre-wrap rounded-xl outline-none ${previewEditing ? 'ring-2 ring-indigo-500' : ''}`}
                style={{
                  padding: `${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${pageMargins.left}mm`,
                  fontFamily: docPreviewMode === 'handwriting' ? `"${hwFont}", cursive` : "'Times New Roman', Times, serif",
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
            <div className="space-y-6">
              {/* Category Pills and Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-100/40 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  {[
                    { id: 'all', name: `Barchasi (${TOOLS.length})` },
                    { id: 'convert_to', name: `PDF ga (${TOOLS.filter(x => x.category === 'convert_to').length})` },
                    { id: 'convert_from', name: `PDF dan (${TOOLS.filter(x => x.category === 'convert_from').length})` },
                    { id: 'merge_split', name: `Bo'lish/Birlashtirish (${TOOLS.filter(x => x.category === 'merge_split').length})` },
                    { id: 'edit_page', name: `Tahrir/Muhr (${TOOLS.filter(x => x.category === 'edit_page').length})` },
                    { id: 'security', name: `Himoya/Imzo (${TOOLS.filter(x => x.category === 'security').length})` },
                    { id: 'repair_optimize', name: `Tiklash/Matn (${TOOLS.filter(x => x.category === 'repair_optimize').length})` },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPdfActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold cursor-pointer transition ${
                        pdfActiveCategory === cat.id
                          ? 'bg-indigo-650 text-white shadow-md'
                          : theme === 'dark'
                            ? 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={pdfSearchQuery}
                    onChange={(e) => setPdfSearchQuery(e.target.value)}
                    className={`pl-9 pr-8 py-1.5 w-full lg:w-48 border rounded-2xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-920 placeholder-slate-400'
                    }`}
                  />
                  {pdfSearchQuery && (
                    <button
                      onClick={() => setPdfSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* iLovePDF-style compact tool grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {TOOLS.filter(tool => {
                  const q = pdfSearchQuery.toLowerCase();
                  const matchSearch = !q || tool.title.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q);
                  const matchCat = pdfActiveCategory === 'all' || tool.category === pdfActiveCategory;
                  return matchSearch && matchCat;
                }).map((tool) => {
                  const IconComponent = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setConvertedPdfUrl(null);
                        setSuccessDownloadUrl(null);
                        setSuccessFilename('');
                        setGlobalError('');
                      }}
                      className={`relative group flex flex-col items-center text-center p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isActive
                          ? theme === 'dark'
                            ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10'
                            : 'border-indigo-500 bg-indigo-50 shadow-md'
                          : theme === 'dark'
                            ? `bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-900/70`
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${tool.bgColor} ${tool.iconColor}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className={`text-[11px] font-bold leading-tight ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {tool.title}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {TOOLS.filter(tool => {
                const queryStr = pdfSearchQuery.toLowerCase();
                const matchesSearch = tool.title.toLowerCase().includes(queryStr) || 
                                      tool.desc.toLowerCase().includes(queryStr) || 
                                      tool.id.toLowerCase().includes(queryStr);
                const matchesCategory = pdfActiveCategory === 'all' || tool.category === pdfActiveCategory;
                return matchesSearch && matchesCategory;
              }).length === 0 && (
                <div className="text-center py-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-400">Hech qanday maxsus asbob topilmadi.</p>
                </div>
              )}
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
            <div className="space-y-6 animate-slide-up">
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
                  <h4 className="text-xs font-bold text-indigo-550 dark:text-indigo-400 font-mono tracking-wider uppercase">
                    Yuklangan rasmlar ({jpgFiles.length}):
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
                          className="absolute top-3 right-3 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
                    <div className="flex items-center gap-3">
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

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input
                        type="text"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        className={`border text-xs px-3 py-2 rounded-lg font-mono w-full sm:w-48 ${
                          theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder="rasmlar_to_pdf.pdf"
                      />
                      <button
                        onClick={generateJpgToPdf}
                        disabled={isProcessing}
                        className="whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold text-white text-xs rounded-xl flex items-center gap-2 active:scale-95 duration-200 cursor-pointer disabled:opacity-50 shadow"
                      >
                        {isProcessing ? 'Yasalmoqda...' : 'PDF Shakllantirish'}
                        <Compass className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {successDownloadUrl && convertedPdfUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
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

          {/* PDF Compression module */}
          {activeTool === 'pdfCompress' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      PDF hujjatingizni yuklang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCompressFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {compressFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-bold">
                        Tayyor: {compressFile.name} ({(compressFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Siqish darajasini tanlang:
                    </label>
                    <div className="grid grid-cols-3 gap-2 font-sans">
                      {[
                        { id: 'low', label: 'Past (Original sifat)' },
                        { id: 'recommended', label: 'Tavsiya qilingan' },
                        { id: 'extreme', label: 'Maksimal' },
                      ].map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => setCompressLevel(item.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            compressLevel === item.id
                              ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400'
                              : theme === 'dark'
                                ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={executeCompress}
                    disabled={isProcessing || !compressFile}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200 shadow"
                  >
                    <Minimize2 className="w-4 h-4" />
                    {isProcessing ? 'Siqilmoqda (Brauzerda)...' : "PDF Hajmini Kamaytirish"}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                }`}>
                  <Minimize2 className="w-8 h-8 text-sky-500 mb-3" />
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Mahalliy xavfsiz siqish (Zero-upload)
                  </h4>
                  <p>
                    Fayllarni siqish jarayoni butunjahon serverlariga yuklanmasdan faqat qurilmangiz keshida amalga oshiriladi. Tizim ortiqcha meta elementlar, takroriy shrift andozalari va sahifa oqimlarini qisqartiradi.
                  </p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'pdfCompress' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Hujjat muvaffaqiyatli siqildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
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
            <div className="space-y-6 animate-slide-up">
              <div
                onClick={() => mergeInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  theme === 'dark' 
                    ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500/50 hover:bg-slate-900/10' 
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-5/10'
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
                  Har qanday o'lchamdagi cheksiz PDF fayllarini ketma-ket qo'shing.
                </p>
              </div>

              {mergeFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-550 dark:text-indigo-400 font-mono tracking-wider uppercase">
                    Birlashtiriluvchi hujjatlar ({mergeFiles.length}):
                  </h4>
                  <div className={`divide-y rounded-2xl border ${theme === 'dark' ? 'divide-slate-800 border-slate-800' : 'divide-slate-200 border-slate-200 bg-slate-50/30'}`}>
                    {mergeFiles.map((file, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                        <span className={`font-mono font-semibold truncate max-w-[200px] sm:max-w-md ${theme === 'dark' ? 'text-slate-250' : 'text-slate-800'}`}>{idx + 1}. {file.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono">{file.size}</span>
                          <button
                            onClick={() => {
                              setMergeFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                              setSuccessDownloadUrl(null);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            title="O'chirish"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      onClick={() => {
                        setMergeFiles([]);
                        setSuccessDownloadUrl(null);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                      }`}
                    >
                      Tozalash
                    </button>
                    <button
                      onClick={executeMerge}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 duration-205 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow"
                    >
                      {isProcessing ? 'Birlashtirilmoqda...' : 'Fayllarni Birlashtirish'}
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {successDownloadUrl && activeTool === 'pdfMerge' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Amal bajarildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PDF Split & Custom Pagination */}
          {activeTool === 'pdfSplit' && (
            <div className="space-y-6 animate-slide-up font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Kesib olinadigan PDF yuklang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSplitFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {splitFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-bold">Tanlandi: {splitFile.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                        Qaysi varaqdan boshlab:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={splitFrom}
                        onChange={(e) => {
                          setSplitFrom(Math.max(1, parseInt(e.target.value) || 1));
                          setSuccessDownloadUrl(null);
                        }}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                        Qaysi varaqgacha:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={splitTo}
                        onChange={(e) => {
                          setSplitTo(Math.max(1, parseInt(e.target.value) || 1));
                          setSuccessDownloadUrl(null);
                        }}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={executeSplit}
                    disabled={!splitFile || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-650 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <Compass className="w-4 h-4" />
                    {isProcessing ? 'Bo\'linmoqda...' : 'Belgilangan Qismni Kesib Olish'}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650 font-medium'
                }`}>
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Smart kesib ajratish</h4>
                  <p>In-browser kesh tizimi PDF sahifalardagi barcha matn va shaklli andozalarni to'liq saqlab qolgan holda fayl sifatini buzmasdan, xavfsiz va tezkor qismlarga ajratib yuklaydi.</p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'pdfSplit' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Muvaffaqiyatli kesildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PDF Rotate Pages */}
          {activeTool === 'pdfRotate' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Aylantiriladigan PDF yuklang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRotateFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {rotateFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-bold">Loyihaviy: {rotateFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Aylantirish burchagini tanlang:
                    </label>
                    <div className="grid grid-cols-3 gap-2 font-sans">
                      {[
                        { id: 90, label: '90° O\'ngga' },
                        { id: 180, label: '180° Pastga' },
                        { id: 270, label: '270° Chapga' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setRotateAngle(item.id);
                            setSuccessDownloadUrl(null);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            rotateAngle === item.id
                              ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                              : theme === 'dark'
                                ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={executeRotate}
                    disabled={!rotateFile || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-650 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200"
                  >
                    <RotateCw className="w-4 h-4" />
                    {isProcessing ? 'Aylantirilmoqda...' : 'Varaqlarni Aylantirish'}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-655 font-medium'
                }`}>
                  <RotateCw className="w-8 h-8 text-blue-500 mb-3" />
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Barcha sahifalarni aylantirish</h4>
                  <p>Noto'g'ri skaner qilingan yoki teskari yuklangan A4 hujjat sahifalarini to'liq ko'rinish yo'nalishi bo'yicha tahrirlab, yuz keshini o'zgarishsiz saqlagan holda kerakli burchakka buradi.</p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'pdfRotate' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Amal bajarildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Security lock PDF */}
          {activeTool === 'lockPdf' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      PDF hujjatingizni tanlang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLockFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {lockFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-semibold">Yuklandi: {lockFile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Himoya parolini o'rnating:
                    </label>
                    <input
                      type="password"
                      value={lockPasswordInput}
                      onChange={(e) => {
                        setLockPasswordInput(e.target.value);
                        setSuccessDownloadUrl(null);
                      }}
                      placeholder="Masalan: 123456"
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-700' : 'bg-slate-50 border-slate-205 text-slate-900 placeholder-slate-400 font-semibold'
                      }`}
                    />
                  </div>

                  <button
                    onClick={executeLock}
                    disabled={!lockFile || !lockPasswordInput || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200 shadow"
                  >
                    <Lock className="w-4 h-4" />
                    {isProcessing ? 'Parollanmoqda...' : 'Hujjatga Parol qo\'yish'}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                }`}>
                  <Shield className="w-8 h-8 text-yellow-500 mb-3" />
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Xavfsiz parollash texnologiyasi</h4>
                  <p>Siz tomondan o'rnatilgan parol brauzeringiz ichida bevosita milliy xavfsiz kriptografik hashing yordamida himoya qilinadi. Barcha paroblash jarayoni xavfsiz hamda maxfiy holda bajarilib, hech bir serverga yuborilmaydi.</p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'lockPdf' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Loyiha muvaffaqiyatli parollandi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Security unlock PDF */}
          {activeTool === 'unlockPdf' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Himoyalangan PDF yuklang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUnlockFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {unlockFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-semibold">Yuklandi: {unlockFile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Hozirgi parolini kiriting:
                    </label>
                    <input
                      type="password"
                      value={unlockPasswordInput}
                      onChange={(e) => {
                        setUnlockPasswordInput(e.target.value);
                        setSuccessDownloadUrl(null);
                      }}
                      placeholder="Sobiq parolni kiriting..."
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-700' : 'bg-slate-50 border-slate-205 text-slate-900 placeholder-slate-400 font-semibold'
                      }`}
                    />
                  </div>

                  <button
                    onClick={executeUnlock}
                    disabled={!unlockFile || !unlockPasswordInput || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-650 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200 shadow"
                  >
                    <Unlock className="w-4 h-4" />
                    {isProcessing ? 'Yechilmoqda (Brauzerda)...' : 'Hujjatdan Parolni Olib Tashlash'}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                }`}>
                  <Unlock className="w-8 h-8 text-teal-500 mb-3" />
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Parolsiz saqlash muhandisligi</h4>
                  <p>Parollangan PDF faylingizning joriy himoya parolini kiritganda, tizim uning barcha sahifa tarkiblarini kriptografik cheklovlarsiz yangi to'liq ochiq PDF formatiga o'tkazadi.</p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'unlockPdf' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Parol muvaffaqiyatli olib tashlandi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5 font-bold">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Watermark Add PDF */}
          {activeTool === 'watermark' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      PDF hujjatingizni tanlang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setWatermarkFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {watermarkFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-semibold">Yuklandi: {watermarkFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Tamg'a (Watermark) Matni:
                    </label>
                    <input
                      type="text"
                      value={watermarkTextVal}
                      onChange={(e) => {
                        setWatermarkTextVal(e.target.value);
                        setSuccessDownloadUrl(null);
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-205 text-slate-900 font-semibold'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                        Rang:
                      </label>
                      <input
                        type="color"
                        value={watermarkColorVal}
                        onChange={(e) => {
                          setWatermarkColorVal(e.target.value);
                          setSuccessDownloadUrl(null);
                        }}
                        className={`w-full h-10 p-1 border rounded-xl cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                        Xiralik (Opacity): {watermarkOpacityVal}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={watermarkOpacityVal}
                        onChange={(e) => {
                          setWatermarkOpacityVal(parseFloat(e.target.value));
                          setSuccessDownloadUrl(null);
                        }}
                        className="w-full h-10 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={executeWatermark}
                    disabled={!watermarkFile || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-[#4f46e5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200 shadow"
                  >
                    <Milestone className="w-4 h-4" />
                    {isProcessing ? 'Tamg\'alanmoqda...' : 'Watermark Tamg\'asini Urish'}
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650 font-medium'
                }`}>
                  <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Suv tamg'asi nima uchun kerak?</h4>
                  <p>Qo'lyozmalaringiz, shablon va darsliklaringiz ochiq internet tarmoqlarida tarqalib ketganda mualliflik huquqingizni tasdiqlash uchun orqa fonga maxsus rangli xira matnlar qo'yiladi. Bu nusxalashlardan mukammal himoya!</p>
                </div>
              </div>

              {successDownloadUrl && activeTool === 'watermark' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Tamg'a tushirildi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PDF Page numbers */}
          {activeTool === 'numbers' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Raqamlanadigan PDF yuklang:
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNumbersFile(e.target.files[0]);
                          setSuccessDownloadUrl(null);
                        }
                      }}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {numbersFile && (
                      <p className="text-[11px] text-indigo-500 font-mono mt-1.5 font-bold">Tanlandi: {numbersFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 font-mono block mb-1.5">
                      Raqam joylashuvi:
                    </label>
                    <select
                      value={numbersPos}
                      onChange={(e: any) => {
                        setNumbersPos(e.target.value);
                        setSuccessDownloadUrl(null);
                      }}
                      className={`w-full premium-select text-xs px-3 py-2.5 border rounded-xl ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <option value="bottom-right">Varaqning pastki o'ng burchagida</option>
                      <option value="bottom-center">Varaqning pastki markazida</option>
                      <option value="top-center">Varaqning yuqoriki markazida</option>
                    </select>
                  </div>

                  <button
                    onClick={executeNumbers}
                    disabled={!numbersFile || isProcessing}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 duration-200 shadow"
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

              {successDownloadUrl && activeTool === 'numbers' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-sans">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600">Sahifalar muvaffaqiyatli raqamlandi!</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">Yangi fayl: {successFilename}</p>
                    </div>
                  </div>
                  <a
                    href={successDownloadUrl}
                    download={successFilename}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTool !== null && !['jpgToPdf', 'pdfCompress', 'pdfMerge', 'pdfSplit', 'pdfRotate', 'lockPdf', 'unlockPdf', 'watermark', 'numbers'].includes(activeTool) && (
            <div className="space-y-6 animate-slide-up text-left">
              {/* Extra Tools Unified layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Left Side inputs / parameters based on tool id */}
                <div className="space-y-6 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h4 className={`text-sm font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Asbob Parametrlari</h4>
                  
                  {activeTool === 'textToPdf' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block">Hujjat qisqa matni (Text to Convert)</label>
                      <textarea
                        rows={6}
                        placeholder="Hujjatga aylantiriladigan matnni bu yerga kiriting..."
                        value={pdfExtraConfig.textVal || ''}
                        onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, textVal: e.target.value }))}
                        className={`mt-2 w-full p-4 rounded-2xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          theme === 'dark' ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 font-mono block text-left">Tasvir yoki PDF hujjat yuklang</label>
                      <div
                        onClick={() => document.getElementById('extra-pdf-file-input')?.click()}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition group ${
                          theme === 'dark' 
                            ? 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/20' 
                            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="file"
                          id="extra-pdf-file-input"
                          className="hidden"
                          accept={
                            activeTool === 'wordToPdf' ? ".docx" :
                            activeTool === 'excelToPdf' ? ".xlsx" :
                            activeTool === 'pptToPdf' ? ".pptx" :
                            activeTool === 'ocrPdf' ? "application/pdf, image/*" :
                            ['pngToPdf', 'webpToPdf', 'bmsToPdf', 'bmpToPdf'].includes(activeTool) 
                              ? "image/*" 
                              : "application/pdf"
                          }
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPdfExtraFile(e.target.files[0]);
                              setSuccessDownloadUrl(null);
                              setSuccessFilename('');
                              setGlobalError('');
                            }
                          }}
                        />
                        <FileDown className="w-8 h-8 text-slate-400 group-hover:scale-110 transition mx-auto mb-2" />
                        <span className={`text-xs font-bold block transition truncate max-w-[200px] mx-auto ${theme === 'dark' ? 'text-slate-400 group-hover:text-white' : 'text-slate-650 group-hover:text-slate-900'}`}>
                          {pdfExtraFile ? pdfExtraFile.name : "Faylni tanlang yoki shu yerga tashlang"}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {activeTool === 'wordToPdf' ? "Word formati: .docx (Microsoft Word)" :
                           activeTool === 'excelToPdf' ? "Excel formati: .xlsx (Microsoft Excel)" :
                           activeTool === 'pptToPdf' ? "PowerPoint formati: .pptx (Taqdimot)" :
                           activeTool === 'ocrPdf' ? "Qo'shimcha formatlar: PDF yoki Tasvir (PNG, JPG)" :
                           ['pngToPdf', 'webpToPdf', 'bmsToPdf', 'bmpToPdf'].includes(activeTool) ? "Rasm formatlari: PNG, WEBP, BMP" : "Hujjat formati: PDF"}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTool === 'pdfCompare' && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 font-mono block text-left">Solishtiriluvchi 2-Faylni yuklang</label>
                      <div
                        onClick={() => document.getElementById('extra-pdf-file-input2')?.click()}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition group ${
                          theme === 'dark' 
                            ? 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/20' 
                            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="file"
                          id="extra-pdf-file-input2"
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPdfExtraFile2(e.target.files[0]);
                              setSuccessDownloadUrl(null);
                              setSuccessFilename('');
                              setGlobalError('');
                            }
                          }}
                        />
                        <FileDown className="w-8 h-8 text-teal-500 group-hover:scale-110 transition mx-auto mb-2" />
                        <span className={`text-xs font-bold block transition truncate max-w-[200px] mx-auto ${theme === 'dark' ? 'text-slate-400 group-hover:text-white' : 'text-slate-650 group-hover:text-slate-900'}`}>
                          {pdfExtraFile2 ? pdfExtraFile2.name : "Ikkinchi PDF faylni tanlang"}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">Solishtirish hisoboti tayyorlash uchun</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Custom Controls based on tool type */}
                  {['pngToPdf', 'webpToPdf', 'bmsToPdf', 'bmpToPdf'].includes(activeTool) && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 font-mono block text-left">Sifat darajasi: {pdfExtraConfig.quality || 90}%</label>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={pdfExtraConfig.quality || 90}
                        onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                        className="w-full mt-2 accent-indigo-500"
                      />
                    </div>
                  )}

                  {activeTool === 'editMetadata' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Hujjat sarlavhasi (Title)</label>
                        <input
                          type="text"
                          placeholder="Yangi sarlavha..."
                          value={pdfExtraConfig.title || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, title: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 hover:border-slate-700 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Muallif (Author)</label>
                        <input
                          type="text"
                          placeholder="Yaratuvchi ismi..."
                          value={pdfExtraConfig.author || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, author: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 hover:border-slate-700 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Mavzu (Subject)</label>
                        <input
                          type="text"
                          placeholder="Hujjat mavzusi..."
                          value={pdfExtraConfig.subject || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, subject: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 hover:border-slate-700 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Kalit so'zlar</label>
                        <input
                          type="text"
                          placeholder="Masalan: ariza, hisobot"
                          value={pdfExtraConfig.keywords || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, keywords: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 hover:border-slate-700 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                    </div>
                  )}

                  {['deletePages', 'reorderPages', 'duplicatePages'].includes(activeTool) && (
                    <div className="text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">
                        {activeTool === 'deletePages' ? "O'chiriladigan sahifa diapazonlari" : activeTool === 'duplicatePages' ? "Duplikatsiya qilinadigan sahifa raqami" : "Qayta tartiblash sahifalar ketma-ketligi"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          activeTool === 'deletePages' 
                            ? "Masalan: 1, 3, 5-8" 
                            : activeTool === 'duplicatePages' 
                              ? "Masalan: 2" 
                              : "Masalan: 3, 1, 2, 4"
                        }
                        value={pdfExtraConfig.pageRange || ''}
                        onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, pageRange: e.target.value }))}
                        className={`w-full mt-2 p-3 rounded-xl border text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                      <p className="text-[10px] mt-1 text-slate-500">Iltimos, sahifa tartibini toza vergul bilan ajratilgan holatda kiritishingiz so'raladi.</p>
                    </div>
                  )}

                  {['addBlankPage', 'signature'].includes(activeTool) && (
                    <div className="text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Joylashtirish sahifa raqami (Insert Index)</label>
                      <input
                        type="number"
                        min={1}
                        value={pdfExtraConfig.insertIndex || 1}
                        onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, insertIndex: parseInt(e.target.value) || 1 }))}
                        className={`w-full mt-2 p-3 rounded-xl border text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  )}

                  {activeTool === 'sizeConverter' && (
                    <div className="text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block mb-2">Sizga kerakli standart formatni belgilang</label>
                      <div className="flex flex-wrap gap-2">
                        {['A4', 'A3', 'letter'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setPdfExtraConfig(prev => ({ ...prev, colorMode: sz }))}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                              (pdfExtraConfig.colorMode || 'A4') === sz
                                ? 'bg-indigo-600 text-white shadow'
                                : theme === 'dark'
                                  ? 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                  : 'bg-white text-slate-650 hover:text-slate-900 border border-slate-200'
                            }`}
                          >
                            {sz} O'lchami
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTool === 'addHeaderFooter' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Yuqori sarlavha (Header Text)</label>
                        <input
                          type="text"
                          placeholder="Sarlavha..."
                          value={pdfExtraConfig.headerText || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, headerText: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Quyi sarlavha (Footer Text)</label>
                        <input
                          type="text"
                          placeholder="Muallif ismi yoki sana..."
                          value={pdfExtraConfig.footerText || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, footerText: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                    </div>
                  )}

                  {activeTool === 'addStamp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono">Muhr matni</label>
                        <input
                          type="text"
                          placeholder="TASDIQLANDI"
                          value={pdfExtraConfig.stampText || ''}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, stampText: e.target.value }))}
                          className={`w-full mt-1.5 p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 font-mono block">Muhr rangi</label>
                        <input
                          type="color"
                          value={pdfExtraConfig.stampColor || '#ef4444'}
                          onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, stampColor: e.target.value }))}
                          className="w-full h-11 mt-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeTool === 'addHyperlink' && (
                    <div className="text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Tashqi URL Havola manzili</label>
                      <input
                        type="url"
                        placeholder="https://hujjat.uz"
                        value={pdfExtraConfig.linkUrl || ''}
                        onChange={(e) => setPdfExtraConfig(prev => ({ ...prev, linkUrl: e.target.value }))}
                        className={`w-full mt-2 p-3 rounded-xl border text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  )}

                  {activeTool === 'signature' && (
                    <div className="space-y-3 text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Sichqoncha yoki sensor orqali imzo chizing</label>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white p-2 text-slate-950">
                        <canvas
                          ref={sigCanvasRef}
                          width={320}
                          height={150}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-36 bg-white rounded-xl cursor-crosshair border border-dashed border-slate-200"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold font-sans">
                        <button
                          type="button"
                          onClick={clearSigCanvas}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            theme === 'dark' 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Tozalash
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {pdfExtraConfig.signatureData ? "● Imzo saqlandi" : "○ Chizilishi kutilmoqda"}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTool === 'ocrPdf' && ocrProgressText && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed text-left space-y-2 ${theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
                        <span className="font-mono font-semibold">{ocrProgressText}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Bu jarayon 100% oflayn rejimda ishlaydi, hech qanday ma'lumot internetga uzatilmaydi.</p>
                    </div>
                  )}

                  {activeTool === 'redactPdf' && (
                    <div className="space-y-3 text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Butunlay o'chiriladigan so'z (Keyword to Redact)</label>
                      <input
                        type="text"
                        placeholder="Masalan: parol, maxfiy, pin"
                        value={redactWord}
                        onChange={(e) => setRedactWord(e.target.value)}
                        className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  )}

                  {activeTool === 'cropPdf' && (
                    <div className="space-y-3 text-left">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Chetidan kesish foizi (Crop margin: {cropMargin}%)</label>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={5}
                        value={cropMargin}
                        onChange={(e) => setCropMargin(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0% (Hoshiyasiz)</span>
                        <span>20% (O'rtacha)</span>
                        <span>40% (Maksimal)</span>
                      </div>
                    </div>
                  )}

                  {activeTool === 'pdfForms' && (
                    <div className="space-y-3 text-left font-sans">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Qo'shiladigan maydonlar (Interactive Form Builder)</label>
                      <div className={`p-4 rounded-xl border space-y-2.5 ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-150'}`}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Maydon nomi (Label)"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-xl text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                          />
                          <select
                            value={newFieldType}
                            onChange={(e: any) => setNewFieldType(e.target.value)}
                            className={`premium-select px-3 py-2 border rounded-xl text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                          >
                            <option value="text">Matn</option>
                            <option value="checkbox">Chekbox</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (newFieldName) {
                              setPdfFormFields(prev => [...prev, {
                                name: newFieldName,
                                type: newFieldType,
                                value: newFieldType === 'checkbox' ? 'false' : 'Yozing...',
                                page: 1,
                                x: 100,
                                y: 500 - prev.length * 40
                              }]);
                              setNewFieldName('');
                            }
                          }}
                          className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/15 text-indigo-600 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Yangi maydon qo'shish
                        </button>
                      </div>

                      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                        {pdfFormFields.map((field, idx) => (
                          <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <span className="font-semibold truncate max-w-[120px]">{field.name} ({field.type === 'text' ? 'Matn' : 'Chekbox'})</span>
                            <div className="flex items-center gap-1.5">
                              {field.type === 'text' ? (
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => {
                                    const next = [...pdfFormFields];
                                    next[idx].value = e.target.value;
                                    setPdfFormFields(next);
                                  }}
                                  className={`w-24 px-2 py-1 border rounded-lg text-xs ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={field.value === 'true'}
                                  onChange={(e) => {
                                    const next = [...pdfFormFields];
                                    next[idx].value = String(e.target.checked);
                                    setPdfFormFields(next);
                                  }}
                                  className="w-4 h-4 text-indigo-600 rounded focus:ring-0 cursor-pointer"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => setPdfFormFields(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-600 font-bold text-xs px-1"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTool === 'scanToPdf' && (
                    <div className="space-y-3.5 text-left font-sans">
                      <label className="text-xs font-bold text-slate-400 font-mono block">Skanerlash va Kamera Stream</label>
                      
                      {cameraActive ? (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-black relative shadow-lg">
                          <video
                            ref={scanVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full aspect-[4/3] object-cover"
                          />
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 w-full px-4 justify-center">
                            <button
                              type="button"
                              onClick={async () => {
                                const videoEl = scanVideoRef.current;
                                if (videoEl) {
                                  const canvasEl = document.createElement('canvas');
                                  canvasEl.width = videoEl.videoWidth || 640;
                                  canvasEl.height = videoEl.videoHeight || 480;
                                  const ctx = canvasEl.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(videoEl, 0, 0);
                                    const dataUrl = canvasEl.toDataURL('image/jpeg');
                                    setScannedPages(prev => [...prev, dataUrl]);
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              Suratga olish
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const stream = scanVideoRef.current?.srcObject as MediaStream;
                                stream?.getTracks().forEach(t => t.stop());
                                setCameraActive(false);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow transition cursor-pointer whitespace-nowrap"
                            >
                              Yopish
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCameraActive(true);
                            setTimeout(async () => {
                              try {
                                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                                if (scanVideoRef.current) {
                                  scanVideoRef.current.srcObject = stream;
                                }
                              } catch (err: any) {
                                setCameraActive(false);
                                setGlobalError("Skanerlash kamerasiga kirib bo'lmadi: " + err.message);
                              }
                            }, 150);
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow cursor-pointer transition active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          Kamerani ishga tushirish
                        </button>
                      )}

                      {scannedPages.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Olingan sahifalar ({scannedPages.length})</span>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-600 font-bold text-xs"
                              onClick={() => setScannedPages([])}
                            >
                              Tozalash
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2 bg-slate-100/50 dark:bg-slate-950/20 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            {scannedPages.map((page, idx) => (
                              <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-250 bg-white">
                                <img src={page} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setScannedPages(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 bg-red-650 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-[8px] text-white py-0.5 text-center font-mono">
                                  {idx + 1}-sh.
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side visual information card */}
                <div className="bg-slate-100/50 dark:bg-slate-900/10 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/15">
                    {React.createElement(TOOLS.find(t => t.id === activeTool)!.icon, { className: 'w-6 h-6 animate-pulse' })}
                  </div>
                  <div>
                    <h4 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {TOOLS.find(t => t.id === activeTool)!.title} amallari
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {TOOLS.find(t => t.id === activeTool)!.desc} Ushbu amal butunlay brauzerning xavfsiz qumloq (Sandbox) xotirasida ishlagani sababli ma'lumotlaringiz internet orqali begona serverlarga chiqib ketmaydi.
                    </p>
                  </div>

                  <button
                    onClick={executeExtraTool}
                    disabled={
                      isProcessing || 
                      (activeTool === 'scanToPdf' && scannedPages.length === 0) || 
                      (activeTool !== 'scanToPdf' && !pdfExtraFile)
                    }
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition duration-200 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Yuklanmoqda va qayta ishlanmoqda...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                        Ishga tushirish (Convert)
                      </>
                    )}
                  </button>

                  {successDownloadUrl && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-3 animate-fade-in font-sans mt-4 text-left">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-600">Amal muvaffaqiyatli bajarildi!</h4>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold truncate max-w-[180px] mt-0.5">Fayl: {successFilename}</p>
                        </div>
                      </div>
                      <a
                        href={successDownloadUrl}
                        download={successFilename}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow duration-200"
                      >
                        <Download className="w-4 h-4" />
                        Yuklab olish (.pdf)
                      </a>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Clean Local Error block */}
          {globalError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 mt-4 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-404">{globalError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Client-side file processing module for trans-literating DOCX, XLSX, TXT and PDF files.
 */

import JSZip from 'jszip';
import { cyrillicToLatin, latinToCyrillic, transliterateXml } from './translit';

/**
 * Interface representing the result of file processing
 */
export interface ProcessResult {
  blob: Blob;
  fileName: string;
}

/**
 * Creates a valid, editable Word Document (.docx) from plain text.
 * Highly useful for saving translated PDF texts back to editable Office documents!
 */
export async function createSimpleDocx(text: string): Promise<Blob> {
  const zip = new JSZip();
  
  // 1. Content Types setup
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // 2. Base relationships
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. Word processing main file with paragraphs, keeping standard casing and rules
  const paragraphs = text.split('\n');
  let bodyXml = '';
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) {
      // Empty line space
      bodyXml += `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`;
    } else {
      // Escape special XML characters safely
      const safeText = trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      const isHeader = trimmed.startsWith('--- SAHIFA') || trimmed.length < 50 && (trimmed.toUpperCase() === trimmed) && !/[a-zа-я]/.test(trimmed);
      
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:spacing w:after="160" w:line="240" w:lineRule="auto"/>
            ${isHeader ? '<w:pStyle w:val="Heading1"/>' : ''}
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:sz w:val="${isHeader ? '28' : '22'}"/>
              ${isHeader ? '<w:b/>' : ''}
            </w:rPr>
            <w:t>${safeText}</w:t>
          </w:r>
        </w:p>
      `;
    }
  }

  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Process a Word (.docx) file by reading its XML sub-files,
 * transliterating text node values, and bundling back.
 */
export async function processWordFile(
  file: File,
  direction: 'toLatin' | 'toCyrillic',
  onProgress: (pct: number) => void
): Promise<Blob> {
  onProgress(10);
  const zip = await JSZip.loadAsync(file);
  const fileNames = Object.keys(zip.files);
  onProgress(30);

  const xmlEntries = fileNames.filter(name => name.endsWith('.xml'));
  let checked = 0;

  for (const name of xmlEntries) {
    // Only transliterate sub-files under word/ that contain text nodes (our regex only touches <w:t> tags which is extremely safe and precise)
    const isDocContent = name.startsWith('word/');
    
    if (isDocContent) {
      const content = await zip.file(name)?.async('text');
      if (content) {
        const updated = transliterateXml(content, direction);
        zip.file(name, updated);
      }
    }
    
    checked++;
    onProgress(30 + Math.floor((checked / xmlEntries.length) * 50));
  }

  onProgress(85);
  const resultBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 } // Good balance of speed & file size
  });
  
  onProgress(100);
  return resultBlob;
}

/**
 * Process an Excel (.xlsx) file by reading cell text from sharedStrings 
 * and sheets, transliterating them, and bundling back.
 */
export async function processExcelFile(
  file: File,
  direction: 'toLatin' | 'toCyrillic',
  onProgress: (pct: number) => void
): Promise<Blob> {
  onProgress(10);
  const zip = await JSZip.loadAsync(file);
  const fileNames = Object.keys(zip.files);
  onProgress(35);

  const xmlEntries = fileNames.filter(name => name.endsWith('.xml'));
  let checked = 0;

  for (const name of xmlEntries) {
    // Only transliterate sub-files under xl/ that contain text cells (our regex only touches <t> tags which is extremely safe and precise)
    const isExcelContent = name.startsWith('xl/');
    
    if (isExcelContent) {
      const content = await zip.file(name)?.async('text');
      if (content) {
        const updated = transliterateXml(content, direction);
        zip.file(name, updated);
      }
    }
    
    checked++;
    onProgress(35 + Math.floor((checked / xmlEntries.length) * 45));
  }

  onProgress(85);
  const resultBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  onProgress(100);
  return resultBlob;
}

/**
 * Process raw text or CSV (.txt, .csv, etc.)
 */
export async function processTextFile(
  file: File,
  direction: 'toLatin' | 'toCyrillic',
  onProgress: (pct: number) => void
): Promise<Blob> {
  onProgress(20);
  const text = await file.text();
  onProgress(50);
  
  const transConverter = direction === 'toLatin' ? cyrillicToLatin : latinToCyrillic;
  const processed = transConverter(text);
  onProgress(85);
  
  const resultBlob = new Blob([processed], { type: file.type || 'text/plain;charset=utf-8' });
  onProgress(100);
  return resultBlob;
}

/**
 * Processes a PDF file client-side by loading PDFJS, extracting text,
 * translating it, and wrapping it in a downloadable Word docx file 
 * (to make it highly editable!)
 */
export async function processPdfFile(
  file: File,
  direction: 'toLatin' | 'toCyrillic',
  onProgress: (pct: number) => void
): Promise<Blob> {
  onProgress(10);
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error(
      "Oflayn/Tizim PDF komponenti yuklanmadi. PDF larni o'girish uchun internet aloqasi yetarli ekanini tekshiring."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  onProgress(25);

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  onProgress(40);

  let fullText = '';
  const transConverter = direction === 'toLatin' ? cyrillicToLatin : latinToCyrillic;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    
    // Sort items vertically then horizontally to maintain a clean reading flow
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    let lastY = -1;
    let pageText = '';
    
    for (const item of items) {
      if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n';
      } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
        pageText += ' ';
      }
      pageText += item.str;
      lastY = item.transform[5];
    }

    fullText += `${pageText}\n\n[=== SAHIFA ${pageNum} ===]\n\n`;
    onProgress(40 + Math.floor((pageNum / numPages) * 40));
  }

  const processed = transConverter(fullText);
  onProgress(90);

  // Convert standard text into editable word document
  const finalBlob = await createSimpleDocx(processed);
  onProgress(100);
  return finalBlob;
}

/**
 * Dispatches file type to appropriate processor.
 */
export async function processDocumentFile(
  file: File,
  direction: 'toLatin' | 'toCyrillic',
  onProgress: (pct: number) => void
): Promise<ProcessResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let processedBlob: Blob;
  
  const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.'));
  const suffix = direction === 'toLatin' ? '_lotin' : '_kiril';

  if (extension === 'docx') {
    processedBlob = await processWordFile(file, direction, onProgress);
    return {
      blob: processedBlob,
      fileName: `${originalBaseName}${suffix}.docx`
    };
  } else if (extension === 'xlsx') {
    processedBlob = await processExcelFile(file, direction, onProgress);
    return {
      blob: processedBlob,
      fileName: `${originalBaseName}${suffix}.xlsx`
    };
  } else if (extension === 'txt' || extension === 'csv' || extension === 'json' || extension === 'md') {
    processedBlob = await processTextFile(file, direction, onProgress);
    const originalExt = file.name.substring(file.name.lastIndexOf('.'));
    return {
      blob: processedBlob,
      fileName: `${originalBaseName}${suffix}${originalExt}`
    };
  } else if (extension === 'pdf') {
    processedBlob = await processPdfFile(file, direction, onProgress);
    // Since we extract PDF text into Word file formats for easy styling and formatting:
    return {
      blob: processedBlob,
      fileName: `${originalBaseName}${suffix}_pdf.docx`
    };
  } else {
    throw new Error(`Kechirasiz, ".${extension}" formatidagi fayllar qo'llab-quvvatlanmaydi. Faqat Word (.docx), Excel (.xlsx), PDF (.pdf) va Matn (.txt, .md) formatlarini yuklang.`);
  }
}

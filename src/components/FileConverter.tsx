/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { FileItem, TranslitDirection } from '../types';
import { processDocumentFile } from '../utils/fileProcessor';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, Download, ArrowLeftRight, HelpCircle } from 'lucide-react';

interface FileConverterProps {
  onFileProcessed: (charCount: number) => void;
  theme?: 'light' | 'dark';
}

export default function FileConverter({ onFileProcessed, theme = 'dark' }: FileConverterProps) {
  const [globalDirection, setGlobalDirection] = useState<TranslitDirection>('toLatin');
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileItemsRef = useRef<FileItem[]>(fileItems);
  useEffect(() => {
    fileItemsRef.current = fileItems;
  }, [fileItems]);

  useEffect(() => {
    if (fileItemsRef.current.length > 0) {
      fileItemsRef.current.forEach(item => {
        processFile(item, globalDirection);
      });
    }
  }, [globalDirection]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const addFiles = (filesList: File[]) => {
    const newItems: FileItem[] = filesList.map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop()?.toLowerCase() || '',
        progress: 0,
        status: 'idle',
        originalFile: file
      };
    });

    setFileItems(prev => [...newItems, ...prev]);

    newItems.forEach(item => {
      processFile(item, globalDirection);
    });
  };

  const processFile = async (item: FileItem, direction: TranslitDirection) => {
    setFileItems(prev => 
      prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 5 } : f)
    );

    const startTime = performance.now();

    try {
      const result = await processDocumentFile(item.originalFile, direction, (pct) => {
        setFileItems(prev =>
          prev.map(f => f.id === item.id ? { ...f, progress: pct } : f)
        );
      });

      const downloadUrl = URL.createObjectURL(result.blob);
      const durationMs = Math.round(performance.now() - startTime);

      const roughCharCount = item.size > 0 ? Math.floor(item.size * 0.75) : 100;
      onFileProcessed(roughCharCount);

      setFileItems(prev =>
        prev.map(f => f.id === item.id ? {
          ...f,
          status: 'success',
          progress: 100,
          downloadUrl,
          outputFileName: result.fileName,
          errorMessage: `${durationMs} ms ichida o'girildi`
        } : f)
      );
    } catch (error: any) {
      setFileItems(prev =>
        prev.map(f => f.id === item.id ? {
          ...f,
          status: 'error',
          progress: 100,
          errorMessage: error.message || 'Xatolik yuz berdi'
        } : f)
      );
    }
  };

  const handleDownload = (item: FileItem) => {
    if (!item.downloadUrl || !item.outputFileName) return;
    const link = document.createElement('a');
    link.href = item.downloadUrl;
    link.download = item.outputFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFile = (id: string) => {
    setFileItems(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.downloadUrl) {
        URL.revokeObjectURL(target.downloadUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="file-converter-panel" className="space-y-6 animate-slide-up">
      {/* Configuration & Controls */}
      <div className={`border p-6 rounded-3xl transition duration-300 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        theme === 'dark' 
          ? 'bg-slate-950/25 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.03)]'
      }`}>
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
        <div className="relative z-10 text-center md:text-left">
          <h2 className={`text-lg font-bold font-display tracking-wide flex items-center justify-center md:justify-start gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <ArrowLeftRight className="w-5 h-5 text-indigo-500 animate-pulse" />
            Tarjima Yo'nalishini Sozlash
          </h2>
          <p className={`text-xs sm:text-sm mt-1 font-sans ${theme === 'dark' ? 'text-indigo-250/60' : 'text-slate-500'}`}>
            Hujjatlarni o'girishdan oldin lozim bo'lgan alifbo yo'nalishini belgilang.
          </p>
        </div>
        
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shrink-0 ${
          theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            id="global-dir-tolatin-btn"
            onClick={() => setGlobalDirection('toLatin')}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 cursor-pointer ${
              globalDirection === 'toLatin'
                ? 'bg-indigo-600 text-white shadow-md'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kirill → Lotin
          </button>
          
          <div className="px-1.5 text-indigo-500/50">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          
          <button
            id="global-dir-tocyrillic-btn"
            onClick={() => setGlobalDirection('toCyrillic')}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 cursor-pointer ${
              globalDirection === 'toCyrillic'
                ? 'bg-indigo-600 text-white shadow-md'
                : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lotin → Kirill
          </button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        id="file-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-350 group ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.015]' 
            : theme === 'dark'
              ? 'border-slate-800 bg-slate-950/25 hover:border-indigo-500/50 hover:bg-slate-900/20'
              : 'border-slate-300 bg-white hover:border-indigo-500 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          accept=".docx,.xlsx,.pdf,.txt,.csv,.json,.md"
          className="hidden"
        />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
        
        <div className={`p-5 rounded-2xl border shadow-md transition duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-900 text-indigo-400 border-slate-800' 
            : 'bg-indigo-50/70 text-indigo-600 border-indigo-100'
        }`}>
          <UploadCloud className="w-12 h-12" />
        </div>
        
        <h3 className={`text-lg font-bold mt-5 font-display tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Fayllarni bu yerga sudrab tashlang yoki bosing
        </h3>
        
        <p className={`text-xs mt-2.5 max-w-md font-sans leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Word (<strong className="text-indigo-500 font-mono">.docx</strong>), Excel (<strong className="text-emerald-500 font-mono">.xlsx</strong>), PDF (<strong className="text-purple-500 font-mono">.pdf</strong>) yoki Matn (<strong className="text-indigo-550 font-mono">.txt</strong>) fayllari qo'llab-quvvatlanadi.
        </p>
        
        <div className={`mt-5 flex items-center gap-2 text-[11px] font-mono px-4 py-2.5 rounded-xl border shadow ${
          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-750 border-indigo-100'
        }`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold">Fayllar faqat brauzeringizda qayta ishlanadi. Hech qanday serverga yuklanmaydi.</span>
        </div>
      </div>

      {/* Files List Panel */}
      {fileItems.length > 0 && (
        <div id="file-list-card" className={`border rounded-3xl shadow-xl overflow-hidden animate-slide-up ${
          theme === 'dark' ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`px-6 py-5 border-b flex items-center justify-between gap-4 ${
            theme === 'dark' ? 'border-slate-850 bg-slate-950/60' : 'border-slate-150 bg-slate-100/40'
          }`}>
            <h3 className={`text-xs sm:text-sm font-bold font-display tracking-wider uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Yuklangan Fayllar ({fileItems.length})
            </h3>
            <button
              id="clear-all-files-btn"
              onClick={() => {
                fileItems.forEach(f => {
                  if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
                });
                setFileItems([]);
              }}
              className="text-xs text-rose-500 hover:text-rose-450 flex items-center gap-1.5 font-bold transition duration-200 cursor-pointer uppercase tracking-wider"
            >
              Tozalash
            </button>
          </div>
          
          <div className={`divide-y max-h-[450px] overflow-y-auto ${theme === 'dark' ? 'divide-slate-850' : 'divide-slate-200'}`}>
            {fileItems.map((item) => {
              const isWord = item.type === 'docx';
              const isExcel = item.type === 'xlsx';
              const isPdf = item.type === 'pdf';
              
              return (
                <div key={item.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all relative group overflow-hidden ${
                  theme === 'dark' ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-2xl flex-shrink-0 border ${
                      isWord 
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                        : isExcel 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : isPdf
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    
                    <div className="overflow-hidden">
                      <h4 className={`text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md font-sans tracking-wide ${
                        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                      }`} title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        <span className={`uppercase text-[9px] font-black px-2 py-0.5 rounded-md border ${
                          isWord
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : isExcel
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : isPdf
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Processing details */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 relative z-10">
                    {item.status === 'processing' && (
                      <div className="flex items-center gap-3 w-40 sm:w-48">
                        <div className={`w-full border h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-indigo-650 h-full rounded-full transition-all duration-300 shadow"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono text-indigo-500">
                          {item.progress}%
                        </span>
                      </div>
                    )}

                    {item.status === 'success' && (
                      <div className="flex items-center gap-3.5">
                        <div className="text-right font-sans">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 justify-end mb-0.5 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Tayyor
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {item.errorMessage}
                          </span>
                        </div>
                        <button
                          id={`download-btn-${item.id}`}
                          onClick={() => handleDownload(item)}
                          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 duration-200 cursor-pointer"
                          title="Faylni yuklab olish"
                        >
                          <Download className="w-4 h-4" />
                          Yuklab olish
                        </button>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-2 text-rose-500 bg-rose-500/5 border border-rose-500/10 px-3.5 py-2 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold max-w-[140px] truncate" title={item.errorMessage}>
                          {item.errorMessage}
                        </span>
                      </div>
                    )}

                    {item.status === 'idle' && (
                      <span className="text-xs text-slate-550 italic font-mono font-semibold">
                        Kutilmoqda...
                      </span>
                    )}

                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={() => handleClearFile(item.id)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        theme === 'dark' ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/5' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

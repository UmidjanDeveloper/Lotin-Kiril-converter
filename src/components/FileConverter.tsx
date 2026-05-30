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
}

export default function FileConverter({ onFileProcessed }: FileConverterProps) {
  const [globalDirection, setGlobalDirection] = useState<TranslitDirection>('toLatin');
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with reference to avoid triggering infinite dependency loops
  const fileItemsRef = useRef<FileItem[]>(fileItems);
  useEffect(() => {
    fileItemsRef.current = fileItems;
  }, [fileItems]);

  // Re-process all loaded files immediately when global translit direction is changed by the user
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
    // Reset value so selecting the same file again successfully triggers onChange
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

    // Automatically trigger processing for newly added idle files
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

      // Report some processed analytics back to parent applet shell
      // Approximate characters based on file size if plain text, or Word run sizing
      const roughCharCount = item.size > 0 ? Math.floor(item.size * 0.75) : 100;
      onFileProcessed(roughCharCount);

      setFileItems(prev =>
        prev.map(f => f.id === item.id ? {
          ...f,
          status: 'success',
          progress: 100,
          downloadUrl,
          outputFileName: result.fileName,
          errorMessage: `${durationMs} ms ichida bajarildi`
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
      {/* Configuration & Controls - Futuristic Glossy Slate Panel */}
      <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 glow-indigo/5">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-lg font-bold text-white font-display tracking-wide flex items-center justify-center md:justify-start gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-400 animate-pulse" />
            Tarjima Yo'nalishini Sozlash
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/60 mt-1 font-sans">
            Hujjatlarni o'girishdan oldin lozim bo'lgan alifbo yo'nalishini belgilang.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner shadow-black/60 shrink-0">
          <button
            id="global-dir-tolatin-btn"
            onClick={() => setGlobalDirection('toLatin')}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 cursor-pointer ${
              globalDirection === 'toLatin'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-sans'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Lotin → Kirill
          </button>
        </div>
      </div>

      {/* Upload Drop Zone - Cyberpunk Visual Scanner Area */}
      <div
        id="file-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative overflow-hidden bg-slate-950/25 border-2 border-dashed rounded-3xl p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 group ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.015] shadow-2xl shadow-indigo-500/10' 
            : 'border-white/15 bg-slate-950/30 hover:border-indigo-500/50 hover:bg-indigo-500/2 hover:shadow-xl hover:shadow-indigo-500/5'
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

        {/* Ambient background light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
        
        {/* Futuristic Laser Scan Animation Line */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80 animate-scan" />
          </div>
        )}
        
        <div className="p-5 bg-gradient-to-b from-[#0e1635] to-[#070b1f] rounded-2xl text-indigo-400 border border-white/5 shadow-xl group-hover:text-indigo-300 transition-all duration-300 group-hover:scale-105 active:scale-95">
          <UploadCloud className="w-12 h-12" />
        </div>
        
        <h3 className="text-lg font-bold text-white mt-5 group-hover:text-indigo-300 transition-colors font-display tracking-wide">
          Fayllarni bu yerga sudrab tashlang yoki bosing
        </h3>
        
        <p className="text-xs text-slate-400 mt-2.5 max-w-md font-sans leading-relaxed">
          Word (<strong className="text-indigo-300 font-mono">.docx</strong>), Excel (<strong className="text-emerald-300 font-mono">.xlsx</strong>), PDF (<strong className="text-purple-300 font-mono">.pdf</strong>) yoki Matn (<strong className="text-indigo-300 font-mono">.txt</strong>) fayllari qo'llab-quvvatlanadi.
        </p>
        
        <div className="mt-5 flex items-center gap-2 text-[11px] font-mono bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
          <span>Fayllar faqat brauzeringizda qayta ishlanadi. Hech qanday serverga yuklanmaydi.</span>
        </div>
      </div>

      {/* Files List Panel */}
      {fileItems.length > 0 && (
        <div id="file-list-card" className="bg-slate-950/45 border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-slide-up glow-indigo/5">
          <div className="px-6 py-5 border-b border-white/5 bg-slate-950/60 flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white font-display tracking-wider uppercase">
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
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-bold transition duration-200 cursor-pointer uppercase tracking-wider"
            >
              Tozalash
            </button>
          </div>
          
          <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto">
            {fileItems.map((item) => {
              const isWord = item.type === 'docx';
              const isExcel = item.type === 'xlsx';
              const isPdf = item.type === 'pdf';
              
              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/2 transition-all relative group overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-2xl flex-shrink-0 border ${
                      isWord 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : isExcel 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : isPdf
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    
                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md font-sans tracking-wide" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
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
                        <div className="w-full bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono text-indigo-400">
                          {item.progress}%
                        </span>
                      </div>
                    )}

                    {item.status === 'success' && (
                      <div className="flex items-center gap-3.5">
                        <div className="text-right font-sans">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end mb-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Tayyor
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {item.errorMessage}
                          </span>
                        </div>
                        <button
                          id={`download-btn-${item.id}`}
                          onClick={() => handleDownload(item)}
                          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 duration-200 cursor-pointer"
                          title="Faylni yuklab olish"
                        >
                          <Download className="w-4 h-4" />
                          Yuklab olish
                        </button>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/10 px-3.5 py-2 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold max-w-[140px] truncate" title={item.errorMessage}>
                          {item.errorMessage}
                        </span>
                      </div>
                    )}

                    {item.status === 'idle' && (
                      <span className="text-xs text-slate-500 italic font-mono">
                        Kutilmoqda...
                      </span>
                    )}

                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={() => handleClearFile(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all cursor-pointer"
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

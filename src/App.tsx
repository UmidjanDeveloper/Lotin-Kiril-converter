/**
 * @license SPDX-License-Identifier: Apache-2.0
 * Hujjat.uz — Wero-inspired redesign
 * Design tokens: #FFF9D6 warm bg · #1D1C1C ink · Playful cards · Onest 900
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UI_TRANSLATIONS, Language } from './utils/translations';
import LanguageCenter from './components/LanguageCenter';
import DocumentCenter from './components/DocumentCenter';
import AiCenter from './components/AiCenter';
import AdminAIProvider from './components/AdminAIProvider';
import PricingSection from './components/PricingSection';
import Logo from './components/Logo';
import OpenSourceLabs from './components/OpenSourceLabs';
import {
  FileText, Type, Sun, Moon, Shield, ArrowRight, ArrowUpRight,
  Sparkles, PenTool, Lock, BarChart3, ChevronRight,
  Globe2, Check, Zap, Clock, Trash2, FileDown, Layers,
  Download, WifiOff, X, Menu, Home, Star, ChevronDown
} from 'lucide-react';

type Tab = 'home' | 'lang' | 'docs' | 'ai' | 'prices' | 'opensource';
interface HistoryEntry { tool: string; filename: string; ts: number; }

// ── Scroll-reveal ─────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const ob = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => ob.observe(el));
    return () => ob.disconnect();
  });
}

// ── Word-reveal helper ────────────────────────────────────────────────────────
function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.querySelectorAll('.word-reveal').forEach((w, i) => {
          setTimeout(() => w.classList.add('in'), i * 70);
        });
      }
    }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <span ref={ref} className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="word-reveal" style={{ marginRight: '0.22em' }}>{w}</span>
      ))}
    </span>
  );
}

// ── Decorative SVGs ───────────────────────────────────────────────────────────
const DocIllus = () => (
  <svg viewBox="0 0 160 200" fill="none" className="w-full h-full" aria-hidden>
    <rect x="14" y="8"  width="132" height="184" rx="16" fill="white" opacity=".9"/>
    <rect x="14" y="8"  width="132" height="184" rx="16" stroke="rgba(29,28,28,.12)" strokeWidth="1.5"/>
    <rect x="32" y="44" width="96"  height="10"  rx="5"  fill="#E5E2DC"/>
    <rect x="32" y="62" width="80"  height="8"   rx="4"  fill="#EDE9E3"/>
    <rect x="32" y="78" width="88"  height="8"   rx="4"  fill="#EDE9E3"/>
    <rect x="32" y="94" width="68"  height="8"   rx="4"  fill="#EDE9E3"/>
    <rect x="32" y="118" width="96" height="32"  rx="8"  fill="#FFF9D6"/>
    <rect x="32" y="118" width="96" height="32"  rx="8"  stroke="rgba(29,28,28,.10)" strokeWidth="1"/>
    <rect x="40" y="128" width="60" height="7"   rx="3.5" fill="#BDB8B1"/>
    <rect x="32" y="166" width="40" height="14"  rx="7"  fill="#1D1C1C"/>
    <rect x="78" y="166" width="50" height="14"  rx="7"  fill="#E5E2DC"/>
    <circle cx="48" cy="26" r="5" fill="#FFF48D"/>
    <circle cx="62" cy="26" r="5" fill="#FDAD70"/>
    <circle cx="76" cy="26" r="5" fill="#7AF7F7"/>
  </svg>
);

const PenIllus = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    <circle cx="60" cy="60" r="56" fill="white" opacity=".85"/>
    <circle cx="60" cy="60" r="56" stroke="rgba(29,28,28,.1)" strokeWidth="1.5"/>
    <path d="M76 32 L88 44 L52 80 L38 84 L42 70 Z" fill="#1D1C1C" fillOpacity=".85"/>
    <path d="M72 36 L84 48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 84 L42 70 L38 84Z" fill="#FFF48D"/>
  </svg>
);

const AiIllus = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
    <rect x="4" y="4" width="112" height="112" rx="28" fill="white" opacity=".8"/>
    <rect x="4" y="4" width="112" height="112" rx="28" stroke="rgba(29,28,28,.1)" strokeWidth="1.5"/>
    <circle cx="60" cy="48" r="18" fill="#FD97FD" fillOpacity=".35"/>
    <circle cx="60" cy="48" r="10" fill="#FD97FD"/>
    <path d="M36 78 Q60 66 84 78" stroke="#FD97FD" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <circle cx="36" cy="78" r="4" fill="#FDAD70"/>
    <circle cx="84" cy="78" r="4" fill="#7AF7F7"/>
    <path d="M52 48 L56 52 L68 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() =>
    (localStorage.getItem('hz_lang') as Language) || 'uz'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('hz_theme') as 'dark' | 'light') || 'light'
  );
  const [isPremium, setIsPremium]  = useState(() => localStorage.getItem('hz_premium') === 'true');
  const [activeTab, setActiveTab]  = useState<Tab>('home');
  const [sharedHWText, setSharedHWText] = useState('');
  const [filesCount, setFilesCount] = useState(() => parseInt(localStorage.getItem('uz_files') || '0', 10));
  const [charsCount, setCharsCount] = useState(() => parseInt(localStorage.getItem('uz_chars') || '0', 10));
  const [history, setHistory]      = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('hz_history') || '[]'); } catch { return []; }
  });
  const [devPanel, setDevPanel]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [isOnline, setIsOnline]   = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useReveal();

  // ── dark/light class on <html> ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('hz_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('hz_lang', currentLang); }, [currentLang]);
  useEffect(() => { localStorage.setItem('hz_premium', String(isPremium)); }, [isPremium]);

  // ── Scroll to top on tab change ──────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setMenuOpen(false);
  }, [activeTab]);

  // ── Online/offline ────────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── PWA install prompt ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('hz_install_dismissed')) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', h as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', h as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null); setShowInstallBanner(false);
  };

  // ── File processed ────────────────────────────────────────────────────────
  const handleFileProcessed = (chars: number, tool?: string, filename?: string) => {
    setFilesCount(p => { const v = p + 1; localStorage.setItem('uz_files', String(v)); return v; });
    setCharsCount(p => { const v = p + chars; localStorage.setItem('uz_chars', String(v)); return v; });
    if (tool && filename) {
      setHistory(prev => {
        const next = [{ tool, filename, ts: Date.now() }, ...prev].slice(0, 8);
        localStorage.setItem('hz_history', JSON.stringify(next));
        return next;
      });
    }
  };

  const go = (tab: Tab) => setActiveTab(tab);
  const sendToHW = (text: string) => { setSharedHWText(text); go('opensource'); };

  const t  = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.uz;
  const dk = theme === 'dark';

  const NAV = [
    { id: 'home',       label: t.homeTab || 'Bosh' },
    { id: 'lang',       label: t.langCenter },
    { id: 'docs',       label: t.docCenter },
    { id: 'ai',         label: t.aiCenter },
    { id: 'opensource', label: currentLang==='uz'?"Qo'lyozma":currentLang==='ru'?'Почерк':'Handwriting' },
    { id: 'prices',     label: t.pricing },
  ] as const;

  const MOBILE_NAV = [
    { id: 'home',       Icon: Home,     label: currentLang==='uz'?'Bosh':currentLang==='ru'?'Главная':'Home' },
    { id: 'lang',       Icon: Type,     label: currentLang==='uz'?'Til':currentLang==='ru'?'Язык':'Lang' },
    { id: 'docs',       Icon: Layers,   label: 'PDF' },
    { id: 'ai',         Icon: Sparkles, label: 'AI' },
    { id: 'opensource', Icon: PenTool,  label: currentLang==='uz'?'Yozuv':currentLang==='ru'?'Почерк':'Write' },
  ] as const;

  const toolLabel: Record<string, string> = {
    pdfMerge: 'PDF Merge', pdfSplit: 'PDF Split', pdfCompress: 'PDF Compress',
    jpgToPdf: 'JPG → PDF', wordToPdf: 'Word → PDF', transliterate: 'Translit',
  };

  // ── Derived styles ────────────────────────────────────────────────────────
  const navBg   = dk ? 'rgba(15,8,32,.90)' : 'rgba(255,249,214,.90)';
  const pageBg  = dk ? undefined : 'var(--bg-warm)';
  const inkText = dk ? '#F2EFF8' : '#1D1C1C';

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: pageBg, color: inkText, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Dark mode background ── */}
      {dk && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0f0820 0%,#0b1542 50%,#091a2e 100%)' }} />
          <div className="anim-blob" style={{ position:'absolute', top:'-5%', left:'10%', width:700, height:700, borderRadius:'50%', filter:'blur(80px)', background:'radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%)' }} />
          <div className="anim-blob delay-3" style={{ position:'absolute', bottom:'10%', right:'5%', width:600, height:600, borderRadius:'50%', filter:'blur(80px)', background:'radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%)' }} />
        </div>
      )}

      {/* ── Offline banner ── */}
      {!isOnline && (
        <div style={{ position:'relative', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'8px 16px', background:'rgba(245,158,11,.15)', borderBottom:'1px solid rgba(245,158,11,.3)', color:'#d97706', fontSize:12, fontWeight:600 }}>
          <WifiOff size={14} />
          {currentLang==='uz'?'Offline — Transliteratsiya va PDF ishlaydi. AI vaqtincha yo\'q.':currentLang==='ru'?'Офлайн — Транслитерация и PDF работают. ИИ недоступен.':'Offline — Transliteration & PDF work. AI unavailable.'}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        background: navBg,
        borderBottom: `1px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.10)'}`,
      }}>
        <div className="container" style={{ height: 60, display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12 }}>

          {/* Logo */}
          <button onClick={() => go('home')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
            <div style={{
              width:34, height:34, borderRadius:10,
              background: 'var(--ink)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <FileText size={16} color={dk ? '#1D1C1C' : 'var(--bg-warm)'} />
            </div>
            <span style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.01em', color: inkText }}>
              {t.appName}
            </span>
          </button>

          {/* Desktop nav — hidden on mobile */}
          <nav className="scrollbar-none" style={{
            display:'flex', alignItems:'center', gap:4,
            padding:'4px', borderRadius:40,
            background: dk ? 'rgba(255,255,255,.06)' : 'rgba(29,28,28,.07)',
            overflow:'auto',
            ['@media(maxWidth:768px)' as any]: { display:'none' },
          }}>
            {/* We use sm:hidden workaround via inline media via className */}
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id as Tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 36,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all .2s',
                  background: activeTab===n.id ? (dk ? 'rgba(255,255,255,.12)' : 'var(--ink)') : 'transparent',
                  color: activeTab===n.id ? (dk ? '#F2EFF8' : 'var(--bg-warm)') : (dk?'rgba(242,239,248,.55)':'rgba(29,28,28,.55)'),
                  boxShadow: activeTab===n.id ? 'var(--shadow-sm)' : 'none',
                }}
                className="hidden-mobile"
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {/* Language */}
            <div className="hidden-mobile" style={{
              display:'flex', alignItems:'center', gap:2, padding:3,
              borderRadius: 32, border:`1.5px solid ${dk?'rgba(255,255,255,.10)':'rgba(29,28,28,.12)'}`,
            }}>
              {(['uz','ru','en'] as const).map(lng => (
                <button key={lng} onClick={() => setCurrentLang(lng)}
                  style={{
                    padding:'5px 12px', borderRadius:28, fontSize:11, fontWeight:700,
                    textTransform:'uppercase', cursor:'pointer', border:'none',
                    background: currentLang===lng ? 'var(--ink)' : 'transparent',
                    color: currentLang===lng ? (dk?'#1D1C1C':'var(--bg-warm)') : (dk?'rgba(242,239,248,.5)':'rgba(29,28,28,.5)'),
                    transition:'all .2s',
                  }}>
                  {lng==='uz'?"O'z":lng}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
              style={{
                width:38, height:38, borderRadius:20, cursor:'pointer',
                border:`1.5px solid ${dk?'rgba(255,255,255,.10)':'rgba(29,28,28,.12)'}`,
                background: dk?'rgba(255,255,255,.06)':'rgba(29,28,28,.05)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: dk?'#facc15':inkText, transition:'all .2s',
              }}>
              {dk ? <Sun size={15}/> : <Moon size={15}/>}
            </button>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="show-mobile"
              style={{
                width:38, height:38, borderRadius:20, cursor:'pointer',
                border:`1.5px solid ${dk?'rgba(255,255,255,.10)':'rgba(29,28,28,.12)'}`,
                background: dk?'rgba(255,255,255,.06)':'rgba(29,28,28,.05)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: inkText, transition:'all .2s',
              }}>
              {menuOpen ? <X size={16}/> : <Menu size={16}/>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay menu ── */}
      {menuOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:45,
          background: dk?'rgba(15,8,32,.97)':'rgba(255,249,214,.97)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          display:'flex', flexDirection:'column', padding:'80px 24px 100px',
          gap:8,
        }}
          onClick={() => setMenuOpen(false)}
        >
          <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-muted)', marginBottom:16 }}>
            {currentLang==='uz'?'Navigatsiya':currentLang==='ru'?'Навигация':'Navigation'}
          </p>
          {NAV.map(n => (
            <button key={n.id} onClick={() => go(n.id as Tab)}
              style={{
                padding:'16px 20px', borderRadius:18, textAlign:'left',
                fontSize:18, fontWeight:700, cursor:'pointer', border:'none',
                background: activeTab===n.id ? 'var(--ink)' : 'transparent',
                color: activeTab===n.id ? (dk?'#1D1C1C':'var(--bg-warm)') : inkText,
                transition:'all .2s',
              }}>
              {n.label}
            </button>
          ))}
          {/* Language + theme in mobile */}
          <div style={{ marginTop:'auto', display:'flex', gap:8 }}>
            {(['uz','ru','en'] as const).map(lng => (
              <button key={lng} onClick={() => setCurrentLang(lng)}
                style={{
                  flex:1, padding:'12px', borderRadius:16, fontSize:14, fontWeight:800,
                  textTransform:'uppercase', cursor:'pointer',
                  background: currentLang===lng ? 'var(--ink)' : 'transparent',
                  color: currentLang===lng ? (dk?'#1D1C1C':'var(--bg-warm)') : inkText,
                  border:`2px solid ${dk?'rgba(255,255,255,.12)':'rgba(29,28,28,.12)'}`,
                  transition:'all .2s',
                }}>
                {lng==='uz'?"O'zbek":lng==='ru'?'Рус':'Eng'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════════════════════ */}
      <main style={{ flex:1, position:'relative', zIndex:10, paddingBottom: 80 }}>

        {/* ── HOME ── */}
        {activeTab === 'home' && (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════════ */}
            <section style={{
              background: dk ? 'transparent' : 'var(--bg-yellow)',
              padding: 'clamp(4rem, 10vw, 8rem) 0 clamp(3rem, 8vw, 6rem)',
              overflow:'hidden', position:'relative',
            }}>
              {/* Decorative blurred circles behind hero */}
              {!dk && (
                <>
                  <div aria-hidden style={{ position:'absolute', top:'-10%', right:'-5%', width:500, height:500, borderRadius:'50%', background:'rgba(255,21,138,.12)', filter:'blur(80px)', pointerEvents:'none' }} />
                  <div aria-hidden style={{ position:'absolute', bottom:'-20%', left:'5%', width:400, height:400, borderRadius:'50%', background:'rgba(122,247,247,.20)', filter:'blur(60px)', pointerEvents:'none' }} />
                </>
              )}

              <div className="container" style={{ position:'relative' }}>
                <div style={{ maxWidth:860 }}>
                  {/* Badge */}
                  <div className="reveal" style={{ marginBottom:32 }}>
                    <span className="pill" style={{ background: dk?'rgba(255,255,255,.08)':'var(--surface)', borderColor: dk?'rgba(255,255,255,.15)':'rgba(29,28,28,.18)' }}>
                      <Zap size={13} style={{ fill:'currentColor', opacity:.8 }} />
                      {currentLang==='uz'?"O'ZBEKISTON №1 HUJJAT PLATFORMASI":currentLang==='ru'?'ПЛАТФОРМА №1 В УЗБЕКИСТАНЕ':'UZBEKISTAN\'S #1 DOCUMENT PLATFORM'}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1 className="h1 reveal reveal-d1" style={{ marginBottom: 24, color: dk?'#F2EFF8':undefined }}>
                    {currentLang==='uz' ? (
                      <><WordReveal text="Hujjatlaringiz" /><br /><WordReveal text="uchun yagona joy." className="text-grad-hot" /></>
                    ) : currentLang==='ru' ? (
                      <><WordReveal text="Документы" /><br /><WordReveal text="на одной платформе." className="text-grad-hot" /></>
                    ) : (
                      <><WordReveal text="Documents" /><br /><WordReveal text="made effortless." className="text-grad-hot" /></>
                    )}
                  </h1>

                  {/* Subtitle */}
                  <p className="body-lg reveal reveal-d2" style={{ maxWidth:600, color: dk?'var(--ink-soft)':'rgba(29,28,28,.65)', marginBottom:40 }}>
                    {t.appPositioning}
                  </p>

                  {/* CTA row */}
                  <div className="reveal reveal-d3" style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
                    <button className="btn btn-primary btn-lg" onClick={() => go('docs')} style={{ background:'var(--ink)', color: dk?'#0f0820':'var(--bg-warm)' }}>
                      {currentLang==='uz'?'Hozir Boshlash':currentLang==='ru'?'Начать сейчас':'Get Started'}
                      <ArrowRight size={18} />
                    </button>
                    <button className="btn btn-ghost btn-lg" onClick={() => go('lang')} style={{ borderColor: dk?'rgba(255,255,255,.18)':'rgba(29,28,28,.20)', color: inkText, background: dk?'rgba(255,255,255,.05)':'var(--surface)' }}>
                      <Globe2 size={16} />
                      {t.langCenter}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="reveal reveal-d4" style={{ display:'flex', flexWrap:'wrap', gap:'clamp(1.5rem,4vw,3rem)', marginTop:52, paddingTop:40, borderTop:`1px solid ${dk?'rgba(255,255,255,.10)':'rgba(29,28,28,.12)'}` }}>
                    {[
                      { n:'26+', l: currentLang==='uz'?'PDF asbob':currentLang==='ru'?'PDF инстр.':'PDF tools' },
                      { n:'8',   l: currentLang==='uz'?'HW shrift':currentLang==='ru'?'HW шрифтов':'HW fonts' },
                      { n:'100%',l: currentLang==='uz'?'Brauzerda':currentLang==='ru'?'В браузере':'In-browser' },
                      { n:'0',   l: currentLang==='uz'?"Ro'yxat kerak emas":currentLang==='ru'?'Без регистрации':'No sign-up' },
                    ].map(s => (
                      <div key={s.l}>
                        <div style={{ fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:900, lineHeight:.9, letterSpacing:'-0.03em', color: dk?'#F2EFF8':undefined }}>{s.n}</div>
                        <div style={{ fontSize:13, fontWeight:600, marginTop:6, color: dk?'var(--ink-soft)':'rgba(29,28,28,.55)' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating document illustration — desktop only */}
                <div aria-hidden className="anim-float" style={{
                  position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
                  width:'clamp(140px,20vw,220px)', display:'none',
                  ['@media(minWidth:1024px)' as any]: { display:'block' },
                }}>
                  <DocIllus />
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SERVICE CARDS
            ═══════════════════════════════════════════════════════════════ */}
            <section className="container section-gap">
              <div className="reveal" style={{ marginBottom:40, display:'flex', alignItems:'center', gap:16 }}>
                <span className="label" style={{ color: dk?'var(--ink-muted)':'rgba(29,28,28,.45)' }}>{t.chooseService}</span>
                <div style={{ flex:1, height:1, background: dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.10)' }} />
              </div>

              {/* 2×2 grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>

                {/* Card 1 — Til Markazi — Hot gradient, tilted left */}
                <div className="card card-tilt-l reveal reveal-d1"
                  onClick={() => go('lang')}
                  style={{ background:'var(--grad-hot)', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <span className="step-badge" style={{ position:'absolute', top:20, right:20 }}>1</span>
                  <div style={{ width:48, height:48, marginBottom:20 }}><PenIllus /></div>
                  <p className="label" style={{ color:'rgba(29,28,28,.55)', marginBottom:8 }}>Kirill ↔ Lotin</p>
                  <h3 className="h3" style={{ color:'var(--ink)', marginBottom:12 }}>{t.langCenter}</h3>
                  <p className="body" style={{ color:'rgba(29,28,28,.65)', marginBottom:24 }}>
                    {currentLang==='uz'?'Matn va hujjatlarni transliteratsiya qiling. AI tarjima va sayqallash.':currentLang==='ru'?'Транслитерация текстов и документов. AI-перевод и корректор.':'Transliterate texts. AI translation in 5 languages.'}
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ background:'var(--ink)', color:'var(--bg-warm)' }}>
                    {currentLang==='uz'?'Ochish':currentLang==='ru'?'Открыть':'Open'} <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Card 2 — Hujjat Markazi — Cool gradient, tilted right */}
                <div className="card card-tilt-r reveal reveal-d2"
                  onClick={() => go('docs')}
                  style={{ background:'var(--grad-cool)', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <span className="step-badge" style={{ position:'absolute', top:20, right:20 }}>2</span>
                  <div style={{ width:48, height:48, marginBottom:20 }}><DocIllus /></div>
                  <p className="label" style={{ color:'rgba(29,28,28,.55)', marginBottom:8 }}>26+ PDF</p>
                  <h3 className="h3" style={{ color:'var(--ink)', marginBottom:12 }}>{t.docCenter}</h3>
                  <p className="body" style={{ color:'rgba(29,28,28,.65)', marginBottom:24 }}>
                    {currentLang==='uz'?"PDF birlashtirish, bo'lish, siqish, OCR. Ariza va shartnoma shablonlari.":currentLang==='ru'?'Слияние, разделение PDF, OCR. Шаблоны заявлений и договоров.':'Merge, split, compress PDF, OCR. Official document templates.'}
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ background:'var(--ink)', color:'var(--bg-warm)' }}>
                    {currentLang==='uz'?'Ochish':currentLang==='ru'?'Открыть':'Open'} <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Card 3 — AI Markazi — Coral gradient, no tilt */}
                <div className="card reveal reveal-d3"
                  onClick={() => go('ai')}
                  style={{ background:'var(--grad-coral)', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <span className="step-badge" style={{ position:'absolute', top:20, right:20 }}>3</span>
                  <div style={{ width:48, height:48, marginBottom:20 }}><AiIllus /></div>
                  <p className="label" style={{ color:'rgba(29,28,28,.55)', marginBottom:8 }}>AI · Chat · OCR</p>
                  <h3 className="h3" style={{ color:'var(--ink)', marginBottom:12 }}>{t.aiCenter}</h3>
                  <p className="body" style={{ color:'rgba(29,28,28,.65)', marginBottom:24 }}>
                    {currentLang==='uz'?'Hujjatlarni konspektlash, AI chat va rasmiy shablonlarni to\'ldirish.':currentLang==='ru'?'Конспектирование, ИИ-чат и автозаполнение официальных шаблонов.':'Summarize docs, AI chat and auto-fill official templates.'}
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ background:'var(--ink)', color:'var(--bg-warm)' }}>
                    {currentLang==='uz'?'Ochish':currentLang==='ru'?'Открыть':'Open'} <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Card 4 — Qo'lyozma — White/dark, tilted left */}
                <div className="card card-tilt-l reveal reveal-d4"
                  onClick={() => go('opensource')}
                  style={{
                    background: dk?'rgba(255,255,255,.07)':'var(--surface)',
                    border:`2px solid ${dk?'rgba(255,255,255,.12)':'rgba(29,28,28,.15)'}`,
                    cursor:'pointer', position:'relative', overflow:'hidden',
                  }}>
                  <span className="step-badge" style={{ position:'absolute', top:20, right:20, background: dk?'rgba(255,255,255,.1)':undefined, border: dk?'1px solid rgba(255,255,255,.15)':undefined }}>4</span>
                  <div style={{ width:48, height:48, marginBottom:20 }}>
                    <svg viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" fill={dk?'rgba(255,255,255,.08)':'#FFF9D6'} stroke={dk?'rgba(255,255,255,.12)':'rgba(29,28,28,.12)'} strokeWidth="1.5"/>
                      <path d="M30 14 L34 18 L20 32 L14 34 L16 28 Z" fill={dk?'#F2EFF8':'#1D1C1C'} fillOpacity=".9"/>
                      <path d="M27 17 L31 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="label" style={{ color: dk?'var(--ink-muted)':'rgba(29,28,28,.45)', marginBottom:8 }}>8 shrift · Jitter</p>
                  <h3 className="h3" style={{ color: dk?'#F2EFF8':'var(--ink)', marginBottom:12 }}>
                    {currentLang==='uz'?"Qo'lyozma Studiyasi":currentLang==='ru'?'Студия Почерка':'Handwriting Studio'}
                  </h3>
                  <p className="body" style={{ color: dk?'var(--ink-soft)':'rgba(29,28,28,.65)', marginBottom:24 }}>
                    {currentLang==='uz'?"Haqiqiy qo'l yozuvi. 8 shrift, insoniy tebranish. PDF/PNG eksport.":currentLang==='ru'?'Живой почерк. 8 шрифтов, дрожание. Экспорт PDF/PNG.':'Real handwriting. 8 fonts, jitter effect. PDF/PNG export.'}
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ background:'var(--ink)', color: dk?'#1D1C1C':'var(--bg-warm)' }}>
                    {currentLang==='uz'?'Ochish':currentLang==='ru'?'Открыть':'Open'} <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                TRUST / FEATURES
            ═══════════════════════════════════════════════════════════════ */}
            <section className="container section-gap">
              <h2 className="h2 reveal" style={{ marginBottom:'clamp(2rem,5vw,4rem)', color: dk?'#F2EFF8':undefined }}>
                {currentLang==='uz'?<>Platformaning<br/><span className="text-grad-coral">3 ta ustunligi</span></>
                  :currentLang==='ru'?<>3 главных<br/><span className="text-grad-coral">преимущества</span></>
                  :<>3 core<br/><span className="text-grad-coral">advantages</span></>}
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
                {[
                  {
                    n:'01',
                    // Colourful icon block instead of plain emoji
                    icon: (
                      <div style={{ width:52, height:52, borderRadius:16, background:'var(--grad-cool)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="3"/><path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                    ),
                    grad: 'linear-gradient(135deg,rgba(122,247,247,.28) 0%,rgba(131,245,130,.12) 100%)',
                    title: currentLang==='uz'?'Har qurilmada — bir xil':currentLang==='ru'?'На любом устройстве':'Works on Any Device',
                    desc: currentLang==='uz'
                      ?'Telefon, planshet yoki kompyuter — fark qilmaydi. Ilovani yuklab olish ham mumkin (PWA). Internet bo\'lmasa ham asosiy funksiyalar ishlaydi.'
                      :currentLang==='ru'
                      ?'Телефон, планшет или компьютер — без разницы. Доступна установка как приложение (PWA). Основные функции работают и без интернета.'
                      :'Phone, tablet or PC — no difference. Install as an app (PWA). Core features work even offline.',
                  },
                  {
                    n:'02',
                    icon: (
                      <div style={{ width:52, height:52, borderRadius:16, background:'var(--grad-hot)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                    ),
                    grad: 'linear-gradient(135deg,rgba(255,21,138,.14) 0%,rgba(255,248,141,.18) 100%)',
                    title: currentLang==='uz'?"Ma'lumotlaringiz faqat sizniki":currentLang==='ru'?'Ваши данные — только ваши':'Your Data Stays Yours',
                    desc: currentLang==='uz'
                      ?'Hech qanday fayl serverga yuklanmaydi. Hujjatlar, tarjimalar va PDF — barchasi brauzeringizning o\'zida. Hech kim ko\'rmaydi.'
                      :currentLang==='ru'
                      ?'Никакие файлы не загружаются на сервер. Документы, переводы и PDF обрабатываются прямо в вашем браузере. Никто не видит.'
                      :'No file is ever uploaded to a server. Documents, translations and PDFs are processed inside your browser only.',
                  },
                  {
                    n:'03',
                    icon: (
                      <div style={{ width:52, height:52, borderRadius:16, background:'var(--grad-coral)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeOpacity=".45"/>
                        </svg>
                      </div>
                    ),
                    grad: 'linear-gradient(135deg,rgba(253,151,253,.22) 0%,rgba(253,173,112,.14) 100%)',
                    title: currentLang==='uz'?'Shaxsiy hisob — tez orada':currentLang==='ru'?'Личный кабинет — скоро':'Personal Account — Coming Soon',
                    desc: currentLang==='uz'
                      ?'Hujjatlar tarixi, shaxsiy shablonlar, jamoaviy tahrirlash va premium imkoniyatlar. Hisobingiz yaqinda ochiladi — kutib turing! 🚀'
                      :currentLang==='ru'
                      ?'История документов, личные шаблоны, совместное редактирование и премиум-функции. Аккаунт скоро откроется — ждите! 🚀'
                      :'Document history, personal templates, team editing and premium features. Your account is coming soon — stay tuned! 🚀',
                    badge: currentLang==='uz'?'Tez orada':currentLang==='ru'?'Скоро':'Coming soon',
                  },
                ].map((f, i) => (
                  <div key={f.n} className={`card reveal reveal-d${i+1}`}
                    style={{
                      background: dk ? 'rgba(255,255,255,.05)' : f.grad,
                      border: `1.5px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.08)'}`,
                      position:'relative', overflow:'hidden',
                    }}>
                    {'badge' in f && f.badge && (
                      <div style={{
                        position:'absolute', top:16, right:16,
                        padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:800,
                        background: dk?'rgba(253,151,253,.2)':'rgba(253,151,253,.35)',
                        color: dk?'#FD97FD':'#9d1b9e', letterSpacing:'0.04em', textTransform:'uppercase',
                      }}>
                        {f.badge}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                      {f.icon}
                      <span style={{
                        fontSize:11, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase',
                        color: dk?'rgba(255,255,255,.15)':'rgba(29,28,28,.18)',
                      }}>{f.n}</span>
                    </div>
                    <h3 style={{ fontSize:'clamp(1.1rem,2.5vw,1.35rem)', fontWeight:700, marginBottom:10, color: dk?'#F2EFF8':'var(--ink)' }}>{f.title}</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color: dk?'var(--ink-soft)':'rgba(29,28,28,.6)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                RECENT HISTORY
            ═══════════════════════════════════════════════════════════════ */}
            {history.length > 0 && (
              <section className="container section-gap reveal">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Clock size={16} style={{ color: dk?'#a78bfa':'var(--ink)' }} />
                    <span style={{ fontSize:15, fontWeight:700, color: dk?'#F2EFF8':'var(--ink)' }}>
                      {currentLang==='uz'?'Oxirgi Amallar':currentLang==='ru'?'Последние операции':'Recent Activity'}
                    </span>
                    <span style={{ fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:20, background:dk?'rgba(167,139,250,.15)':'rgba(29,28,28,.08)', color:dk?'#a78bfa':'var(--ink-soft)' }}>{history.length}</span>
                  </div>
                  <button onClick={() => { setHistory([]); localStorage.removeItem('hz_history'); }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, color:'#ef4444', display:'flex', alignItems:'center', gap:4 }}>
                    <Trash2 size={12} />
                    {currentLang==='uz'?'Tozalash':currentLang==='ru'?'Очистить':'Clear'}
                  </button>
                </div>
                <div style={{ borderRadius:24, border:`1.5px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.08)'}`, background: dk?'rgba(255,255,255,.03)':'var(--surface)', overflow:'hidden' }}>
                  {history.map((e,i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 20px', gap:12,
                      borderBottom: i<history.length-1 ? `1px solid ${dk?'rgba(255,255,255,.06)':'rgba(29,28,28,.06)'}` : 'none',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                        <div style={{ width:32, height:32, borderRadius:10, background:dk?'rgba(167,139,250,.12)':'rgba(29,28,28,.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <FileDown size={14} style={{ color:dk?'#a78bfa':'var(--ink-soft)' }} />
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: dk?'#F2EFF8':'var(--ink)' }}>{e.filename}</p>
                          <p style={{ fontSize:11, color:'var(--ink-muted)' }}>{toolLabel[e.tool]||e.tool}</p>
                        </div>
                      </div>
                      <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--ink-muted)', whiteSpace:'nowrap' }}>
                        {new Date(e.ts).toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                STATS + PRIVACY
            ═══════════════════════════════════════════════════════════════ */}
            {(filesCount > 0 || charsCount > 0) && (
              <section className="container section-gap reveal">
                <div style={{
                  display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:24,
                  padding:'20px 28px', borderRadius:24,
                  background: dk?'rgba(255,255,255,.04)':'var(--surface)',
                  border:`1.5px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.08)'}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <BarChart3 size={16} style={{ color:'#7c3aed' }} />
                    <span style={{ fontSize:14, color: dk?'var(--ink-soft)':'rgba(29,28,28,.65)' }}>
                      {t.statsFiles}: <strong style={{ color: dk?'#F2EFF8':'var(--ink)' }}>{filesCount}</strong>
                    </span>
                  </div>
                  <div style={{ width:1, height:16, background: dk?'rgba(255,255,255,.12)':'rgba(29,28,28,.12)' }} />
                  <span style={{ fontSize:14, color: dk?'var(--ink-soft)':'rgba(29,28,28,.65)' }}>
                    {t.statsChars}: <strong style={{ color: dk?'#F2EFF8':'var(--ink)' }}>~{charsCount.toLocaleString()}</strong>
                  </span>
                  <button onClick={() => { localStorage.removeItem('uz_files'); localStorage.removeItem('uz_chars'); setFilesCount(0); setCharsCount(0); }}
                    style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, color:'#ef4444' }}>
                    {t.statsReset}
                  </button>
                </div>
              </section>
            )}

            {/* Privacy banner */}
            <section className="container section-gap reveal" style={{ paddingBottom:'clamp(3rem,8vw,6rem)' }}>
              <div style={{
                display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16,
                padding:'20px 28px', borderRadius:24,
                background: dk?'rgba(124,58,237,.08)':'rgba(29,28,28,.04)',
                border:`1.5px solid ${dk?'rgba(124,58,237,.20)':'rgba(29,28,28,.10)'}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Shield size={20} style={{ color: dk?'#a78bfa':'var(--ink)', flexShrink:0 }} />
                  <p style={{ fontSize:14, fontWeight:500, color: dk?'var(--ink-soft)':'rgba(29,28,28,.65)', lineHeight:1.5 }}>
                    <strong style={{ color: dk?'#a78bfa':'var(--ink)' }}>{t.badgePrivate}:</strong>{' '}{t.privacyBanner}
                  </p>
                </div>
                <button onClick={() => go('prices')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700, color: dk?'#a78bfa':'var(--ink)', whiteSpace:'nowrap' }}>
                  {t.pricingDetails} <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── OTHER TABS ── */}
        {activeTab === 'lang'       && <LanguageCenter currentLang={currentLang} theme={theme} onFileProcessed={handleFileProcessed} onSendToHandwriting={sendToHW} />}
        {activeTab === 'docs'       && <DocumentCenter currentLang={currentLang} theme={theme} onSendToHandwriting={sendToHW} />}
        {activeTab === 'ai'         && <AiCenter        currentLang={currentLang} theme={theme} onSendToHandwriting={sendToHW} />}
        {activeTab === 'prices'     && <PricingSection  currentLang={currentLang} theme={theme} onUpgradeSuccess={() => { setIsPremium(true); localStorage.setItem('hz_premium','true'); }} isPremium={isPremium} />}
        {activeTab === 'opensource' && <OpenSourceLabs  currentLang={currentLang} theme={theme} sharedHandwriteText={sharedHWText} clearSharedHandwriteText={() => setSharedHWText('')} />}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ══════════════════════════════════════════════════════════════════════ */}
      <nav className="show-mobile" style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:40,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        background: dk?'rgba(15,8,32,.95)':'rgba(255,249,214,.95)',
        borderTop:`1px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.10)'}`,
        paddingBottom:'max(env(safe-area-inset-bottom,0px),8px)',
        display:'flex', justifyContent:'space-around', padding:'8px 0',
      }}>
        {MOBILE_NAV.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => go(item.id as Tab)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                padding:'6px 12px', borderRadius:20, background:'none', border:'none', cursor:'pointer',
                color: active ? '#7c3aed' : (dk?'rgba(242,239,248,.4)':'rgba(29,28,28,.35)'),
                transition:'all .2s',
              }}>
              {active ? (
                <div style={{ width:28, height:28, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 12px rgba(124,58,237,.4)' }}>
                  <item.Icon size={14} color="white" />
                </div>
              ) : (
                <item.Icon size={20} />
              )}
              <span style={{ fontSize:9, fontWeight:700 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        position:'relative', zIndex:10,
        borderTop:`1px solid ${dk?'rgba(255,255,255,.08)':'rgba(29,28,28,.10)'}`,
        paddingTop:48, paddingBottom:48, marginBottom:80,
      }}>
        <div className="container">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={15} color={dk?'#0f0820':'var(--bg-warm)'} />
              </div>
              <span style={{ fontSize:15, fontWeight:800, color: dk?'#F2EFF8':'var(--ink)' }}>{t.appName}</span>
            </div>
            <p style={{ fontSize:13, color:'var(--ink-muted)', textAlign:'center' }}>
              {currentLang==='uz'?"O'zbekiston uchun ❤️ bilan — fayllar serverga yuklanmaydi":currentLang==='ru'?"Сделано с ❤️ для Узбекистана — файлы не покидают браузер":"Made with ❤️ for Uzbekistan — files never leave your browser"}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px 20px' }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => go(n.id as Tab)}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, color:'var(--ink-muted)', transition:'color .2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = inkText)}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-muted)')}>
                  {n.label}
                </button>
              ))}
            </div>
            <p
              style={{ fontSize:12, color:dk?'rgba(255,255,255,.15)':'rgba(29,28,28,.20)', cursor:'default', userSelect:'none' }}
              onDoubleClick={() => setDevPanel(v => !v)}>
              © {new Date().getFullYear()} {t.appName} — {t.appSlogan}
            </p>
            {devPanel && (
              <div style={{ padding:16, borderRadius:16, border:`1px solid ${dk?'rgba(255,255,255,.12)':'rgba(29,28,28,.10)'}`, background: dk?'rgba(255,255,255,.04)':'rgba(29,28,28,.04)', maxWidth:300, width:'100%' }}>
                <p style={{ fontSize:11, fontWeight:700, fontFamily:'monospace', marginBottom:8, color:'var(--ink-soft)' }}>Dev: AI Provider Override</p>
                <AdminAIProvider />
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* ── Responsive helper styles ── */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        .card-tilt-l { transform: rotate(-2deg); }
        .card-tilt-r { transform: rotate(1.5deg); }
        .card-tilt-l:hover { transform: rotate(-2deg) translateY(-6px) !important; }
        .card-tilt-r:hover { transform: rotate(1.5deg) translateY(-6px) !important; }
        @media (max-width: 640px) {
          .card-tilt-l, .card-tilt-r { transform: none !important; }
          .card-tilt-l:hover, .card-tilt-r:hover { transform: translateY(-4px) !important; }
        }
        .section-gap { margin-top: clamp(4rem, 9vw, 8rem); }
        .container { width: min(1280px, 100% - 2.5rem); margin-inline: auto; }
        .h1 { font-size: clamp(2.5rem, 8vw, 7rem); font-weight: 900; line-height: 0.92; letter-spacing: -0.03em; }
        .h2 { font-size: clamp(2rem, 5vw, 5rem); font-weight: 800; line-height: 0.95; letter-spacing: -0.025em; }
        .h3 { font-size: clamp(1.2rem, 2.5vw, 1.8rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
        .body-lg { font-size: 1.125rem; font-weight: 500; line-height: 1.65; }
        .body { font-size: 1rem; font-weight: 500; line-height: 1.6; }
        .label { font-size: .75rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
        .pill { display: inline-flex; align-items: center; gap: .375rem; padding: 8px 16px; border-radius: 999px; font-size: .8125rem; font-weight: 600; border: 1.5px solid; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: 14px 26px; border-radius: 40px; font-size: 1rem; font-weight: 600; line-height: 1; cursor: pointer; transition: transform .2s, box-shadow .2s; border: none; white-space: nowrap; font-family: inherit; }
        .btn:active { transform: scale(.96) !important; }
        .btn-sm { padding: 10px 20px; font-size: .875rem; }
        .btn-lg { padding: 18px 36px; font-size: 1.125rem; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(29,28,28,.25); }
        .btn-ghost { border: 2px solid !important; }
        .btn-ghost:hover { transform: translateY(-2px); }
        .step-badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.7); color: #1D1C1C; font-size: .875rem; font-weight: 800; }
        .card { border-radius: 28px; padding: clamp(1.5rem, 3vw, 2rem); box-shadow: 0 4px 20px rgba(29,28,28,.10), 0 1px 4px rgba(29,28,28,.06); transition: transform .4s cubic-bezier(0.16,1,.3,1), box-shadow .4s; }
        .card:hover { box-shadow: 0 20px 60px rgba(29,28,28,.16); }
        .reveal { opacity:0; transform: translateY(32px); transition: opacity .55s cubic-bezier(.25,.46,.45,.94), transform .55s cubic-bezier(.16,1,.3,1); }
        .reveal.in { opacity:1; transform: translateY(0); }
        .reveal-d1 { transition-delay: .10s; }
        .reveal-d2 { transition-delay: .20s; }
        .reveal-d3 { transition-delay: .30s; }
        .reveal-d4 { transition-delay: .42s; }
        .word-reveal { display: inline-block; opacity:0; transform: translateY(20px) skewX(-4deg); transition: opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1); }
        .word-reveal.in { opacity:1; transform: none; }
        .text-grad-hot   { background: linear-gradient(121deg,#FF158A -20%,#FFF48D 66%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-grad-coral { background: linear-gradient(221deg,#FD97FD -1%,#FDAD70 103%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .anim-float { animation: float 3.5s ease-in-out infinite; }
        .anim-blob  { animation: blob  9s ease-in-out infinite; }
        .delay-3 { animation-delay: 3s; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes blob  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-32px) scale(1.07)} 66%{transform:translate(-20px,18px) scale(.95)} }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .word-reveal { opacity:1!important; transform:none!important; transition:none!important; }
          *, *::before, *::after { animation-duration: .01ms!important; transition-duration: .01ms!important; }
        }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}

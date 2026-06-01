/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UI_TRANSLATIONS, Language } from '../utils/translations';
import { Check, Zap, Flame, Shield, HelpCircle, ArrowRight, Heart, Star, X } from 'lucide-react';

interface PricingSectionProps {
  currentLang: Language;
  onUpgradeSuccess: () => void;
  isPremium: boolean;
  theme?: 'light' | 'dark';
}

export default function PricingSection({ currentLang, onUpgradeSuccess, isPremium, theme = 'dark' }: PricingSectionProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const localDocs = {
    uz: {
      successTitle: "Premium Rejim Faollashtirildi!",
      successBtn: "Rahmat",
      freeSub: "Asosiy rejim",
      freeDesc: "Barcha transliteratsiya va mahalliy PDF asboblaridan to'liq ishonchli foydalaning.",
      freeBadge: "Standart rejim",
      premiumSub: "Dasturchi tavsiyasi",
      premiumDesc: "Katta biznes korxonalari va ko'p hujjatlar bilan muntazam ishlovchi idoralar va tarjimonlar uchun.",
      activating: "Faollashtirilmoqda...",
      activated: "Premium faollashtirilgan ✓",
      paymentStatus: "Click va Payme integratsiyasiga tayyor"
    },
    ru: {
      successTitle: "Режим Premium Активирован!",
      successBtn: "Спасибо",
      freeSub: "Основной режим",
      freeDesc: "Используйте все инструменты транслитерации и локальные PDF совершенно надежно.",
      freeBadge: "Стандартный режим",
      premiumSub: "Рекомендация разработчика",
      premiumDesc: "Для крупных бизнес-предприятий, офисов и переводчиков, регулярно работающих с большим объемом документов.",
      activating: "Активация...",
      activated: "Premium активирован ✓",
      paymentStatus: "Интегрировано с Click и Payme"
    },
    en: {
      successTitle: "Premium Mode Activated!",
      successBtn: "Thank You",
      freeSub: "Basic Mode",
      freeDesc: "Use all transliteration and local PDF tools fully reliably.",
      freeBadge: "Standard Mode",
      premiumSub: "Developer's Choice",
      premiumDesc: "For large business enterprises, offices, and translators who regularly work with many documents.",
      activating: "Activating...",
      activated: "Premium activated ✓",
      paymentStatus: "Ready for Click and Payme integration"
    }
  };

  const l = localDocs[currentLang] || localDocs.uz;

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      onUpgradeSuccess();
      setUpgrading(false);
      setShowUpgradeModal(true);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-slide-up relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom,_rgba(16,185,129,0.12),transparent_30%)]" />
      {/* Visual interactive Upgrade success Modal replacing standard window.alert() */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`p-6 sm:p-8 rounded-3xl border w-full max-w-md shadow-2xl relative text-center space-y-4 animate-scale-up ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-rose-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <Star className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-lg font-black font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {l.successTitle}
              </h3>
              <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.paymentSimulated}
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-indigo-700"
            >
              {l.successBtn}
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className={`text-2xl sm:text-3xl font-black font-display tracking-tight flex items-center justify-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          <Zap className="w-6 h-6 text-indigo-500 dark:text-indigo-400 fill-indigo-400/20" />
          {t.pricingTitle}
        </h2>
        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.pricingDesc}
        </p>
      </div>

      {/* Grid of plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* FREE PLAN */}
        <div className={`border rounded-[2rem] p-7 flex flex-col justify-between shadow-xl relative overflow-hidden transition duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-950/30 border-slate-800/70 shadow-black/40' 
            : 'bg-white border-slate-200 shadow-gray-100/30'
        }`}>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black">{l.freeSub}</span>
              <h3 className={`text-xl font-bold mt-1 font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.planFreeName}</h3>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 leading-relaxed'}`}>{l.freeDesc}</p>
            </div>

            <div className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {t.planFreePrice}
            </div>

            <div className={`space-y-3.5 pt-4 border-t text-xs ${
              theme === 'dark' ? 'border-slate-800/70 text-slate-400' : 'border-slate-150 text-slate-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.planFreeFeature1}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.planFreeFeature2}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.planFreeFeature3}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.planFreeFeature4}</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              disabled
              className={`w-full py-3.5 text-xs font-bold rounded-xl border disabled:opacity-85 ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isPremium ? l.freeBadge : t.currentPlan}
            </button>
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div className={`border rounded-3xl p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden xl:scale-102 transition duration-350 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-[#0e1635] to-[#070b1f] border-indigo-500/20'
            : 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-150 shadow-indigo-100/50'
        }`}>
          {/* Glowing element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-indigo-500 dark:text-indigo-400 uppercase font-black flex items-center gap-1">
                <Flame className="w-3 h-3 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                {l.premiumSub}
              </span>
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-indigo-300 dark:border-indigo-500/40">
                PRO EDITION
              </span>
            </div>

            <div>
              <h3 className={`text-xl font-bold mt-1 font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.planPremiumName}</h3>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-indigo-200/60' : 'text-slate-600'}`}>{l.premiumDesc}</p>
            </div>

            <div className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {t.planPremiumPrice}
            </div>

            <div className={`space-y-3.5 pt-4 border-t text-xs ${
              theme === 'dark' ? 'border-slate-800/70 text-slate-400' : 'border-slate-150 text-slate-700 font-medium'
            }`}>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                <span>{t.planPremiumFeature1}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                <span>{t.planPremiumFeature2}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                <span>{t.planPremiumFeature3}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                <span>{t.planPremiumFeature4}</span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-4">
            <button
              onClick={handleUpgrade}
              disabled={upgrading || isPremium}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {upgrading ? l.activating : isPremium ? l.activated : t.upgradeBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
              <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{l.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Users,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building,
  Calendar,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficialLogo } from '../common/OfficialLogo';
import { formatRupiah } from '../../utils/formatters';
import { FamilyWbpChecker } from './FamilyWbpChecker';
import { DEFAULT_PUBLIC_PORTAL_CONTENT } from '../../data/initialData';
import { WindEffectOverlay } from '../common/WindEffectOverlay';

interface LandingPageProps {
  onOpenPublic: () => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenPublic, onOpenAdmin }) => {
  const { uptSettings, totalSaldo, totalMasuk, totalKeluar } = useApp();
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const content = {
    ...DEFAULT_PUBLIC_PORTAL_CONTENT,
    ...(uptSettings.portalContent || {}),
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 overflow-hidden">
      {/* Background Gambar Rutan Jeneponto dengan Efek Angin Bergerak */}
      <WindEffectOverlay />

      {/* Konten Utama di atas layer animasi angin */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        {/* Top Ministry Bar */}
        <div className="border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-300">{uptSettings.kementerian}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-amber-300/90 font-medium">{uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN'}</span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-400">{uptSettings.kanwil}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-emerald-400">{content.heroBadgeStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 w-full flex-1 flex flex-col justify-center">
        {/* Brand & Heading: Logo SPARTA RUJENTO with words below the logo in Montserrat ExtraBold */}
        <div className="text-center space-y-4 mb-12 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center">
            <OfficialLogo size="xl" className="shadow-2xl shadow-amber-500/20 ring-4 ring-amber-400/20" />
            <span className="mt-3 px-3.5 py-1 rounded-full text-xs font-montserrat-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40">
              SPARTA RUJENTO
            </span>
          </div>

          <div className="space-y-1.5 max-w-4xl mx-auto px-2">
            <h1 className="font-montserrat-extrabold text-2xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase leading-tight">
              {content.heroJudulBaris1 || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI'}
            </h1>
            <h2 className="font-montserrat-extrabold text-lg sm:text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 tracking-wide uppercase mt-1">
              {content.heroJudulBaris2 || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO'}
            </h2>
          </div>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {content.heroDeskripsi}
          </p>

          {/* Quick Family Lookup CTA Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowFamilyModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 border border-emerald-400/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {content.heroCtaButton}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two Main Distinct Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto w-full">
          {/* Card A: PORTAL UMUM */}
          <div className="relative group rounded-3xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 hover:border-blue-500/60 p-8 shadow-2xl transition-all duration-300 hover:shadow-blue-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>

            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-900/40 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7 text-blue-400" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    {content.portalUmumBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    {content.portalUmumPill}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1 group-hover:text-blue-300 transition-colors">
                  {content.portalUmumJudul}
                </h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                {content.portalUmumDeskripsi}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{content.portalUmumFitur1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{content.portalUmumFitur2}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={onOpenPublic}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                {content.portalUmumButtonText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card B: PORTAL ADMIN */}
          <div className="relative group rounded-3xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 hover:border-amber-500/60 p-8 shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>

            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {content.portalAdminBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    {content.portalAdminPill}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
                  {content.portalAdminJudul}
                </h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                {content.portalAdminDeskripsi}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{content.portalAdminFitur1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{content.portalAdminFitur2}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={onOpenAdmin}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                {content.portalAdminButtonText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Quick Transparency Bar */}
        <div className="mt-12 max-w-4xl mx-auto w-full bg-slate-900/75 border border-slate-800/90 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-300">
                  {content.transparansiLabel}
                </div>
                <div className="text-[11px] text-slate-400">
                  Total Titipan Berjalan: <span className="text-amber-400 font-bold">{formatRupiah(totalSaldo)}</span> • Masuk: <span className="text-emerald-400 font-bold">{formatRupiah(totalMasuk)}</span> • Belanja: <span className="text-rose-400 font-bold">{formatRupiah(totalKeluar)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenPublic}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              {content.transparansiButtonText}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-5 text-center text-xs text-slate-300">
        <p>
          © 2026 {uptSettings.namaUpt} • {content.footerTeksLanding}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          {uptSettings.alamat}, {uptSettings.kota}
        </p>
      </footer>
      </div>

      {/* Family Checker Modal if triggered from landing page */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full my-8 text-slate-900 shadow-2xl relative">
            <FamilyWbpChecker onBack={() => setShowFamilyModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

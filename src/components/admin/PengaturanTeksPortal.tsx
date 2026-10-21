import React, { useState, useEffect } from 'react';
import {
  Type,
  CheckCircle,
  RotateCcw,
  Eye,
  Sparkles,
  Layers,
  Layout,
  Search,
  ShieldCheck,
  FileSpreadsheet,
  PieChart,
  HelpCircle,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_PUBLIC_PORTAL_CONTENT } from '../../data/initialData';
import { PublicPortalContent } from '../../types';
import { OfficialLogo } from '../common/OfficialLogo';

export const PengaturanTeksPortal: React.FC = () => {
  const {
    uptSettings,
    updatePortalContent,
    resetPortalContent,
    setCurrentPortal,
    setFormDraft,
    clearFormDraft,
    autosaveState,
  } = useApp();

  const [formData, setFormData] = useState<PublicPortalContent>({
    ...DEFAULT_PUBLIC_PORTAL_CONTENT,
    ...(uptSettings.portalContent || {}),
  });

  useEffect(() => {
    if (uptSettings?.portalContent) {
      setFormData({
        ...DEFAULT_PUBLIC_PORTAL_CONTENT,
        ...uptSettings.portalContent,
      });
    }
  }, [uptSettings?.portalContent]);

  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'kartu_portal' | 'ringkasan_kartu' | 'kebijakan' | 'cek_keluarga' | 'footer'
  >('hero');

  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (field: keyof PublicPortalContent, value: string) => {
    const next = {
      ...formData,
      [field]: value,
    };
    setFormData(next);
    // Register with 60s autosave manager
    setFormDraft('portal_content', next);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updatePortalContent(formData);
    clearFormDraft('portal_content');
    setNotification({
      type: 'success',
      message: 'Semua perubahan kalimat dan teks Portal Umum berhasil disimpan permanen ke database!',
    });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleConfirmReset = () => {
    resetPortalContent();
    setFormData({ ...DEFAULT_PUBLIC_PORTAL_CONTENT });
    setShowResetConfirm(false);
    setNotification({
      type: 'info',
      message: 'Kalimat portal berhasil dikembalikan ke standar bawaan aplikasi.',
    });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-slate-900 text-amber-400 shrink-0">
            <Type className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Pengaturan Kalimat &amp; Teks Portal Umum
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Dapat Diedit Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubah judul utama, subjudul, slogan, keterangan kartu, kebijakan transparansi, dan kalimat layanan di Portal Publik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset ke Default
          </button>

          <button
            type="button"
            onClick={() => setCurrentPortal('landing')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-900" />
            Pratinjau Beranda
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Simpan Kalimat
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Live Preview of Main Heading Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" /> Pratinjau Tampilan Judul Utama Portal Publik (Real-Time)
          </span>
          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
            Instansi: {uptSettings.namaUpt}
          </span>
        </div>

        <div className="text-center py-5 space-y-3 max-w-3xl mx-auto flex flex-col items-center">
          <div className="flex flex-col items-center justify-center">
            <OfficialLogo size="lg" />
            <span className="mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-montserrat-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40">
              SPARTA RUJENTO
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-montserrat-extrabold text-base sm:text-xl text-white uppercase tracking-tight leading-snug">
              {formData.heroJudulBaris1 || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI'}
            </h1>
            <h2 className="font-montserrat-extrabold text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 uppercase tracking-wide">
              {formData.heroJudulBaris2 || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO'}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-normal">
            {formData.heroDeskripsi || '(Deskripsi belum diisi)'}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/40 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {formData.heroCtaButton}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Text Categories */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'hero'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          1. Judul Utama &amp; Hero Beranda
        </button>

        <button
          onClick={() => setActiveSubTab('kartu_portal')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'kartu_portal'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-blue-500" />
          2. Kartu Pintu Masuk Portal
        </button>

        <button
          onClick={() => setActiveSubTab('ringkasan_kartu')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'ringkasan_kartu'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          3. Kartu Saldo &amp; Tab Navigasi
        </button>

        <button
          onClick={() => setActiveSubTab('kebijakan')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'kebijakan'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-rose-500" />
          4. Grafik &amp; Kebijakan Transparansi
        </button>

        <button
          onClick={() => setActiveSubTab('cek_keluarga')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'cek_keluarga'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-amber-500" />
          5. Layanan Cek Saldo Keluarga
        </button>

        <button
          onClick={() => setActiveSubTab('footer')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSubTab === 'footer'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          6. Footer &amp; Teks Hak Cipta
        </button>
      </div>

      {/* Main Editing Panels */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* SUBTAB 1: Hero & Heading Utama */}
        {activeSubTab === 'hero' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Kalimat Judul Besar &amp; Deskripsi Slogan (Beranda &amp; Portal Utama)
                </h3>
                <p className="text-xs text-slate-500">
                  Kalimat ini tampil menonjol pada layar pembuka pertama aplikasi dan kop atas.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Judul Utama Baris 1 (Font Montserrat ExtraBold):
                </label>
                <input
                  type="text"
                  value={formData.heroJudulBaris1}
                  onChange={(e) => handleChange('heroJudulBaris1', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-montserrat-extrabold"
                  placeholder="Contoh: STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ditampilkan di bawah logo SPARTA RUJENTO dengan font Montserrat ExtraBold.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. Judul Utama Baris 2 / Nama Instansi (Font Montserrat ExtraBold):
                </label>
                <input
                  type="text"
                  value={formData.heroJudulBaris2}
                  onChange={(e) => handleChange('heroJudulBaris2', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-amber-700 bg-amber-50/40 focus:ring-2 focus:ring-amber-500 font-montserrat-extrabold"
                  placeholder="Contoh: RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ditampilkan dengan aksen warna emas berkilau dan font Montserrat ExtraBold di bawah baris judul pertama.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. Paragraf Deskripsi &amp; Slogan Beranda:
                </label>
                <textarea
                  rows={2}
                  value={formData.heroDeskripsi}
                  onChange={(e) => handleChange('heroDeskripsi', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Portal informasi dan pengelolaan transaksi keuangan warga binaan secara transparan dan terintegrasi."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    4. Status Keamanan (Top Bar Beranda):
                  </label>
                  <input
                    type="text"
                    value={formData.heroBadgeStatus}
                    onChange={(e) => handleChange('heroBadgeStatus', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                    placeholder="Sistem Aktif & Terlindungi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    5. Teks Tombol Cek Cepat Keluarga (Pills Beranda):
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaButton}
                    onChange={(e) => handleChange('heroCtaButton', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/30"
                    placeholder="Pengecekan Keuangan WBP Khusus Keluarga (Cek Nama)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Kartu Pilihan Portal */}
        {activeSubTab === 'kartu_portal' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Kartu Portal Umum */}
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-blue-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-blue-600" />
                  Pengaturan Teks Kartu &quot;PORTAL UMUM&quot; (Akses Publik Tanpa Login)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Sisi Kiri Beranda
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Kategori:</label>
                  <input
                    type="text"
                    value={formData.portalUmumBadge}
                    onChange={(e) => handleChange('portalUmumBadge', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Akses (Pill):</label>
                  <input
                    type="text"
                    value={formData.portalUmumPill}
                    onChange={(e) => handleChange('portalUmumPill', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kartu:</label>
                  <input
                    type="text"
                    value={formData.portalUmumJudul}
                    onChange={(e) => handleChange('portalUmumJudul', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Tombol Aksi:</label>
                  <input
                    type="text"
                    value={formData.portalUmumButtonText}
                    onChange={(e) => handleChange('portalUmumButtonText', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paragraf Deskripsi Kartu Umum:</label>
                <textarea
                  rows={2}
                  value={formData.portalUmumDeskripsi}
                  onChange={(e) => handleChange('portalUmumDeskripsi', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin Fitur 1:</label>
                  <input
                    type="text"
                    value={formData.portalUmumFitur1}
                    onChange={(e) => handleChange('portalUmumFitur1', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin Fitur 2:</label>
                  <input
                    type="text"
                    value={formData.portalUmumFitur2}
                    onChange={(e) => handleChange('portalUmumFitur2', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Kartu Portal Admin */}
            <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Pengaturan Teks Kartu &quot;PORTAL ADMIN&quot; (Kasir &amp; Pengelola)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Sisi Kanan Beranda
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Kategori:</label>
                  <input
                    type="text"
                    value={formData.portalAdminBadge}
                    onChange={(e) => handleChange('portalAdminBadge', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Akses (Pill):</label>
                  <input
                    type="text"
                    value={formData.portalAdminPill}
                    onChange={(e) => handleChange('portalAdminPill', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kartu Admin:</label>
                  <input
                    type="text"
                    value={formData.portalAdminJudul}
                    onChange={(e) => handleChange('portalAdminJudul', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Tombol Masuk:</label>
                  <input
                    type="text"
                    value={formData.portalAdminButtonText}
                    onChange={(e) => handleChange('portalAdminButtonText', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paragraf Deskripsi Kartu Admin:</label>
                <textarea
                  rows={2}
                  value={formData.portalAdminDeskripsi}
                  onChange={(e) => handleChange('portalAdminDeskripsi', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin Fitur 1:</label>
                  <input
                    type="text"
                    value={formData.portalAdminFitur1}
                    onChange={(e) => handleChange('portalAdminFitur1', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin Fitur 2:</label>
                  <input
                    type="text"
                    value={formData.portalAdminFitur2}
                    onChange={(e) => handleChange('portalAdminFitur2', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Quick Live Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Bar Ringkasan Transparansi Bawah Beranda
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Status:</label>
                  <input
                    type="text"
                    value={formData.transparansiLabel}
                    onChange={(e) => handleChange('transparansiLabel', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Tautan Buka Rincian:</label>
                  <input
                    type="text"
                    value={formData.transparansiButtonText}
                    onChange={(e) => handleChange('transparansiButtonText', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-amber-600 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Kartu Saldo & Tab Navigasi */}
        {activeSubTab === 'ringkasan_kartu' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header & Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Header Halaman Portal Umum &amp; 3 Tab Navigasi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subjudul Header Portal Umum:</label>
                  <input
                    type="text"
                    value={formData.portalUmumHeaderSub}
                    onChange={(e) => handleChange('portalUmumHeaderSub', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Koneksi Header:</label>
                  <input
                    type="text"
                    value={formData.portalUmumStatusKoneksi}
                    onChange={(e) => handleChange('portalUmumStatusKoneksi', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Tab 1:</label>
                  <input
                    type="text"
                    value={formData.tabRingkasanLabel}
                    onChange={(e) => handleChange('tabRingkasanLabel', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Tab 2 (Keluarga):</label>
                  <input
                    type="text"
                    value={formData.tabCekKeluargaLabel}
                    onChange={(e) => handleChange('tabCekKeluargaLabel', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Tab 3 (Bulanan):</label>
                  <input
                    type="text"
                    value={formData.tabLaporanBulananLabel}
                    onChange={(e) => handleChange('tabLaporanBulananLabel', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-amber-800"
                  />
                </div>
              </div>
            </div>

            {/* 4 Kartu Ringkasan Keuangan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Kalimat 4 Kartu Statistik Keuangan Publik
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Card 1: Saldo */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 uppercase">Kartu 1 (Total Saldo)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Judul Kartu:</label>
                    <input
                      type="text"
                      value={formData.cardSaldoJudul}
                      onChange={(e) => handleChange('cardSaldoJudul', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Keterangan Bawah:</label>
                    <input
                      type="text"
                      value={formData.cardSaldoDesc}
                      onChange={(e) => handleChange('cardSaldoDesc', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Card 2: Masuk */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase">Kartu 2 (Titipan Masuk)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Judul Kartu:</label>
                    <input
                      type="text"
                      value={formData.cardMasukJudul}
                      onChange={(e) => handleChange('cardMasukJudul', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Keterangan Bawah:</label>
                    <input
                      type="text"
                      value={formData.cardMasukDesc}
                      onChange={(e) => handleChange('cardMasukDesc', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Card 3: Keluar */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                  <span className="text-[11px] font-bold text-rose-900 uppercase">Kartu 3 (Pembelanjaan EDC)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Judul Kartu:</label>
                    <input
                      type="text"
                      value={formData.cardKeluarJudul}
                      onChange={(e) => handleChange('cardKeluarJudul', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Keterangan Bawah:</label>
                    <input
                      type="text"
                      value={formData.cardKeluarDesc}
                      onChange={(e) => handleChange('cardKeluarDesc', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Card 4: Volume */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">Kartu 4 (Volume Transaksi)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Judul Kartu:</label>
                    <input
                      type="text"
                      value={formData.cardVolumeJudul}
                      onChange={(e) => handleChange('cardVolumeJudul', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Keterangan Bawah:</label>
                    <input
                      type="text"
                      value={formData.cardVolumeDesc}
                      onChange={(e) => handleChange('cardVolumeDesc', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Grafik, Kebijakan Transparansi & Rekap Bulanan */}
        {activeSubTab === 'kebijakan' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              Teks Box Kebijakan Transparansi &amp; Grafik
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Grafik Kategori Belanja:</label>
              <input
                type="text"
                value={formData.chartBelanjaJudul}
                onChange={(e) => handleChange('chartBelanjaJudul', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">Box Informasi Kebijakan Transparansi Uang Digital:</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Judul Kotak Kebijakan:</label>
                <input
                  type="text"
                  value={formData.kebijakanJudul}
                  onChange={(e) => handleChange('kebijakanJudul', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={formData.kebijakanDeskripsi}
                  onChange={(e) => handleChange('kebijakanDeskripsi', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block">3 Poin Kebijakan (Checklist):</span>
                <div>
                  <label className="block text-[10px] text-slate-500">Poin 1:</label>
                  <input
                    type="text"
                    value={formData.kebijakanPoin1}
                    onChange={(e) => handleChange('kebijakanPoin1', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Poin 2:</label>
                  <input
                    type="text"
                    value={formData.kebijakanPoin2}
                    onChange={(e) => handleChange('kebijakanPoin2', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Poin 3:</label>
                  <input
                    type="text"
                    value={formData.kebijakanPoin3}
                    onChange={(e) => handleChange('kebijakanPoin3', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Teks Ajakan Cek Keluarga:</label>
                  <input
                    type="text"
                    value={formData.kebijakanCtaTeks}
                    onChange={(e) => handleChange('kebijakanCtaTeks', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Teks Tombol Buka Cek Saldo:</label>
                  <input
                    type="text"
                    value={formData.kebijakanCtaButton}
                    onChange={(e) => handleChange('kebijakanCtaButton', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Tab Laporan Bulanan */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                Teks Halaman Laporan Setiap Bulan:
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Judul Header Rekap:</label>
                <input
                  type="text"
                  value={formData.laporanBulananJudul}
                  onChange={(e) => handleChange('laporanBulananJudul', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Keterangan Subjudul:</label>
                <textarea
                  rows={2}
                  value={formData.laporanBulananDeskripsi}
                  onChange={(e) => handleChange('laporanBulananDeskripsi', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: Layanan Pengecekan Keluarga */}
        {activeSubTab === 'cek_keluarga' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Teks Layanan Pengecekan Saldo &amp; Mutasi Transaksi Khusus Keluarga
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Layanan:</label>
                <input
                  type="text"
                  value={formData.cekKeluargaBadge}
                  onChange={(e) => handleChange('cekKeluargaBadge', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Layanan:</label>
                <input
                  type="text"
                  value={formData.cekKeluargaJudul}
                  onChange={(e) => handleChange('cekKeluargaJudul', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Paragraf Deskripsi Layanan:</label>
              <textarea
                rows={2}
                value={formData.cekKeluargaDeskripsi}
                onChange={(e) => handleChange('cekKeluargaDeskripsi', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Label Input Pencarian:</label>
                <input
                  type="text"
                  value={formData.cekKeluargaSearchLabel}
                  onChange={(e) => handleChange('cekKeluargaSearchLabel', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contoh Teks Placeholder Kolom Cari:</label>
                <input
                  type="text"
                  value={formData.cekKeluargaSearchPlaceholder}
                  onChange={(e) => handleChange('cekKeluargaSearchPlaceholder', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Privasi &amp; Loket Layanan (Bawah):</label>
              <textarea
                rows={2}
                value={formData.cekKeluargaCatatanPrivasi}
                onChange={(e) => handleChange('cekKeluargaCatatanPrivasi', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-700"
              />
            </div>
          </div>
        )}

        {/* SUBTAB 6: Footer */}
        {activeSubTab === 'footer' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              Teks Footer &amp; Hak Cipta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Keterangan Footer Halaman Beranda (Landing):
                </label>
                <input
                  type="text"
                  value={formData.footerTeksLanding}
                  onChange={(e) => handleChange('footerTeksLanding', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Awalan Footer Halaman Portal Publik:
                </label>
                <input
                  type="text"
                  value={formData.footerTeksPortal}
                  onChange={(e) => handleChange('footerTeksPortal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Perubahan langsung tersimpan di sistem dan dapat dilihat seketika oleh pengunjung Portal Umum.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Reset ke Standar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              Simpan Semua Perubahan Teks
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Konfirmasi Kembalikan Kalimat Default?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan seluruh judul, deskripsi, dan kalimat portal umum ke teks standar bawaan (termasuk kalimat resmi &quot;APLIKASI KEUANGAN UANG DIGITAL &amp; EDC RESMI&quot;).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Ya, Kembalikan ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

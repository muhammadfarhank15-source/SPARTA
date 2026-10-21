import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  Calendar,
  Building,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficialLogo } from '../common/OfficialLogo';
import { formatRupiah, formatDateTimeIndo, exportToCsvWithBOM } from '../../utils/formatters';
import { FamilyWbpChecker } from './FamilyWbpChecker';
import { DEFAULT_PUBLIC_PORTAL_CONTENT } from '../../data/initialData';

interface PublicPortalProps {
  onBackToLanding: () => void;
  onGoToAdmin: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onBackToLanding, onGoToAdmin }) => {
  const {
    uptSettings,
    totalMasuk,
    totalKeluar,
    totalSaldo,
    transactions,
    monthlyReports,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'cek_keluarga' | 'laporan_bulanan'>('ringkasan');

  const content = {
    ...DEFAULT_PUBLIC_PORTAL_CONTENT,
    ...(uptSettings.portalContent || {}),
  };

  // Compute categories distribution for public charts
  const keluarCategories = transactions
    .filter((t) => t.jenisTransaksi === 'Uang Keluar')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.kategori] = (acc[t.kategori] || 0) + t.nominal;
      return acc;
    }, {});

  const handleDownloadPublicMonthlyCsv = (report: (typeof monthlyReports)[0]) => {
    const headers = ['No', 'Periode', 'Status', 'Jumlah Transaksi', 'Total Masuk (Rp)', 'Total Belanja (Rp)', 'Saldo Akhir (Rp)'];
    const rows = [
      [
        1,
        report.periode,
        report.status,
        report.jumlahTransaksi,
        report.totalMasuk,
        report.totalKeluar,
        report.saldoAkhir,
      ],
    ];
    exportToCsvWithBOM(
      `Laporan_Publik_${report.periode.replace(/\s+/g, '_')}`,
      headers,
      rows,
      `Rekap Transparansi Keuangan Periode ${report.periode}`,
      uptSettings.namaUpt
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 mt-1 sm:mt-0"
              title="Kembali ke Halaman Utama"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Logo SPARTA RUJENTO dengan kata/teks berada di bawah logo */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-col items-start">
                <OfficialLogo size="md" />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-montserrat-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider">
                    SPARTA RUJENTO
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline">
                    • PORTAL UMUM
                  </span>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                <h1 className="font-montserrat-extrabold text-xs sm:text-sm text-white tracking-wide uppercase leading-tight">
                  {content.heroJudulBaris1 || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI'}
                </h1>
                <p className="font-montserrat-extrabold text-[10px] sm:text-[11px] text-amber-400 tracking-wider uppercase">
                  {content.heroJudulBaris2 || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{content.portalUmumStatusKoneksi}</span>
              <span className="text-slate-400">• Update: {formatDateTimeIndo(uptSettings.lastSyncTime)}</span>
            </div>

            <button
              onClick={onGoToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            {content.tabRingkasanLabel}
          </button>

          <button
            onClick={() => setActiveTab('cek_keluarga')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'cek_keluarga'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 text-amber-300" />
            {content.tabCekKeluargaLabel}
          </button>

          <button
            onClick={() => setActiveTab('laporan_bulanan')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'laporan_bulanan'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {content.tabLaporanBulananLabel} ({monthlyReports.length})
          </button>
        </div>

        {/* Tab 1: Ringkasan Publik */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 4 Public Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Saldo */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {content.cardSaldoJudul}
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {formatRupiah(totalSaldo)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {content.cardSaldoDesc}
                </div>
              </div>

              {/* Card 2: Total Uang Masuk */}
              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {content.cardMasukJudul}
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {formatRupiah(totalMasuk)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {content.cardMasukDesc}
                </div>
              </div>

              {/* Card 3: Total Pembelanjaan */}
              <div className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    {content.cardKeluarJudul}
                  </span>
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-400">
                  {formatRupiah(totalKeluar)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {content.cardKeluarDesc}
                </div>
              </div>

              {/* Card 4: Volume Transaksi */}
              <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {content.cardVolumeJudul}
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {transactions.length} Transaksi
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {content.cardVolumeDesc}
                </div>
              </div>
            </div>

            {/* Visual Charts & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-amber-400" />
                    {content.chartBelanjaJudul}
                  </h3>
                </div>

                <div className="space-y-3">
                  {Object.entries(keluarCategories).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Belum ada data pengeluaran yang tercatat.
                    </div>
                  ) : (
                    Object.entries(keluarCategories).map(([kategori, nominal]) => {
                      const pct = totalKeluar > 0 ? ((nominal / totalKeluar) * 100).toFixed(1) : '0';
                      return (
                        <div key={kategori} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300">{kategori}</span>
                            <span className="font-mono text-slate-400">
                              <strong className="text-white">{formatRupiah(nominal)}</strong> ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* System Security Notice */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    {content.kebijakanJudul}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {content.kebijakanDeskripsi.replace('{uptSettings.namaUpt}', uptSettings.namaUpt)}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{content.kebijakanPoin1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{content.kebijakanPoin2}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{content.kebijakanPoin3}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{content.kebijakanCtaTeks}</span>
                  <button
                    onClick={() => setActiveTab('cek_keluarga')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {content.kebijakanCtaButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pemeriksaan Keluarga */}
        {activeTab === 'cek_keluarga' && (
          <div className="animate-in fade-in duration-150">
            <FamilyWbpChecker isEmbedded={true} />
          </div>
        )}

        {/* Tab 3: Laporan Transaksi Setiap Bulannya */}
        {activeTab === 'laporan_bulanan' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {content.laporanBulananJudul}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {content.laporanBulananDeskripsi}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3.5">No.</th>
                      <th className="px-4 py-3.5">Periode Bulan</th>
                      <th className="px-4 py-3.5">Status Pembukuan</th>
                      <th className="px-4 py-3.5 text-center">Jumlah Transaksi</th>
                      <th className="px-4 py-3.5 text-right">Total Titipan Masuk</th>
                      <th className="px-4 py-3.5 text-right">Total Belanja Keluar</th>
                      <th className="px-4 py-3.5 text-right">Saldo Akhir Periode</th>
                      <th className="px-4 py-3.5 text-center">Unduh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/70">
                    {monthlyReports.map((rep, idx) => (
                      <tr key={rep.id} className="hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{rep.periode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rep.status === 'Bulan Berjalan'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-400 whitespace-nowrap">
                          {rep.jumlahTransaksi} Laporan
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                          {formatRupiah(rep.totalMasuk)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-400 whitespace-nowrap">
                          {formatRupiah(rep.totalKeluar)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                          {formatRupiah(rep.saldoAkhir)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadPublicMonthlyCsv(rep)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-400 hover:text-amber-300 transition-colors"
                            title="Unduh CSV Periode Ini"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <p>
          {content.footerTeksPortal} © 2026 {uptSettings.namaUpt} • {uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN'} • {uptSettings.kementerian}
        </p>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart as PieIcon,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Building,
  RefreshCw,
  Eye,
  Type,
} from 'lucide-react';
import { useApp, AdminTab } from '../../context/AppContext';
import { OfficialLogo } from '../common/OfficialLogo';
import { AutosaveStatusBar } from '../common/AutosaveStatusBar';
import { AdminDashboard } from './AdminDashboard';
import { WbpManagement } from './WbpManagement';
import { SingleWbpInspection } from './SingleWbpInspection';
import { SaldoStatus } from './SaldoStatus';
import { TitipanMasuk } from './TitipanMasuk';
import { PembelanjaanKantin } from './PembelanjaanKantin';
import { RiwayatTransaksi } from './RiwayatTransaksi';
import { RincianPengeluaran } from './RincianPengeluaran';
import { LaporanKeuangan } from './LaporanKeuangan';
import { GoogleSheetsIntegration } from './GoogleSheetsIntegration';
import { PengaturanUpt } from './PengaturanUpt';
import { PengaturanTeksPortal } from './PengaturanTeksPortal';
import { AuditLogView } from './AuditLogView';
import { ImportExcelWbp } from './ImportExcelWbp';

export const AdminPortal: React.FC = () => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    logoutAdmin,
    uptSettings,
    setCurrentPortal,
    toastNotification,
    setToastNotification,
    hasSyncConflict,
    resolveSyncConflict,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'wbp', label: 'Data Warga Binaan', icon: Users },
    { id: 'import_excel', label: 'Import Data Excel', icon: FileSpreadsheet, badge: 'Excel' },
    { id: 'saldo', label: 'Status Saldo Rekening', icon: Wallet },
    { id: 'cek_wbp', label: 'Pemeriksaan Per WBP', icon: Search, badge: 'Cek' },
    { id: 'titipan_masuk', label: 'Uang Titipan Masuk', icon: TrendingUp },
    { id: 'pembelanjaan', label: 'Pembelanjaan Kantin', icon: TrendingDown },
    { id: 'riwayat', label: 'Riwayat Transaksi', icon: FileText },
    { id: 'rincian_keluar', label: 'Rincian Pengeluaran', icon: PieIcon },
    { id: 'laporan', label: 'Laporan Keuangan', icon: FileSpreadsheet },
    { id: 'teks_portal', label: 'Teks & Kalimat Portal', icon: Type, badge: 'Edit' },
    { id: 'google_sheets', label: 'Integrasi Google Sheets', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit Log & Keamanan', icon: ShieldAlert },
    { id: 'pengaturan_upt', label: 'Pengaturan UPT & Password', icon: Settings },
  ];

  const handleNavClick = (tabId: AdminTab) => {
    setActiveAdminTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 text-slate-200 border-r border-slate-800 shrink-0 select-none">
        {/* Brand / Logo Header with words below the logo in Montserrat ExtraBold */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col items-center text-center gap-1.5">
          <OfficialLogo size="md" />
          <span className="text-[10px] font-montserrat-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider">
            SPARTA RUJENTO
          </span>
          <div className="mt-0.5 space-y-0.5">
            <h1 className="font-montserrat-extrabold text-[10px] text-white uppercase tracking-tight leading-tight">
              STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI
            </h1>
            <p className="font-montserrat-extrabold text-[9px] text-amber-400 uppercase tracking-wide">
              RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.id === 'titipan_masuk'
                        ? 'text-emerald-400'
                        : item.id === 'pembelanjaan'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-400 text-amber-300 font-bold text-xs flex items-center justify-center">
              AD
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">Administrator Kasir</div>
              <div className="text-[10px] text-slate-400 truncate">{uptSettings.namaUpt}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setCurrentPortal('public')}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-800"
              title="Pratinjau Portal Umum"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Portal Umum
            </button>
            <button
              onClick={logoutAdmin}
              className="py-1.5 px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 hover:text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors border border-rose-800"
              title="Keluar dari sesi Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          <div className="relative flex flex-col w-72 bg-slate-950 text-white z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex flex-col items-start gap-1">
                <div className="flex flex-col items-start">
                  <OfficialLogo size="sm" />
                  <span className="font-montserrat-extrabold text-[11px] text-amber-400 mt-1">SPARTA RUJENTO</span>
                </div>
                <span className="font-montserrat-extrabold text-[10px] text-white uppercase leading-tight mt-0.5">
                  STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI
                </span>
                <span className="font-montserrat-extrabold text-[9px] text-amber-300 uppercase">
                  RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO
                </span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={logoutAdmin}
              className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-auto"
            >
              <LogOut className="w-4 h-4" />
              Logout Admin
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="font-montserrat-extrabold text-[11px] text-slate-800 uppercase tracking-tight block">
                {uptSettings.portalContent?.heroJudulBaris1 || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI'}
              </span>
              <h2 className="font-montserrat-extrabold text-xs text-amber-600 uppercase tracking-wide">
                {uptSettings.portalContent?.heroJudulBaris2 || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time 60s Autosave Status Bar */}
            <AutosaveStatusBar />

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPortal('public')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-900" />
                <span className="hidden sm:inline">Lihat</span> Portal Umum
              </button>

              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {toastNotification && (
          <div className="fixed top-16 right-6 z-50 max-w-md animate-fade-in">
            <div
              className={`px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-xs font-semibold ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                  : toastNotification.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-700'
                  : toastNotification.type === 'warning'
                  ? 'bg-amber-950 text-amber-100 border-amber-700'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <span className="flex-1">{toastNotification.message}</span>
              <button
                onClick={() => setToastNotification(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sync Conflict Resolution Alert Modal */}
        {hasSyncConflict && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600 flex items-center justify-between gap-4 text-xs font-bold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-900 text-amber-200">⚠️</span>
              <span>
                Pemberitahuan Sinkronisasi: Database telah diperbarui oleh perangkat atau sesi lain sementara Anda memiliki draf lokal.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resolveSyncConflict('reload')}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-xs"
              >
                Muat Versi Server Terbaru
              </button>
              <button
                onClick={() => resolveSyncConflict('override')}
                className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-lg shadow-xs"
              >
                Simpan &amp; Timpa Draf Saya
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeAdminTab === 'dashboard' && <AdminDashboard />}
          {activeAdminTab === 'wbp' && <WbpManagement />}
          {activeAdminTab === 'import_excel' && <ImportExcelWbp />}
          {activeAdminTab === 'saldo' && <SaldoStatus />}
          {activeAdminTab === 'cek_wbp' && <SingleWbpInspection />}
          {activeAdminTab === 'titipan_masuk' && <TitipanMasuk />}
          {activeAdminTab === 'pembelanjaan' && <PembelanjaanKantin />}
          {activeAdminTab === 'riwayat' && <RiwayatTransaksi />}
          {activeAdminTab === 'rincian_keluar' && <RincianPengeluaran />}
          {activeAdminTab === 'laporan' && <LaporanKeuangan />}
          {activeAdminTab === 'teks_portal' && <PengaturanTeksPortal />}
          {activeAdminTab === 'google_sheets' && <GoogleSheetsIntegration />}
          {activeAdminTab === 'audit' && <AuditLogView />}
          {activeAdminTab === 'pengaturan_upt' && <PengaturanUpt />}
        </main>
      </div>
    </div>
  );
};

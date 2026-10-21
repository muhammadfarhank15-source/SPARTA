import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  Database,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../utils/googleAppsScriptCode';

export const GoogleSheetsIntegration: React.FC = () => {
  const { uptSettings, updateUptSettings, syncWithGoogleSheets, wbpList, transactions } = useApp();

  const [sheetsUrl, setSheetsUrl] = useState(uptSettings.googleSheetsUrl);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateUptSettings({
      googleSheetsUrl: sheetsUrl.trim(),
      syncStatus: sheetsUrl.trim() ? 'Tersambung' : 'Lokal Mode',
    });
    setSyncFeedback({
      type: 'success',
      text: 'URL Web App Google Sheets berhasil disimpan!',
    });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncWithGoogleSheets();
    setIsSyncing(false);
    setSyncFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Integrasi Database Google Sheets & Google Apps Script
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan dasbor aplikasi secara langsung dengan Google Sheets menggunakan Google Apps Script Web App.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                uptSettings.googleSheetsUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>Status: <strong>{uptSettings.syncStatus}</strong></span>
          </div>
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing || !uptSettings.googleSheetsUrl}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{syncFeedback.text}</span>
        </div>
      )}

      {/* Connection URL Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-900" />
          Tautan Google Apps Script Web App Endpoint
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Masukkan URL Web App hasil penerapan (Deploy) Google Apps Script spreadsheet Anda. Endpoint ini bertindak sebagai jembatan API dua arah antara dashboard dan Google Sheets.
        </p>

        <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={sheetsUrl}
            onChange={(e) => setSheetsUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-900"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            Simpan Endpoint
          </button>
        </form>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">API Key Keamanan:</span>{' '}
              <code className="px-2 py-0.5 bg-slate-200 rounded font-mono font-bold text-slate-900">SPARTA</code>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Setiap sinkronisasi dan request otomatis diverifikasi menggunakan API Key ini untuk mencegah akses tidak sah.
          </span>
        </div>
      </div>

      {/* Google Sheets Structure Specifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Spesifikasi Struktur 4 Lembar Kerja (Sheets) pada Spreadsheet Anda
        </h3>
        <p className="text-xs text-slate-600">
          Saat fungsi <code>inisialisasiSheetDanFormat()</code> dijalankan di Apps Script, 4 sheet berikut beserta header rapi dengan skema warna resmi akan dibuat secara otomatis:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase block">
              1. Lembar Kerja: TRANSAKSI
            </span>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div><strong>Kolom:</strong> ID Transaksi • No Transaksi • Tanggal • Nama WBP • Jenis Transaksi • Kategori • Nominal (Rp) • Sumber/Tujuan • Keterangan • Petugas Kasir • Waktu Pencatatan</div>
              <div className="text-slate-500 italic">Mencatat seluruh mutasi uang masuk dan belanja secara real-time.</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase block">
              2. Lembar Kerja: WARGA_BINAAN
            </span>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div><strong>Kolom:</strong> ID • No Registrasi • Nama Lengkap • Blok Hunian • Status • Saldo Awal (Rp) • Saldo Berjalan (Rp) • Tanggal Masuk • Tanggal Bebas • UPT Tujuan • No SK Mutasi</div>
              <div className="text-slate-500 italic">Master data WBP beserta saldo digital masing-masing.</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase block">
              3. Lembar Kerja: PENGATURAN
            </span>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div><strong>Kolom:</strong> Parameter • Nilai</div>
              <div className="text-slate-500 italic">Menyimpan identitas instansi, nama UPT, kementerian, dan konfigurasi sistem.</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase block">
              4. Lembar Kerja: ARSIP_BULANAN (REKAP)
            </span>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div><strong>Kolom:</strong> ID • Periode • Tahun • Bulan • Status Pembukuan • Jumlah Transaksi • Total Masuk (Rp) • Total Keluar (Rp) • Saldo Bersih (Rp) • Tanggal Tutup Buku • Petugas</div>
              <div className="text-slate-500 italic">Arsip rekapitulasi tutup buku bulanan.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyable Code.gs Apps Script */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Google Apps Script Backend
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Kode Lengkap Code.gs (Siap Salin & Tempel)
            </h3>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode Apps Script'}
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2 leading-relaxed">
          <div className="font-bold text-amber-300">Petunjuk Pemasangan 5 Langkah:</div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300 text-[11px]">
            <li>Buat Spreadsheet baru di Google Drive / Google Sheets.</li>
            <li>Klik menu <strong>Ekstensi (Extensions)</strong> → <strong>Apps Script</strong>.</li>
            <li>Hapus kode bawaan di file <code>Code.gs</code>, lalu tempelkan seluruh kode di bawah ini.</li>
            <li>Pilih fungsi <code>inisialisasiSheetDanFormat</code> pada menu fungsi di toolbar Apps Script, lalu klik <strong>Jalankan (Run)</strong> untuk membuat lembar kerja otomatis yang rapi dan terformat.</li>
            <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> → <strong>Penerapan baru (New deployment)</strong> → Jenis: <strong>Aplikasi web (Web app)</strong> → Akses: <strong>Siapa saja (Anyone)</strong> → Salin URL yang dihasilkan ke form di atas.</li>
          </ol>
        </div>

        {/* Code View */}
        <div className="relative">
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RotateCcw,
  Search,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Download,
  AlertCircle,
  UserCheck,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTimeIndo, exportToCsvWithBOM } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { WargaBinaan } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    uptSettings,
    totalMasuk,
    totalKeluar,
    totalSaldo,
    transaksiBulanIniCount,
    pengeluaranBulanIni,
    transactions,
    wbpList,
    monthlyReports,
    setActiveAdminTab,
    setSelectedWbpIdForInspection,
    resetTotalTitipanMasuk,
    resetTotalPembelanjaan,
    resetTotalSaldoTitipan,
    isUsingDummyData,
    clearAllDummyData,
    loadDummyData,
  } = useApp();

  // Reset Modals State
  const [resetType, setResetType] = useState<'masuk' | 'keluar' | 'saldo' | null>(null);

  // Quick WBP Checker on Dashboard
  const [wbpSearch, setWbpSearch] = useState('');
  const [inspectedWbp, setInspectedWbp] = useState<WargaBinaan | null>(null);

  const filteredWbpList = wbpSearch.trim()
    ? wbpList.filter(
        (w) =>
          w.nama.toLowerCase().includes(wbpSearch.toLowerCase()) ||
          w.nomorRegistrasi.toLowerCase().includes(wbpSearch.toLowerCase())
      )
    : [];

  // Compute stats for inspected WBP
  const inspectedTrx = inspectedWbp
    ? transactions.filter((t) => t.wbpId === inspectedWbp.id)
    : [];

  const inspectedMasuk = inspectedTrx
    .filter((t) => t.jenisTransaksi === 'Uang Masuk')
    .reduce((acc, t) => acc + t.nominal, 0);

  const inspectedKeluar = inspectedTrx
    .filter((t) => t.jenisTransaksi === 'Uang Keluar')
    .reduce((acc, t) => acc + t.nominal, 0);

  const inspectedKeluarBulanIni = inspectedTrx
    .filter((t) => {
      const d = new Date(t.tanggal);
      return t.jenisTransaksi === 'Uang Keluar' && !isNaN(d.getTime()) && d.getMonth() + 1 === 10 && d.getFullYear() === 2026;
    })
    .reduce((acc, t) => acc + t.nominal, 0);

  // Handle Download CSV for specific monthly report
  const handleDownloadMonthlyCsv = (report: (typeof monthlyReports)[0]) => {
    const headers = [
      'No',
      'Periode',
      'Status Pembukuan',
      'Volume Laporan',
      'Total Titipan Masuk (Rp)',
      'Total Belanja Kantin (Rp)',
      'Netto / Saldo Akhir (Rp)',
    ];
    const rows = [
      [
        1,
        report.periode,
        report.status,
        `${report.jumlahTransaksi} Laporan`,
        report.totalMasuk,
        report.totalKeluar,
        report.saldoAkhir,
      ],
    ];
    exportToCsvWithBOM(
      `Laporan_Keuangan_${report.periode.replace(/\s+/g, '_')}`,
      headers,
      rows,
      `Rekapitulasi Laporan Keuangan Periode ${report.periode}`,
      uptSettings.namaUpt,
      [
        `Status Pembukuan: ${report.status}`,
        report.tanggalTutupBuku ? `Waktu Tutup Buku: ${report.tanggalTutupBuku}` : 'Status: Periode Berjalan',
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase">
              Dashboard Keuangan Terpadu
            </span>
            <span className="text-xs text-slate-400">• {uptSettings.namaUpt}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black mt-1">
            Ringkasan Keuangan Warga Binaan
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Data transaksi tersinkronisasi otomatis dengan perhitungan saldo real-time dan buku kas Google Sheets.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveAdminTab('import_excel')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-200" />
            Import Excel WBP
          </button>
          <button
            onClick={() => setActiveAdminTab('titipan_masuk')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + Uang Titipan Masuk
          </button>
          <button
            onClick={() => setActiveAdminTab('pembelanjaan')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + Belanja EDC Kantin
          </button>
          <button
            onClick={() => setActiveAdminTab('wbp')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            Registrasi WBP
          </button>
        </div>
      </div>

      {/* Demo Data Notice if Active */}
      {isUsingDummyData && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Sistem sedang menampilkan data dummy/percontohan ({wbpList.length} WBP, {transactions.length} Transaksi).
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={clearAllDummyData}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors"
            >
              Hapus Seluruh Data Dummy
            </button>
          </div>
        </div>
      )}

      {/* 5 Statistics Financial Cards WITH RESET BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: TOTAL TITIPAN MASUK with RESET BUTTON */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Total Titipan Masuk
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-xl lg:text-2xl font-black text-emerald-700">
              {formatRupiah(totalMasuk)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Akumulasi setoran & transfer
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Kasir Rutan</span>
            <button
              onClick={() => setResetType('masuk')}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
              title="Reset Total Titipan Masuk menjadi Rp 0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (Rp 0)
            </button>
          </div>
        </div>

        {/* Card 2: TOTAL PEMBELANJAAN with RESET BUTTON */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Total Pembelanjaan
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-xl lg:text-2xl font-black text-rose-700">
              {formatRupiah(totalKeluar)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Pengeluaran EDC & kantin
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">EDC Terverifikasi</span>
            <button
              onClick={() => setResetType('keluar')}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
              title="Reset Total Pembelanjaan menjadi Rp 0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (Rp 0)
            </button>
          </div>
        </div>

        {/* Card 3: TOTAL SALDO TITIPAN with RESET BUTTON */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Total Saldo Titipan
            </span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-xl lg:text-2xl font-black text-blue-950">
              {formatRupiah(totalSaldo)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Saldo aktif di rekening WBP
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Total Akun WBP</span>
            <button
              onClick={() => setResetType('saldo')}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
              title="Reset Saldo Semua WBP menjadi Rp 0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (Rp 0)
            </button>
          </div>
        </div>

        {/* Card 4: PENGELUARAN BULAN INI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pengeluaran Bulan Ini
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-xl lg:text-2xl font-black text-slate-900">
              {formatRupiah(pengeluaranBulanIni)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Oktober 2026 berjalan
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            {transaksiBulanIniCount} mutasi bulan ini
          </div>
        </div>

        {/* Card 5: JUMLAH TRANSAKSI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Jumlah Transaksi
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-xl lg:text-2xl font-black text-slate-900">
              {transactions.length}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Total catatan mutasi
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Terhubung ke Google Sheets
          </div>
        </div>
      </div>

      {/* FITUR PENGECEKAN DATA TRANSAKSI PER WARGA BINAAN DENGAN INPUT NAMA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-900" />
              Pemeriksaan Data Transaksi Cepat Per Warga Binaan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cek saldo, total masuk, total keluar, dan mutasi seorang WBP cukup dengan mengetik namanya saja.
            </p>
          </div>
          {inspectedWbp && (
            <button
              onClick={() => {
                setSelectedWbpIdForInspection(inspectedWbp.id);
                setActiveAdminTab('cek_wbp');
              }}
              className="text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start sm:self-auto"
            >
              Buka Rekening Koran Lengkap
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Input Name Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={wbpSearch}
            onChange={(e) => setWbpSearch(e.target.value)}
            placeholder="Ketik Nama WBP (contoh: Andi Mallombassang, Daeng Bella, atau Muh. Rusdi)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900 shadow-xs"
          />
        </div>

        {/* Autocomplete Dropdown if typing */}
        {wbpSearch.trim().length > 0 && !inspectedWbp && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-48 overflow-y-auto">
            {filteredWbpList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Tidak ada WBP yang cocok dengan kata kunci &quot;{wbpSearch}&quot;.
              </div>
            ) : (
              filteredWbpList.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setInspectedWbp(w);
                    setWbpSearch(w.nama);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white text-xs font-medium text-slate-800 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                >
                  <span className="font-bold text-slate-900">
                    {w.nama} <span className="font-normal text-slate-500">({w.nomorRegistrasi} • {w.blokHunian})</span>
                  </span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Saldo: {formatRupiah(w.saldoBerjalan)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Display Inspected WBP Detail Card */}
        {inspectedWbp ? (
          <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-blue-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center">
                  {inspectedWbp.nama.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {inspectedWbp.nama}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inspectedWbp.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inspectedWbp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    No. Reg: <strong className="text-slate-700">{inspectedWbp.nomorRegistrasi}</strong> • Blok: <strong className="text-slate-700">{inspectedWbp.blokHunian}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectedWbp(null);
                  setWbpSearch('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline self-start sm:self-auto"
              >
                Ganti Nama
              </button>
            </div>

            {/* 5 Stats specifically for this WBP */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Titipan Masuk</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">{formatRupiah(inspectedMasuk)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Total Belanja Keluar</span>
                <span className="text-sm font-black text-rose-600 block mt-0.5">{formatRupiah(inspectedKeluar)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-300">
                <span className="text-[10px] font-bold text-blue-900 uppercase block">Saldo Terkini</span>
                <span className="text-base font-black text-blue-950 block mt-0.5">{formatRupiah(inspectedWbp.saldoBerjalan)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Belanja Bulan Ini</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{formatRupiah(inspectedKeluarBulanIni)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Jumlah Mutasi</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{inspectedTrx.length} Transaksi</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Ketik nama warga binaan pada kolom pencarian di atas untuk menampilkan rincian keuangan perorangan secara instan.
          </div>
        )}
      </div>

      {/* INFORMASI JUMLAH LAPORAN TRANSAKSI SETIAP BULANNYA DI PORTAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Informasi Jumlah Laporan Transaksi Setiap Bulannya
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi total laporan transaksi, volume masuk, belanja keluar, dan saldo akhir per periode pembukuan.
            </p>
          </div>
          <button
            onClick={() => setActiveAdminTab('laporan')}
            className="text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start sm:self-auto"
          >
            Buka Menu Laporan Keuangan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Periode Bulan</th>
                  <th className="px-4 py-3">Status Pembukuan</th>
                  <th className="px-4 py-3 text-center">Jumlah Laporan Transaksi</th>
                  <th className="px-4 py-3 text-right">Total Titipan Masuk</th>
                  <th className="px-4 py-3 text-right">Total Belanja Keluar</th>
                  <th className="px-4 py-3 text-right">Netto / Saldo Akhir</th>
                  <th className="px-4 py-3 text-center">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {monthlyReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{report.periode}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          report.status === 'Bulan Berjalan'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-amber-700 whitespace-nowrap">
                      {report.jumlahTransaksi} Laporan Transaksi
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {formatRupiah(report.totalMasuk)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                      {formatRupiah(report.totalKeluar)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatRupiah(report.saldoAkhir)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadMonthlyCsv(report)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 hover:text-blue-950 font-bold transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="Unduh CSV Laporan Bulan Tersebut"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV Rapi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRM MODALS FOR RESET ACTIONS */}
      <ConfirmModal
        isOpen={resetType === 'masuk'}
        title="Konfirmasi Reset Total Titipan Masuk"
        message="Apakah Anda yakin ingin mereset angka TOTAL TITIPAN MASUK menjadi Rp 0? Seluruh transaksi masuk dalam periode ini akan di-reset untuk membuka pencatatan baru."
        confirmText="Ya, Reset Menjadi Rp 0"
        isDanger={true}
        requiredTypedConfirmation="RESET"
        onConfirm={() => {
          resetTotalTitipanMasuk();
          setResetType(null);
        }}
        onCancel={() => setResetType(null)}
      />

      <ConfirmModal
        isOpen={resetType === 'keluar'}
        title="Konfirmasi Reset Total Pembelanjaan"
        message="Apakah Anda yakin ingin mereset angka TOTAL PEMBELANJAAN menjadi Rp 0? Seluruh catatan belanja keluar periode ini akan di-reset."
        confirmText="Ya, Reset Menjadi Rp 0"
        isDanger={true}
        requiredTypedConfirmation="RESET"
        onConfirm={() => {
          resetTotalPembelanjaan();
          setResetType(null);
        }}
        onCancel={() => setResetType(null)}
      />

      <ConfirmModal
        isOpen={resetType === 'saldo'}
        title="Konfirmasi Reset Saldo Seluruh WBP"
        message="PERINGATAN TINGGI! Tindakan ini akan mereset saldo berjalan SELURUH Warga Binaan menjadi Rp 0. Pastikan Anda telah mengunduh cadangan laporan sebelum melanjutkan."
        confirmText="Ya, Reset Seluruh Saldo ke Rp 0"
        isDanger={true}
        requiredTypedConfirmation="RESET"
        requirePassword={true}
        onConfirm={() => {
          resetTotalSaldoTitipan();
          setResetType(null);
        }}
        onCancel={() => setResetType(null)}
      />
    </div>
  );
};

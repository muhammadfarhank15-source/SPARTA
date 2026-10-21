import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Trash2,
  CheckCircle,
  Building,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LaporanBulanan } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  formatDateTimeIndo,
  exportToCsvWithBOM,
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { OfficialLogo } from '../common/OfficialLogo';

export const LaporanKeuangan: React.FC = () => {
  const {
    transactions,
    monthlyReports,
    deleteMonthlyReport,
    uptSettings,
    totalMasuk,
    totalKeluar,
    totalSaldo,
  } = useApp();

  const [filterType, setFilterType] = useState<'harian' | 'bulanan' | 'rentang'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  // Deleting monthly report archive state
  const [deletingReport, setDeletingReport] = useState<LaporanBulanan | null>(null);

  // Compute transactions based on report filter
  const filteredTrx = transactions.filter((t) => {
    if (filterType === 'harian') {
      return t.tanggal === selectedDate;
    }
    if (filterType === 'bulanan') {
      const d = new Date(t.tanggal);
      return (
        !isNaN(d.getTime()) &&
        d.getMonth() + 1 === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    }
    if (filterType === 'rentang') {
      return (!startDate || t.tanggal >= startDate) && (!endDate || t.tanggal <= endDate);
    }
    return true;
  });

  const periodMasuk = filteredTrx
    .filter((t) => t.jenisTransaksi === 'Uang Masuk')
    .reduce((a, b) => a + b.nominal, 0);

  const periodKeluar = filteredTrx
    .filter((t) => t.jenisTransaksi === 'Uang Keluar')
    .reduce((a, b) => a + b.nominal, 0);

  const periodNetto = periodMasuk - periodKeluar;

  const handlePrintOfficial = () => {
    window.print();
  };

  const handleExportPeriodCsv = () => {
    const periodLabel =
      filterType === 'harian'
        ? `Harian_${selectedDate}`
        : filterType === 'bulanan'
        ? `Bulanan_${selectedMonth}_${selectedYear}`
        : `Periode_${startDate}_sd_${endDate}`;

    const headers = [
      'No',
      'Tanggal',
      'No Transaksi',
      'Nama WBP',
      'Jenis Mutasi',
      'Kategori',
      'Nominal Masuk (Rp)',
      'Nominal Keluar (Rp)',
      'Saldo Berjalan (Rp)',
      'Petugas Kasir',
      'Keterangan',
    ];

    const rows = filteredTrx.map((t, idx) => [
      idx + 1,
      t.tanggal,
      t.nomorTransaksi,
      t.namaWbp,
      t.jenisTransaksi,
      t.kategori,
      t.jenisTransaksi === 'Uang Masuk' ? t.nominal : 0,
      t.jenisTransaksi === 'Uang Keluar' ? t.nominal : 0,
      t.saldoSetelahTransaksi,
      t.petugas,
      t.keterangan,
    ]);

    exportToCsvWithBOM(
      `Laporan_Keuangan_${periodLabel}`,
      headers,
      rows,
      `Laporan Pertanggungjawaban Kas Transaksi Keuangan Digital WBP`,
      uptSettings.namaUpt,
      [
        `Periode Laporan: ${periodLabel.replace(/_/g, ' ')}`,
        `Total Masuk: ${formatRupiah(periodMasuk)}`,
        `Total Keluar: ${formatRupiah(periodKeluar)}`,
        `Netto Mutasi: ${formatRupiah(periodNetto)}`,
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Laporan Keuangan & Arsip Pertanggungjawaban
              </h2>
              <p className="text-xs text-slate-500">
                Penyajian laporan kas harian, bulanan, cetak dokumen resmi, dan pengunduhan CSV rapi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPeriodCsv}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Unduh CSV Laporan
          </button>
          <button
            onClick={handlePrintOfficial}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Cetak Dokumen Resmi (PDF)
          </button>
        </div>
      </div>

      {/* Filter Period Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setFilterType('bulanan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'bulanan'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan Bulanan
          </button>
          <button
            onClick={() => setFilterType('harian')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'harian'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan Harian
          </button>
          <button
            onClick={() => setFilterType('rentang')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'rentang'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rentang Tanggal
          </button>
        </div>

        {/* Dynamic Inputs */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {filterType === 'harian' && (
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          )}

          {filterType === 'bulanan' && (
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bulan:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {[
                    { id: '1', name: 'Januari' },
                    { id: '2', name: 'Februari' },
                    { id: '3', name: 'Maret' },
                    { id: '4', name: 'April' },
                    { id: '5', name: 'Mei' },
                    { id: '6', name: 'Juni' },
                    { id: '7', name: 'Juli' },
                    { id: '8', name: 'Agustus' },
                    { id: '9', name: 'September' },
                    { id: '10', name: 'Oktober' },
                    { id: '11', name: 'November' },
                    { id: '12', name: 'Desember' },
                  ].map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tahun:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>
          )}

          {filterType === 'rentang' && (
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dari Tanggal:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4 Financial Totals for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Volume Transaksi
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {filteredTrx.length} Catatan
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Uang Masuk Periode Ini
            </span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              + {formatRupiah(periodMasuk)}
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              Uang Keluar Periode Ini
            </span>
            <div className="text-lg font-black text-rose-700 mt-0.5">
              - {formatRupiah(periodKeluar)}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
              Netto Mutasi Kas
            </span>
            <div className="text-lg font-black text-blue-950 mt-0.5">
              {formatRupiah(periodNetto)}
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL REPORT PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 print:p-0 print:border-none print:shadow-none" id="official-report-doc">
        {/* Official Kop Dokumen */}
        <div className="text-center pb-4 border-b-2 border-slate-900 flex flex-col items-center">
          <OfficialLogo size="md" className="mb-2" />
          <span className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
            {uptSettings.kementerian}
          </span>
          <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
            {uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN'}
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            {uptSettings.kanwil}
          </span>
          <h1 className="text-lg font-black text-slate-900 tracking-wide uppercase mt-0.5">
            {uptSettings.namaUpt}
          </h1>
          <p className="text-[11px] text-slate-500">
            {uptSettings.alamat}, {uptSettings.kota}
          </p>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 underline">
            LAPORAN REKAPITULASI TRANSAKSI KEUANGAN WARGA BINAAN
          </h3>
          <p className="text-xs text-slate-600">
            Periode:{' '}
            <strong>
              {filterType === 'harian'
                ? formatDateIndo(selectedDate)
                : filterType === 'bulanan'
                ? `Bulan ${selectedMonth} Tahun ${selectedYear}`
                : `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`}
            </strong>
          </p>
        </div>

        {/* Transactions Table for this report */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="px-3 py-2 text-center w-10">No</th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">No Transaksi</th>
                <th className="px-3 py-2">Nama Warga Binaan</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2 text-right">Uang Masuk</th>
                <th className="px-3 py-2 text-right">Uang Keluar</th>
                <th className="px-3 py-2 text-right">Saldo Terkini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Tidak ada mutasi transaksi pada periode laporan ini.
                  </td>
                </tr>
              ) : (
                filteredTrx.map((trx, idx) => (
                  <tr key={trx.id}>
                    <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{trx.tanggal}</td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap">{trx.nomorTransaksi}</td>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{trx.namaWbp}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{trx.kategori}</td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {trx.jenisTransaksi === 'Uang Masuk' ? formatRupiah(trx.nominal) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-rose-700 whitespace-nowrap">
                      {trx.jenisTransaksi === 'Uang Keluar' ? formatRupiah(trx.nominal) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                      {formatRupiah(trx.saldoSetelahTransaksi)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
              <tr>
                <td colSpan={5} className="px-3 py-2.5 text-right uppercase">
                  TOTAL KESELURUHAN PERIODE:
                </td>
                <td className="px-3 py-2.5 text-right text-emerald-800">
                  {formatRupiah(periodMasuk)}
                </td>
                <td className="px-3 py-2.5 text-right text-rose-800">
                  {formatRupiah(periodKeluar)}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-900">
                  Netto: {formatRupiah(periodNetto)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-800 uppercase mt-0.5">Kepala {uptSettings.namaUpt}</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{uptSettings.kepalaUptNama}</p>
            <p className="text-[11px] text-slate-600">NIP. {uptSettings.kepalaUptNip}</p>
          </div>

          <div>
            <p className="text-slate-600">{uptSettings.kota.split(',')[0]}, {formatDateIndo(new Date().toISOString().substring(0, 10))}</p>
            <p className="font-bold text-slate-800 uppercase mt-0.5">Kasir / Bendahara Pengeluaran</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{uptSettings.bendaharaNama}</p>
            {uptSettings.bendaharaNip && uptSettings.bendaharaNip !== '-' && (
              <p className="text-[11px] text-slate-600">NIP. {uptSettings.bendaharaNip}</p>
            )}
          </div>
        </div>
      </div>

      {/* RIWAYAT ARSIP LAPORAN BULANAN DENGAN TOMBOL HAPUS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Riwayat Arsip Laporan Bulanan ({monthlyReports.length} Laporan)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap penutupan buku bulanan tersimpan rapi di sini dan dapat diunduh atau dihapus jika diperlukan.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Volume Transaksi</th>
                  <th className="px-4 py-3 text-right">Total Masuk</th>
                  <th className="px-4 py-3 text-right">Total Keluar</th>
                  <th className="px-4 py-3 text-right">Saldo Akhir</th>
                  <th className="px-4 py-3 text-center">Aksi Arsip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{report.periode}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          report.status === 'Bulan Berjalan'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-amber-700 whitespace-nowrap">
                      {report.jumlahTransaksi} Laporan
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
                      <div className="inline-flex items-center gap-2">
                        {/* Download CSV */}
                        <button
                          onClick={() => {
                            const headers = ['No', 'Periode', 'Status', 'Jumlah Trx', 'Total Masuk', 'Total Keluar', 'Saldo Akhir'];
                            const rows = [
                              [1, report.periode, report.status, report.jumlahTransaksi, report.totalMasuk, report.totalKeluar, report.saldoAkhir],
                            ];
                            exportToCsvWithBOM(`Arsip_Laporan_${report.periode.replace(/\s+/g, '_')}`, headers, rows, `Arsip Laporan ${report.periode}`, uptSettings.namaUpt);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors"
                          title="Unduh CSV Arsip"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* TOMBOL HAPUS ARSIP LAPORAN DENGAN KONFIRMASI */}
                        <button
                          onClick={() => setDeletingReport(report)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors border border-rose-200"
                          title="Hapus Arsip Laporan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL FOR MONTHLY REPORT */}
      <ConfirmModal
        isOpen={Boolean(deletingReport)}
        title="Konfirmasi Hapus Arsip Laporan Keuangan"
        message={`Apakah Anda yakin ingin menghapus arsip Laporan Keuangan Periode "${deletingReport?.periode}"?\n\nTotal Masuk: ${formatRupiah(
          deletingReport?.totalMasuk || 0
        )}\nTotal Keluar: ${formatRupiah(
          deletingReport?.totalKeluar || 0
        )}\nSaldo Akhir: ${formatRupiah(
          deletingReport?.saldoAkhir || 0
        )}.\n\nTindakan ini bersifat permanen dan akan dicatat ke dalam Audit Trail Keamanan.`}
        confirmText="Ya, Hapus Arsip Laporan"
        isDanger={true}
        requiredTypedConfirmation="HAPUS"
        onConfirm={() => {
          if (deletingReport) {
            deleteMonthlyReport(deletingReport.id);
            setDeletingReport(null);
          }
        }}
        onCancel={() => setDeletingReport(null)}
      />
    </div>
  );
};

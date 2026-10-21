import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Users,
  Building,
  TrendingDown,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTimeIndo, exportToCsvWithBOM } from '../../utils/formatters';

export const RincianPengeluaran: React.FC = () => {
  const { transactions, uptSettings } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'semua' | 'bulan_ini' | 'minggu_ini' | 'hari_ini'>('semua');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Filter transactions by selected period
  const now = new Date();
  const keluarTransactions = transactions.filter((t) => {
    if (t.jenisTransaksi !== 'Uang Keluar') return false;
    const d = new Date(t.tanggal);
    if (isNaN(d.getTime())) return true;

    if (periodFilter === 'hari_ini') {
      const todayStr = new Date().toISOString().substring(0, 10);
      return t.tanggal === todayStr;
    }
    if (periodFilter === 'bulan_ini') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (periodFilter === 'minggu_ini') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  });

  const totalKeluar = keluarTransactions.reduce((acc, t) => acc + t.nominal, 0);

  // Group by category
  const categoryStats = keluarTransactions.reduce<Record<string, { total: number; count: number }>>(
    (acc, t) => {
      if (!acc[t.kategori]) {
        acc[t.kategori] = { total: 0, count: 0 };
      }
      acc[t.kategori].total += t.nominal;
      acc[t.kategori].count += 1;
      return acc;
    },
    {}
  );

  // Group by recipient WBP
  const recipientStats = keluarTransactions.reduce<Record<string, { total: number; count: number }>>(
    (acc, t) => {
      if (!acc[t.namaWbp]) {
        acc[t.namaWbp] = { total: 0, count: 0 };
      }
      acc[t.namaWbp].total += t.nominal;
      acc[t.namaWbp].count += 1;
      return acc;
    },
    {}
  );

  // Detail transactions for selected category
  const detailList = selectedCategoryDetail
    ? keluarTransactions.filter((t) => t.kategori === selectedCategoryDetail)
    : keluarTransactions;

  const handleExportAnalysisCsv = () => {
    const headers = ['No', 'Kategori Pengeluaran', 'Jumlah Transaksi', 'Total Nominal (Rp)', 'Persentase (%)'];
    const rows = Object.entries(categoryStats).map(([cat, val], idx) => {
      const pct = totalKeluar > 0 ? ((val.total / totalKeluar) * 100).toFixed(2) : '0';
      return [idx + 1, cat, val.count, val.total, `${pct}%`];
    });

    exportToCsvWithBOM(
      `Rincian_Penggunaan_Uang_Keluar_${periodFilter}`,
      headers,
      rows,
      `Analisis Penggunaan Uang Keluar Periode: ${periodFilter.replace('_', ' ').toUpperCase()}`,
      uptSettings.namaUpt,
      [`Total Pengeluaran: ${formatRupiah(totalKeluar)}`, `Jumlah Transaksi: ${keluarTransactions.length}`]
    );
  };

  const colors = [
    'from-rose-500 to-rose-600',
    'from-amber-500 to-amber-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-indigo-500 to-indigo-600',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <PieIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Rincian & Analisis Penggunaan Uang Keluar
              </h2>
              <p className="text-xs text-slate-500">
                Transparansi alokasi belanja kantin, kebutuhan harian, dan pembelian barang oleh WBP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportAnalysisCsv}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Ekspor Analisis CSV
          </button>
        </div>
      </div>

      {/* Period Selector & Total Callout */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
            Periode Analisis:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'semua', label: 'Seluruh Periode' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'minggu_ini', label: '7 Hari Terakhir' },
              { id: 'hari_ini', label: 'Hari Ini' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as typeof periodFilter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodFilter === p.id
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-left md:text-right bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
            Total Uang Keluar Periode Ini
          </span>
          <div className="text-2xl md:text-3xl font-black text-rose-400 mt-0.5">
            {formatRupiah(totalKeluar)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Dari <strong>{keluarTransactions.length}</strong> transaksi pembelanjaan EDC
          </span>
        </div>
      </div>

      {/* Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Comparison Bars */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-900" />
              Perbandingan Pengeluaran Setiap Kategori
            </h3>
            {selectedCategoryDetail && (
              <button
                onClick={() => setSelectedCategoryDetail(null)}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Lihat Semua
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {Object.keys(categoryStats).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada data transaksi pengeluaran pada periode ini.
              </div>
            ) : (
              Object.entries(categoryStats).map(([cat, val], idx) => {
                const pct = totalKeluar > 0 ? (val.total / totalKeluar) * 100 : 0;
                const isSelected = selectedCategoryDetail === cat;
                return (
                  <div
                    key={cat}
                    onClick={() =>
                      setSelectedCategoryDetail(isSelected ? null : cat)
                    }
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${
                            colors[idx % colors.length]
                          }`}
                        ></span>
                        {cat}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({val.count} Transaksi)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(val.total)}{' '}
                        <span className="text-slate-500 font-normal">
                          ({pct.toFixed(1)}%)
                        </span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          colors[idx % colors.length]
                        } transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Recipients (WBP Belanja) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Rekap Pengeluaran per Warga Binaan
            </h3>
            <span className="text-xs text-slate-500">
              {Object.keys(recipientStats).length} WBP Aktif Belanja
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
            {Object.keys(recipientStats).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada transaksi WBP pada periode ini.
              </div>
            ) : (
              Object.entries(recipientStats)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([nama, val], idx) => {
                  const pct = totalKeluar > 0 ? ((val.total / totalKeluar) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={nama}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{nama}</div>
                          <div className="text-[10px] text-slate-500">{val.count} kali transaksi</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-700">{formatRupiah(val.total)}</div>
                        <div className="text-[10px] text-slate-500">{pct}% dari total</div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Detail Table of transactions for this category */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Detail Transaksi Pembentuk Pengeluaran {selectedCategoryDetail ? `[Kategori: ${selectedCategoryDetail}]` : ''} ({detailList.length} Transaksi)
          </h3>
          <span className="text-xs text-slate-500">
            Total: <strong className="text-rose-700">{formatRupiah(detailList.reduce((a, b) => a + b.nominal, 0))}</strong>
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">No Transaksi</th>
                  <th className="px-4 py-3">Warga Binaan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Merchant / Lokasi</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {detailList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      Tidak ada transaksi pengeluaran.
                    </td>
                  </tr>
                ) : (
                  detailList.map((trx, idx) => (
                    <tr key={trx.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDateTimeIndo(trx.waktuPencatatan)}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-700 whitespace-nowrap">{trx.nomorTransaksi}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">{trx.namaWbp}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{trx.kategori}</td>
                      <td className="px-4 py-2.5 text-right font-black text-rose-600 whitespace-nowrap">- {formatRupiah(trx.nominal)}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{trx.sumberAtauTujuan}</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{trx.keterangan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

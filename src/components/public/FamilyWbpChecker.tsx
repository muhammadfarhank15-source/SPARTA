import React, { useState } from 'react';
import { Search, UserCheck, ShieldCheck, ArrowDownLeft, ArrowUpRight, Clock, Building2, Printer, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../../utils/formatters';
import { WargaBinaan } from '../../types';
import { DEFAULT_PUBLIC_PORTAL_CONTENT } from '../../data/initialData';

interface FamilyWbpCheckerProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const FamilyWbpChecker: React.FC<FamilyWbpCheckerProps> = ({ onBack, isEmbedded = false }) => {
  const { wbpList, transactions, uptSettings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWbp, setSelectedWbp] = useState<WargaBinaan | null>(null);

  const content = {
    ...DEFAULT_PUBLIC_PORTAL_CONTENT,
    ...(uptSettings.portalContent || {}),
  };

  // Filter matched WBP (by name or reg number)
  const filteredWbp = searchQuery.trim()
    ? wbpList.filter(
        (w) =>
          w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.nomorRegistrasi.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filter transactions for selected WBP
  const wbpTransactions = selectedWbp
    ? transactions.filter((t) => t.wbpId === selectedWbp.id)
    : [];

  const totalMasukWbp = wbpTransactions
    .filter((t) => t.jenisTransaksi === 'Uang Masuk')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalKeluarWbp = wbpTransactions
    .filter((t) => t.jenisTransaksi === 'Uang Keluar')
    .reduce((acc, t) => acc + t.nominal, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'max-w-5xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" />
              {content.cekKeluargaBadge}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {content.cekKeluargaJudul}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {content.cekKeluargaDeskripsi.replace('{uptSettings.namaUpt}', uptSettings.namaUpt)}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="self-start md:self-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Menu Utama
            </button>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            {content.cekKeluargaSearchLabel}
          </label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={content.cekKeluargaSearchPlaceholder}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Autocomplete / Search Match Suggestions */}
        {searchQuery.trim().length > 0 && !selectedWbp && (
          <div className="mt-3 bg-white text-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {filteredWbp.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Tidak ditemukan warga binaan dengan nama &quot;{searchQuery}&quot;. Pastikan ejaan nama atau nomor registrasi sesuai.
              </div>
            ) : (
              filteredWbp.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWbp(w);
                    setSearchQuery(w.nama);
                  }}
                  className="w-full text-left p-3.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {w.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{w.nama}</div>
                      <div className="text-xs text-slate-500">
                        No. Reg: {w.nomorRegistrasi} • {w.blokHunian}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        w.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : w.status === 'Bebas'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {w.status}
                    </span>
                    <span className="text-xs font-bold text-blue-900 bg-blue-100/60 px-3 py-1 rounded-lg">
                      Pilih WBP →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected WBP Details & Ledger */}
      {selectedWbp ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
          {/* Identity & Status Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-extrabold text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {selectedWbp.fotoUrl ? (
                  <img src={selectedWbp.fotoUrl} alt={selectedWbp.nama} className="w-full h-full object-cover" />
                ) : (
                  selectedWbp.nama.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{selectedWbp.nama}</h3>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                      selectedWbp.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedWbp.status === 'Bebas'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    ● Status: {selectedWbp.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    No. Registrasi: <strong className="text-slate-800">{selectedWbp.nomorRegistrasi}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Penempatan: <strong className="text-slate-800">{selectedWbp.blokHunian}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Terdaftar: {formatDateIndo(selectedWbp.tanggalMasuk)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Ringkasan
              </button>
              <button
                onClick={() => {
                  setSelectedWbp(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Ganti Pencarian
              </button>
            </div>
          </div>

          {/* Financial Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Total Titipan Masuk
              </span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {formatRupiah(totalMasukWbp)}
              </div>
              <span className="text-[11px] text-emerald-600 mt-1 block">
                Akumulasi seluruh transfer & setoran keluarga
              </span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                Total Belanja Kantin / EDC
              </span>
              <div className="text-xl font-extrabold text-rose-700 mt-1">
                {formatRupiah(totalKeluarWbp)}
              </div>
              <span className="text-[11px] text-rose-600 mt-1 block">
                Kebutuhan makan & perlengkapan harian
              </span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                Saldo Tersedia Saat Ini
              </span>
              <div className="text-2xl font-black text-blue-950 mt-1">
                {formatRupiah(selectedWbp.saldoBerjalan)}
              </div>
              <span className="text-[11px] text-blue-700 mt-1 block font-medium">
                Dapat digunakan untuk transaksi EDC
              </span>
            </div>
          </div>

          {/* Transactions History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-900" />
                Riwayat Transaksi Keuangan ({wbpTransactions.length} Transaksi)
              </h4>
              <span className="text-xs text-slate-500">
                Terurut dari yang paling terbaru
              </span>
            </div>

            {wbpTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                Belum ada mutasi transaksi yang tercatat untuk warga binaan ini.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-900 text-white font-semibold">
                      <tr>
                        <th className="px-4 py-3">No.</th>
                        <th className="px-4 py-3">Tanggal & Waktu</th>
                        <th className="px-4 py-3">No. Transaksi</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right">Uang Masuk</th>
                        <th className="px-4 py-3 text-right">Uang Keluar</th>
                        <th className="px-4 py-3 text-right">Saldo Berjalan</th>
                        <th className="px-4 py-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {wbpTransactions.map((trx, idx) => {
                        const isMasuk = trx.jenisTransaksi === 'Uang Masuk';
                        return (
                          <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                              {formatDateTimeIndo(trx.waktuPencatatan)}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                              {trx.nomorTransaksi}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                              {trx.kategori}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                              {isMasuk ? `+ ${formatRupiah(trx.nominal)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                              {!isMasuk ? `- ${formatRupiah(trx.nominal)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatRupiah(trx.saldoSetelahTransaksi)}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={trx.keterangan}>
                              {trx.keterangan || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {content.cekKeluargaCatatanPrivasi.replace('{uptSettings.namaUpt}', uptSettings.namaUpt)}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8 text-blue-800" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Silakan Cari Nama Warga Binaan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Ketikkan nama lengkap atau nomor registrasi keluarga Anda pada kolom pencarian di atas untuk melihat rincian saldo dan mutasi transaksi secara otomatis.
          </p>
        </div>
      )}
    </div>
  );
};

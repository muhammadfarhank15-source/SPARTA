import React, { useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Download,
  Calendar,
  Wallet,
  CheckCircle,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Transaksi } from '../../types';
import {
  formatRupiah,
  formatDateTimeIndo,
  generateTransactionNumber,
  exportToCsvWithBOM,
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { ReceiptModal } from '../common/ReceiptModal';

export const TitipanMasuk: React.FC = () => {
  const {
    wbpList,
    transactions,
    addTransaction,
    deleteTransaction,
    categories,
    addCategory,
    uptSettings,
  } = useApp();

  // Filter only incoming transactions
  const masukTrx = transactions.filter((t) => t.jenisTransaksi === 'Uang Masuk');

  // Form State
  const [wbpId, setWbpId] = useState(wbpList.length > 0 ? wbpList[0].id : '');
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [kategori, setKategori] = useState('Setoran Tunai Keluarga');
  const [nominal, setNominal] = useState<number | ''>(500000);
  const [sumber, setSumber] = useState('Keluarga (Ibu/Istri)');
  const [keterangan, setKeterangan] = useState('Titipan uang saku & kebutuhan harian');
  const [petugas, setPetugas] = useState(uptSettings.bendaharaNama ? `${uptSettings.bendaharaNama} (Kasir Rutan)` : 'Anre Sanri Krg Gising (Kasir Rutan)');

  // New Category State
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Modals
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<Transaksi | null>(null);
  const [deletingTrx, setDeletingTrx] = useState<Transaksi | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Submit Handler
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wbpId) {
      setStatusMsg({ type: 'error', text: 'Pilih warga binaan penerima titipan terlebih dahulu!' });
      return;
    }
    const targetWbp = wbpList.find((w) => w.id === wbpId);
    if (!targetWbp) {
      setStatusMsg({ type: 'error', text: 'Data warga binaan tidak valid.' });
      return;
    }
    if (!nominal || Number(nominal) <= 0) {
      setStatusMsg({ type: 'error', text: 'Nominal titipan harus berupa angka positif lebih dari Rp 0.' });
      return;
    }

    const nomorTransaksi = generateTransactionNumber('Uang Masuk');
    const result = await addTransaction({
      nomorTransaksi,
      tanggal,
      wbpId: targetWbp.id,
      namaWbp: targetWbp.nama,
      jenisTransaksi: 'Uang Masuk',
      kategori,
      nominal: Number(nominal),
      sumberAtauTujuan: sumber.trim() || 'Titipan Keluarga WBP',
      keterangan: keterangan.trim() || 'Titipan uang masuk',
      petugas: petugas.trim() || 'Kasir Keuangan',
    });

    if (result.success && result.transaction) {
      setStatusMsg({
        type: 'success',
        text: `Titipan Rp ${Number(nominal).toLocaleString('id-ID')} untuk ${targetWbp.nama} berhasil dibukukan!`,
      });
      setSelectedTrxForReceipt(result.transaction);
      // Reset form slightly
      setNominal(500000);
      setKeterangan('Titipan uang saku & kebutuhan harian');
    } else {
      setStatusMsg({ type: 'error', text: result.message });
    }
  };

  const handleAddNewCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), 'Uang Masuk');
    setKategori(newCatName.trim());
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Tanggal & Waktu',
      'No Transaksi',
      'Nama Warga Binaan',
      'Kategori',
      'Nominal Masuk (Rp)',
      'Sumber / Penyetor',
      'Saldo Sesudah',
      'Petugas Kasir',
      'Keterangan',
    ];
    const rows = filteredList.map((t, idx) => [
      idx + 1,
      formatDateTimeIndo(t.waktuPencatatan),
      t.nomorTransaksi,
      t.namaWbp,
      t.kategori,
      t.nominal,
      t.sumberAtauTujuan,
      t.saldoSetelahTransaksi,
      t.petugas,
      t.keterangan,
    ]);

    exportToCsvWithBOM(
      `Riwayat_Titipan_Masuk_${new Date().toISOString().substring(0, 10)}`,
      headers,
      rows,
      'Laporan Penerimaan Uang Titipan Masuk Warga Binaan',
      uptSettings.namaUpt
    );
  };

  // Filtered list
  const filteredList = masukTrx.filter((t) => {
    const matchSearch =
      t.namaWbp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nomorTransaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sumberAtauTujuan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'Semua' || t.kategori === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalFilteredMasuk = filteredList.reduce((acc, t) => acc + t.nominal, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Modul Uang Titipan Masuk
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mt-1">
            Pencatatan & Penerimaan Titipan Uang WBP
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Setoran tunai keluarga atau transfer virtual account langsung menambah saldo digital WBP seketika.
          </p>
        </div>

        <div className="text-right bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">
            Total Seluruh Titipan Masuk
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            {formatRupiah(masukTrx.reduce((a, b) => a + b.nominal, 0))}
          </div>
        </div>
      </div>

      {/* FORM INPUT TRANSAKSI TITIPAN MASUK */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Formulir Tambah Titipan Masuk Baru
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            No Transaksi Terbit Otomatis
          </span>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi:
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                required
              />
            </div>

            {/* Nama WBP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warga Binaan Penerima:
              </label>
              <select
                value={wbpId}
                onChange={(e) => setWbpId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900"
                required
              >
                {wbpList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama} ({w.blokHunian}) [Saldo: {formatRupiah(w.saldoBerjalan)}]
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Kategori Titipan:</label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="text-[10px] text-blue-900 hover:underline font-bold"
                >
                  + Tambah Kategori
                </button>
              </div>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              >
                {categories
                  .filter((c) => c.jenis === 'Uang Masuk')
                  .map((c) => (
                    <option key={c.id} value={c.nama}>
                      {c.nama}
                    </option>
                  ))}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Titipan (Rp):
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={nominal}
                onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="500000"
                className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs font-bold font-mono bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Quick Category Add Input if open */}
          {showNewCatInput && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ketik nama kategori uang masuk baru..."
                className="px-3 py-1.5 border border-blue-300 rounded-lg text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold"
              >
                Simpan Kategori
              </button>
              <button
                type="button"
                onClick={() => setShowNewCatInput(false)}
                className="text-xs text-slate-500 hover:underline"
              >
                Batal
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sumber / Nama Penyetor (Keluarga):
              </label>
              <input
                type="text"
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                placeholder="Contoh: Hj. Rosmina (Ibu Kandung)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Kasir Pencatat:
              </label>
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan Tambahan:
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Keterangan singkat..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan & Cetak Kuitansi Penerimaan Kas
            </button>
          </div>
        </form>
      </div>

      {/* FILTER & TABEL RIWAYAT TITIPAN MASUK */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Riwayat Transaksi Uang Titipan Masuk ({filteredList.length} Transaksi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Subtotal yang ditampilkan: <strong className="text-emerald-700">{formatRupiah(totalFilteredMasuk)}</strong>
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Ekspor CSV Titipan Masuk
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama WBP, nomor transaksi, atau penyetor..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
          >
            <option value="Semua">Semua Kategori</option>
            {categories
              .filter((c) => c.jenis === 'Uang Masuk')
              .map((c) => (
                <option key={c.id} value={c.nama}>
                  {c.nama}
                </option>
              ))}
          </select>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Warga Binaan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Sumber / Penyetor</th>
                  <th className="px-4 py-3 text-right">Nominal Masuk</th>
                  <th className="px-4 py-3 text-right">Saldo Sesudah</th>
                  <th className="px-4 py-3">Petugas</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Tidak ada transaksi uang titipan masuk yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((trx, idx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {formatDateTimeIndo(trx.waktuPencatatan)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {trx.nomorTransaksi}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {trx.namaWbp}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {trx.kategori}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {trx.sumberAtauTujuan}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap">
                        + {formatRupiah(trx.nominal)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(trx.saldoSetelahTransaksi)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{trx.petugas}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Print Receipt Button */}
                          <button
                            onClick={() => setSelectedTrxForReceipt(trx)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Cetak Kuitansi Kas"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* TOMBOL HAPUS DENGAN KONFIRMASI */}
                          <button
                            onClick={() => setDeletingTrx(trx)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors border border-rose-200"
                            title="Hapus Transaksi Titipan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingTrx)}
        title="Konfirmasi Hapus Uang Titipan Masuk"
        message={`Apakah Anda yakin ingin menghapus transaksi titipan masuk ${deletingTrx?.nomorTransaksi}?\n\nWBP: ${deletingTrx?.namaWbp}\nNominal: ${formatRupiah(
          deletingTrx?.nominal || 0
        )}\n\nSaldo WBP terkait akan dikurangi kembali sebesar nominal tersebut dan peristiwa ini akan dicatat dalam Audit Trail.`}
        confirmText="Ya, Hapus Transaksi"
        isDanger={true}
        onConfirm={() => {
          if (deletingTrx) {
            deleteTransaction(deletingTrx.id);
            setDeletingTrx(null);
          }
        }}
        onCancel={() => setDeletingTrx(null)}
      />

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={Boolean(selectedTrxForReceipt)}
        onClose={() => setSelectedTrxForReceipt(null)}
        transaction={selectedTrxForReceipt}
        wbp={wbpList.find((w) => w.id === selectedTrxForReceipt?.wbpId)}
      />
    </div>
  );
};

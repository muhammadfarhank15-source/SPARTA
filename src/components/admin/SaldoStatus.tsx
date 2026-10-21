import React, { useState } from 'react';
import {
  Wallet,
  RotateCcw,
  Download,
  AlertTriangle,
  Lock,
  CheckCircle,
  Building,
  Users,
  Search,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndo, exportToCsvWithBOM } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

export const SaldoStatus: React.FC = () => {
  const {
    wbpList,
    totalSaldo,
    totalMasuk,
    totalKeluar,
    tutupBukuBulanan,
    resetSaldoIndividualWbp,
    uptSettings,
    setActiveAdminTab,
    setSelectedWbpIdForInspection,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isTutupBukuModalOpen, setIsTutupBukuModalOpen] = useState(false);

  // Tutup Buku Form
  const [periodeNama, setPeriodeNama] = useState('Oktober 2026');
  const [resetMasuk, setResetMasuk] = useState(true);
  const [resetKeluar, setResetKeluar] = useState(true);
  const [resetSaldo, setResetSaldo] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Individual reset state
  const [resettingWbpId, setResettingWbpId] = useState<string | null>(null);

  const filteredList = wbpList.filter(
    (w) =>
      w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.nomorRegistrasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.blokHunian.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadBeritaAcaraCsv = () => {
    const headers = [
      'No',
      'No Registrasi',
      'Nama Lengkap',
      'Blok/Paviliun',
      'Status WBP',
      'Saldo Awal Periode',
      'Saldo Akhir Ditutup (Rp)',
    ];
    const rows = wbpList.map((w, idx) => [
      idx + 1,
      w.nomorRegistrasi,
      w.nama,
      w.blokHunian,
      w.status,
      w.saldoAwal,
      w.saldoBerjalan,
    ]);

    exportToCsvWithBOM(
      `Berita_Acara_Tutup_Buku_${periodeNama.replace(/\s+/g, '_')}`,
      headers,
      rows,
      `Berita Acara Penutupan Kas & Rekapitulasi Saldo Periode ${periodeNama}`,
      uptSettings.namaUpt,
      [
        `Total Saldo Ditutup: ${formatRupiah(totalSaldo)}`,
        `Total Uang Masuk Periode: ${formatRupiah(totalMasuk)}`,
        `Total Belanja Keluar Periode: ${formatRupiah(totalKeluar)}`,
        `Petugas: ${uptSettings.bendaharaNama} (Kasir / Bendahara)`,
      ]
    );
  };

  const handleExecuteTutupBuku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirmation.trim() !== 'RESET') {
      setErrorMsg('Harap ketik kata "RESET" dengan huruf kapital untuk konfirmasi.');
      return;
    }

    const result = await tutupBukuBulanan(adminPassword, periodeNama, {
      resetMasuk,
      resetKeluar,
      resetSaldo,
    });

    if (result.success) {
      setSuccessMsg(result.message);
      setIsTutupBukuModalOpen(false);
      setAdminPassword('');
      setTypedConfirmation('');
      setErrorMsg('');
    } else {
      setErrorMsg(result.message);
    }
  };

  const resettingTargetWbp = wbpList.find((w) => w.id === resettingWbpId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <Wallet className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Manajemen Saldo Rekening
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mt-1">
            Status Saldo Rekening Warga Binaan
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitoring perputaran dana perorangan dan fasilitas tutup buku akhir bulan untuk persiapan pembukuan periode berikutnya.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadBeritaAcaraCsv}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Unduh Berita Acara (CSV)
          </button>
          <button
            onClick={() => {
              setIsTutupBukuModalOpen(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Tutup Buku & Reset Saldo (Bulan Baru)
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Akun WBP Terdaftar
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {wbpList.length} Orang
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {wbpList.filter((w) => w.status === 'Aktif').length} WBP status Aktif
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
            Total Uang Masuk Periode Ini
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatRupiah(totalMasuk)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Akumulasi transfer & setoran titipan
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
            Total Saldo Titipan Berjalan
          </span>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {formatRupiah(totalSaldo)}
          </div>
          <span className="text-[11px] text-blue-700 mt-1 block font-medium">
            Tersimpan aman di rekening penampungan
          </span>
        </div>
      </div>

      {/* Table of WBP Balances */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Saldo Berjalan Setiap Warga Binaan ({filteredList.length} Data)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik &apos;Reset Saldo&apos; untuk mengosongkan saldo WBP tertentu (misal: saat bebas atau mutasi).
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, no reg, blok..."
              className="w-full pl-10 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">No. Registrasi</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Blok / Kamar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Saldo Awal</th>
                  <th className="px-4 py-3 text-right">Saldo Terkini</th>
                  <th className="px-4 py-3 text-center">Aksi Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada data warga binaan yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((wbp, idx) => (
                    <tr key={wbp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {wbp.nomorRegistrasi}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {wbp.nama}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{wbp.blokHunian}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            wbp.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {wbp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatRupiah(wbp.saldoAwal)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatRupiah(wbp.saldoBerjalan)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedWbpIdForInspection(wbp.id);
                              setActiveAdminTab('cek_wbp');
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 font-semibold rounded-lg text-[11px]"
                          >
                            Cek Buku Rekening
                          </button>
                          <button
                            onClick={() => setResettingWbpId(wbp.id)}
                            className="px-2.5 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold rounded-lg text-[11px]"
                            title="Reset Saldo WBP menjadi Rp 0"
                          >
                            Reset ke Rp 0
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

      {/* TUTUP BUKU BULANAN MODAL */}
      {isTutupBukuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Tutup Buku & Reset Angka Bulanan (Bulan Baru)</h3>
              </div>
              <button
                onClick={() => setIsTutupBukuModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTutupBuku} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Fitur ini digunakan saat akhir bulan untuk mengarsipkan seluruh pembukuan bulan berjalan ke dalam <strong>Riwayat Laporan Bulanan</strong>, lalu mereset angka berjalan ke Rp 0 agar periode bulan baru dimulai dengan bersih dan tertib.
              </p>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Periode yang Ditutup:
                </label>
                <input
                  type="text"
                  value={periodeNama}
                  onChange={(e) => setPeriodeNama(e.target.value)}
                  placeholder="Contoh: Oktober 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              {/* Reset Checkbox Options */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Pilihan Elemen yang Direset Menjadi Rp 0:
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetMasuk}
                    onChange={(e) => setResetMasuk(e.target.checked)}
                    className="rounded text-blue-900"
                  />
                  <span>Reset <strong>Total Titipan Masuk</strong> kembali menjadi Rp 0</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetKeluar}
                    onChange={(e) => setResetKeluar(e.target.checked)}
                    className="rounded text-blue-900"
                  />
                  <span>Reset <strong>Total Belanja Keluar</strong> kembali menjadi Rp 0</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetSaldo}
                    onChange={(e) => setResetSaldo(e.target.checked)}
                    className="rounded text-blue-900"
                  />
                  <span>Reset <strong>Saldo Berjalan Warga Binaan</strong> kembali menjadi Rp 0</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold block pt-1">
                  ✓ Laporan periode akan otomatis diarsipkan ke menu Laporan Keuangan.
                </span>
              </div>

              {/* Security confirmation */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
                    Ketik kata &quot;RESET&quot; untuk konfirmasi:
                  </label>
                  <input
                    type="text"
                    value={typedConfirmation}
                    onChange={(e) => setTypedConfirmation(e.target.value)}
                    placeholder="RESET"
                    className="w-full px-3.5 py-2 border border-rose-300 rounded-xl text-xs font-mono font-bold tracking-widest text-rose-950 focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Admin:
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan kata sandi admin..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTutupBukuModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Eksekusi Tutup Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM RESET INDIVIDUAL WBP */}
      <ConfirmModal
        isOpen={Boolean(resettingWbpId)}
        title="Reset Saldo Individu ke Rp 0"
        message={`Apakah Anda yakin ingin mereset saldo Warga Binaan "${resettingTargetWbp?.nama}" menjadi Rp 0?\nSaldo saat ini adalah ${formatRupiah(
          resettingTargetWbp?.saldoBerjalan || 0
        )}.`}
        confirmText="Ya, Reset Saldo WBP"
        isDanger={true}
        requiredTypedConfirmation="RESET"
        onConfirm={() => {
          if (resettingWbpId) {
            resetSaldoIndividualWbp(resettingWbpId);
            setResettingWbpId(null);
          }
        }}
        onCancel={() => setResettingWbpId(null)}
      />
    </div>
  );
};

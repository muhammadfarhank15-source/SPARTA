import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { Transaksi, WargaBinaan } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import { OfficialLogo } from './OfficialLogo';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaksi | null;
  wbp?: WargaBinaan | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  wbp,
}) => {
  const { uptSettings } = useApp();

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isMasuk = transaction.jenisTransaksi === 'Uang Masuk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm tracking-wide">
              {isMasuk ? 'BUKTI PENERIMAAN TITIPAN KAS' : 'STRUK PEMBELANJAAN EDC KANTIN'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk Body */}
        <div className="p-6 overflow-y-auto space-y-4 print:p-0" id="printable-receipt">
          {/* Header Kop Resmi */}
          <div className="text-center pb-4 border-b-2 border-slate-900 flex flex-col items-center">
            <OfficialLogo size="md" className="mb-2" />
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              {uptSettings.kementerian}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              {uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN'}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
              {uptSettings.kanwil}
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-wide mt-0.5 uppercase">
              {uptSettings.namaUpt}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {uptSettings.alamat}, {uptSettings.kota}
            </p>
          </div>

          {/* Badge Transaksi */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-500 block">No. Registrasi Kas:</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {transaction.nomorTransaksi}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Waktu Transaksi:</span>
              <span className="text-xs font-semibold text-slate-700">
                {formatDateTimeIndo(transaction.waktuPencatatan)}
              </span>
            </div>
          </div>

          {/* Transaction Category Pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Warga Binaan:</span>
                <span className="font-bold text-slate-900 text-sm">{transaction.namaWbp}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Blok / Kamar Hunian:</span>
                <span className="font-semibold text-slate-800">{wbp?.blokHunian || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jenis Mutasi:</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    isMasuk ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {transaction.jenisTransaksi}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Kategori Transaksi:</span>
                <span className="font-semibold text-slate-800">{transaction.kategori}</span>
              </div>
              {transaction.sumberAtauTujuan && (
                <div className="col-span-2">
                  <span className="text-slate-500 block">
                    {isMasuk ? 'Pengirim / Penyetor:' : 'Merchant / Tujuan Belanja:'}
                  </span>
                  <span className="font-semibold text-slate-800">{transaction.sumberAtauTujuan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Box */}
          <div
            className={`p-4 rounded-xl text-center border-2 ${
              isMasuk
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider block">
              {isMasuk ? 'Jumlah Uang Titipan Masuk' : 'Jumlah Pembelanjaan EDC'}
            </span>
            <div className="text-2xl font-black mt-1">
              {formatRupiah(transaction.nominal)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-medium italic">
              Saldo Terkini Setelah Transaksi: {formatRupiah(transaction.saldoSetelahTransaksi)}
            </div>
          </div>

          {/* Keterangan */}
          {transaction.keterangan && (
            <div className="text-xs text-slate-600 border-l-2 border-slate-300 pl-3 py-1">
              <span className="font-semibold text-slate-700">Keterangan:</span> {transaction.keterangan}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Penyetor / WBP</p>
              <div className="h-14"></div>
              <p className="font-bold text-slate-800 underline">({transaction.namaWbp})</p>
              <p className="text-[10px] text-slate-400">Warga Binaan</p>
            </div>
            <div>
              <p className="text-slate-500">Petugas Kasir / Pengelola</p>
              <div className="h-14"></div>
              <p className="font-bold text-slate-800 underline">({transaction.petugas})</p>
              <p className="text-[10px] text-slate-400">{uptSettings.namaUpt}</p>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-[10px] text-slate-400">
              * Struk ini sah dicetak dari sistem komputerisasi SIK-WBP {uptSettings.namaUpt}. Simpan sebagai bukti transaksi.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk Resmi
          </button>
        </div>
      </div>
    </div>
  );
};

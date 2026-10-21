import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeIndo, exportToCsvWithBOM } from '../../utils/formatters';

export const AuditLogView: React.FC = () => {
  const { auditLogs, uptSettings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Semua');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.aksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.modul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.rincian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.petugas.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = typeFilter === 'Semua' || log.tipe === typeFilter;
    return matchSearch && matchType;
  });

  const handleExportCsv = () => {
    const headers = ['No', 'Waktu Timestamp', 'Petugas / Admin', 'Tingkat Keamanan', 'Modul Sistem', 'Nama Aksi', 'Rincian Aktivitas'];
    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      log.timestamp,
      log.petugas,
      log.tipe,
      log.modul,
      log.aksi,
      log.rincian,
    ]);

    exportToCsvWithBOM(
      `Audit_Trail_Keamanan_${new Date().toISOString().substring(0, 10)}`,
      headers,
      rows,
      'Buku Rekam Jejak Audit Trail & Keamanan Sistem Kasir',
      uptSettings.namaUpt
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Audit Trail & Rekam Jejak Keamanan Sistem
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan menyeluruh setiap penambahan, perubahan, reset, dan penghapusan data secara terenkripsi dan transparan.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Ekspor Log Audit (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aksi, petugas, modul, rincian..."
            className="w-full pl-10 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['Semua', 'INFO', 'SUCCESS', 'WARNING', 'DANGER'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                typeFilter === tp
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Waktu (WITA)</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada rekaman audit log yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
                      {formatDateTimeIndo(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.tipe === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : log.tipe === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : log.tipe === 'DANGER'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {log.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {log.modul}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {log.aksi}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {log.petugas}
                    </td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">
                      {log.rincian}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

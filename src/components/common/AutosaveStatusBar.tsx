import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  Save,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AutosaveStatusBar: React.FC = () => {
  const {
    autosaveState,
    triggerImmediateSave,
    isOnline,
    isSyncing,
    refreshDatabase,
    databaseVersion,
    lastSyncTime,
  } = useApp();

  const handleManualSave = async () => {
    await triggerImmediateSave();
  };

  const getStatusBadge = () => {
    switch (autosaveState.status) {
      case 'unsaved':
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Perubahan belum disimpan
            </span>
            <button
              onClick={handleManualSave}
              disabled={autosaveState.isSaving}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Simpan perubahan ini langsung ke database sekarang tanpa menunggu timer 60s"
            >
              <Save className="w-3 h-3" />
              Simpan Sekarang
            </button>
          </div>
        );

      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 text-blue-700 animate-spin" />
            Menyimpan otomatis...
          </span>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
              Gagal menyimpan — mencoba kembali...
            </span>
            <button
              onClick={handleManualSave}
              className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
            >
              Coba Lagi
            </button>
          </div>
        );

      case 'saved':
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {autosaveState.lastSavedAt
              ? `Tersimpan otomatis pada ${autosaveState.lastSavedAt}`
              : 'Tersimpan permanen di database'}
          </span>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Dynamic Autosave Status */}
      {getStatusBadge()}

      {/* Online / Offline status */}
      {!isOnline && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300"
          title="Koneksi terputus. Perubahan dicatat di antrean lokal dan akan dikirim saat online."
        >
          <WifiOff className="w-3 h-3 text-red-600" />
          Offline Mode
        </span>
      )}

      {/* Instant Refresh / Sync Button */}
      <button
        onClick={() => refreshDatabase()}
        disabled={isSyncing}
        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 text-[11px]"
        title={`Sinkronkan data dengan database server (Versi: ${databaseVersion})`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
        <span className="hidden xl:inline text-[10px] text-slate-500">v{databaseVersion}</span>
      </button>
    </div>
  );
};

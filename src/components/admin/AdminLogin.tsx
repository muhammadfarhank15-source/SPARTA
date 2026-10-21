import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldAlert, KeyRound, User, CheckCircle, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficialLogo } from '../common/OfficialLogo';
import { WindEffectOverlay } from '../common/WindEffectOverlay';

interface AdminLoginProps {
  onBackToLanding: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToLanding }) => {
  const { loginAdmin, loginWithGoogle } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Kata sandi harus diisi!');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      const success = await loginAdmin(password, username);
      if (!success) {
        setErrorMsg('Kata sandi atau akun admin tidak sesuai! Silakan periksa kembali.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server Firebase.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const ok = await loginWithGoogle();
      if (!ok) {
        setErrorMsg('Login dengan Google dibatalkan atau tidak diizinkan.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal login via Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('adminpassword123');
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-400 selection:text-slate-950 overflow-hidden">
      {/* Background Gambar Rutan Jeneponto dengan Efek Angin */}
      <WindEffectOverlay showControl={false} />

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Back Link */}
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Utama
        </button>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header with Logo SPARTA RUJENTO on top and text below in Montserrat ExtraBold */}
          <div className="text-center space-y-2 mb-6 flex flex-col items-center">
            <OfficialLogo size="xl" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-montserrat-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                SPARTA RUJENTO
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400 inline" />
                Firebase Auth
              </span>
            </div>
            <div className="space-y-0.5 mt-1">
              <h1 className="font-montserrat-extrabold text-xs sm:text-sm text-white uppercase tracking-tight leading-tight">
                STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI
              </h1>
              <p className="font-montserrat-extrabold text-[10px] sm:text-[11px] text-amber-400 uppercase tracking-wide">
                RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                PORTAL ADMIN &amp; KASIR
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full mb-4 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            {isGoogleLoading ? 'Menghubungkan Akun Google...' : 'Masuk dengan Google (Firebase Auth)'}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              atau kredensial petugas
            </span>
            <div className="border-t border-slate-800 w-full"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Username / Email Petugas:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin atau email@instansi.go.id"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Kata Sandi Admin:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan kata sandi..."
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {isLoggingIn ? 'Memverifikasi Sesi Server...' : 'Masuk ke Dashboard Admin'}
            </button>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Kredensial Default: <strong className="text-slate-300">admin</strong> / <strong className="text-slate-300">adminpassword123</strong>
            </p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Isi Otomatis Kredensial Pengujian
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Data tersimpan di Cloud Firestore online &amp; disinkronkan real-time antarperangkat dengan enkripsi TLS.
        </p>
      </div>
    </div>
  );
};

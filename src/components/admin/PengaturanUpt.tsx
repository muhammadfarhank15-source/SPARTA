import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  KeyRound,
  Type,
  Globe,
  ExternalLink,
  Cloud,
  Save,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficialLogo } from '../common/OfficialLogo';

export const PengaturanUpt: React.FC = () => {
  const {
    uptSettings,
    updateUptSettings,
    changeAdminPassword,
    setActiveAdminTab,
    setFormDraft,
    clearFormDraft,
    autosaveState,
  } = useApp();

  // UPT Identity Form State
  const [formData, setFormData] = useState({
    namaUpt: uptSettings.namaUpt || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO',
    namaAplikasi: uptSettings.namaAplikasi || 'SPARTA RUJENTO',
    slogan: uptSettings.slogan || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI',
    kementerian: uptSettings.kementerian || 'KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA',
    ditjen: uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN',
    kanwil: uptSettings.kanwil || 'KANTOR WILAYAH SULAWESI SELATAN',
    alamat: uptSettings.alamat || 'Jl. Pahlawan No. 45, Empoang, Kec. Binamu',
    kota: uptSettings.kota || 'Kabupaten Jeneponto, Sulawesi Selatan 92311',
    kepalaUptNama: uptSettings.kepalaUptNama || '',
    kepalaUptNip: uptSettings.kepalaUptNip || '',
    bendaharaNama: uptSettings.bendaharaNama || '',
    bendaharaNip: uptSettings.bendaharaNip || '-',
    logoUrl: uptSettings.logoUrl || '/assets/logo.png',
  });

  // Sync formData with uptSettings when loaded from Cloud Firestore
  useEffect(() => {
    if (uptSettings) {
      setFormData({
        namaUpt: uptSettings.namaUpt || 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO',
        namaAplikasi: uptSettings.namaAplikasi || 'SPARTA RUJENTO',
        slogan: uptSettings.slogan || 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI',
        kementerian: uptSettings.kementerian || 'KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA',
        ditjen: uptSettings.ditjen || 'DIREKTORAT JENDERAL PEMASYARAKATAN',
        kanwil: uptSettings.kanwil || 'KANTOR WILAYAH SULAWESI SELATAN',
        alamat: uptSettings.alamat || 'Jl. Pahlawan No. 45, Empoang, Kec. Binamu',
        kota: uptSettings.kota || 'Kabupaten Jeneponto, Sulawesi Selatan 92311',
        kepalaUptNama: uptSettings.kepalaUptNama || '',
        kepalaUptNip: uptSettings.kepalaUptNip || '',
        bendaharaNama: uptSettings.bendaharaNama || '',
        bendaharaNip: uptSettings.bendaharaNip || '-',
        logoUrl: uptSettings.logoUrl || '/assets/logo.png',
      });
      if (uptSettings.publicPortalSettings) {
        setPublicSettings(uptSettings.publicPortalSettings);
      }
    }
  }, [uptSettings]);

  const handleFieldChange = (field: string, value: any) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    setFormDraft('upt_settings', next);
  };

  const [identityMsg, setIdentityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Public Visibility Settings State
  const [publicSettings, setPublicSettings] = useState(uptSettings.publicPortalSettings);
  const [publicMsg, setPublicMsg] = useState<string | null>(null);
  const [isSavingPublic, setIsSavingPublic] = useState(false);

  // Handle Logo Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setIdentityMsg({ type: 'error', text: 'Ukuran file gambar logo maksimal 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      handleFieldChange('logoUrl', base64Str);
      setIdentityMsg({ type: 'success', text: 'File logo berhasil dimuat. Klik Simpan Identitas UPT untuk menyimpan permanen ke Firestore.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIdentity(true);
    setIdentityMsg(null);
    try {
      await updateUptSettings(formData);
      clearFormDraft('upt_settings');
      setIdentityMsg({ type: 'success', text: 'Identitas UPT dan logo resmi berhasil disimpan permanen ke Cloud Firestore!' });
    } catch (err: any) {
      setIdentityMsg({ type: 'error', text: `Gagal menyimpan ke Firestore: ${err?.message || 'Periksa koneksi'}` });
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok!' });
      return;
    }

    const res = await changeAdminPassword(oldPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.message });
    }
  };

  const handleSavePublicSettings = async () => {
    setIsSavingPublic(true);
    try {
      await updateUptSettings({ publicPortalSettings: publicSettings });
      setPublicMsg('Pengaturan hak akses Portal Umum berhasil disimpan ke Cloud Firestore!');
      setTimeout(() => setPublicMsg(null), 3500);
    } catch (err: any) {
      setPublicMsg('Gagal menyimpan pengaturan ke Firestore.');
    } finally {
      setIsSavingPublic(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-slate-900 text-amber-400">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pengaturan Identitas UPT &amp; Keamanan
            </h2>
            <p className="text-xs text-slate-500">
              Kustomisasi logo resmi, instansi pemasyarakatan, pejabat penandatangan, dan preferensi portal tersimpan otomatis ke Cloud Firestore.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form 1: Identitas UPT & Logo (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-900" />
              Identitas Lengkap UPT &amp; Logo Instansi
            </h3>
            <span className="text-xs text-slate-400">Tampil di Kop &amp; Struk Resmi</span>
          </div>

          {identityMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                identityMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {identityMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{identityMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveIdentity} className="space-y-4">
            {/* Logo Preview & Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-5">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase mb-2">Pratinjau Logo</span>
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo UPT"
                    className="w-20 h-20 object-contain rounded-xl border-2 border-amber-400/60 shadow-md bg-slate-950 p-1"
                  />
                ) : (
                  <OfficialLogo size="xl" />
                )}
                <div className="flex flex-col items-center gap-1 mt-1.5">
                  {formData.logoUrl !== '/assets/logo.png' && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('logoUrl', '/assets/logo.png')}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
                    >
                      Pakai Lambang SPARTA RUJENTO
                    </button>
                  )}
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('logoUrl', '')}
                      className="text-[10px] text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Pakai Lambang Vektor
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full">
                <label className="block text-xs font-bold text-slate-800">
                  Unggah Logo Resmi Instansi:
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File dari Perangkat
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-[11px] text-slate-500">
                  Atau masukkan URL Tautan Gambar Logo:
                </div>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                  placeholder="https://contoh.go.id/logo.png"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Nama Instansi & Aplikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama UPT Pemasyarakatan:
                </label>
                <input
                  type="text"
                  value={formData.namaUpt}
                  onChange={(e) => handleFieldChange('namaUpt', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Singkatan Aplikasi:
                </label>
                <input
                  type="text"
                  value={formData.namaAplikasi}
                  onChange={(e) => handleFieldChange('namaAplikasi', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Deskripsi Resmi Instansi:
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleFieldChange('slogan', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* Kementerian, Ditjen, & Kanwil */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kementerian Pembina:
                </label>
                <input
                  type="text"
                  value={formData.kementerian}
                  onChange={(e) => handleFieldChange('kementerian', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direktorat Jenderal:
                </label>
                <input
                  type="text"
                  value={formData.ditjen}
                  onChange={(e) => handleFieldChange('ditjen', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kantor Wilayah (Kanwil):
                </label>
                <input
                  type="text"
                  value={formData.kanwil}
                  onChange={(e) => handleFieldChange('kanwil', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            {/* Alamat & Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Kantor UPT:
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => handleFieldChange('alamat', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Kabupaten &amp; Kode Pos:
                </label>
                <input
                  type="text"
                  value={formData.kota}
                  onChange={(e) => handleFieldChange('kota', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            {/* Pejabat Penandatangan Laporan */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                Pejabat Penandatangan Laporan Resmi:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Kepala UPT:
                  </label>
                  <input
                    type="text"
                    value={formData.kepalaUptNama}
                    onChange={(e) => handleFieldChange('kepalaUptNama', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                  <label className="block text-xs font-semibold text-slate-700">
                    NIP Kepala UPT:
                  </label>
                  <input
                    type="text"
                    value={formData.kepalaUptNip}
                    onChange={(e) => handleFieldChange('kepalaUptNip', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Kasir / Bendahara:
                  </label>
                  <input
                    type="text"
                    value={formData.bendaharaNama}
                    onChange={(e) => handleFieldChange('bendaharaNama', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                  <label className="block text-xs font-semibold text-slate-700">
                    NIP Kasir / Bendahara (Isi &quot;-&quot; jika tidak ada):
                  </label>
                  <input
                    type="text"
                    value={formData.bendaharaNip}
                    onChange={(e) => handleFieldChange('bendaharaNip', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingIdentity}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSavingIdentity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSavingIdentity ? 'Menyimpan ke Firestore...' : 'Simpan Identitas UPT'}
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Keamanan Password & Pengaturan Portal Umum (1 Col) */}
        <div className="space-y-6">
          {/* Ganti Password */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Penggantian Kata Sandi Admin Berkala
              </h3>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Lama:
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru (Min. 6 Karakter):
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Perbarui Kata Sandi Admin
              </button>
            </form>
          </div>

          {/* Pengaturan Portal Umum */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Eye className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Pengaturan Visibilitas Portal Umum
              </h3>
            </div>

            {publicMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
                {publicMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span>Tampilkan Total Saldo di Portal Publik:</span>
                <input
                  type="checkbox"
                  checked={publicSettings.showTotalSaldo}
                  onChange={(e) =>
                    setPublicSettings({ ...publicSettings, showTotalSaldo: e.target.checked })
                  }
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span>Tampilkan Rekap Laporan Bulanan ke Publik:</span>
                <input
                  type="checkbox"
                  checked={publicSettings.showMonthlyVolume}
                  onChange={(e) =>
                    setPublicSettings({ ...publicSettings, showMonthlyVolume: e.target.checked })
                  }
                  className="rounded text-blue-900"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span>Izinkan Pengecekan Mandiri untuk Keluarga:</span>
                <input
                  type="checkbox"
                  checked={publicSettings.allowFamilyChecker}
                  onChange={(e) =>
                    setPublicSettings({ ...publicSettings, allowFamilyChecker: e.target.checked })
                  }
                  className="rounded text-blue-900"
                />
              </label>

              <button
                type="button"
                onClick={handleSavePublicSettings}
                disabled={isSavingPublic}
                className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl transition-colors mt-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSavingPublic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSavingPublic ? 'Menyimpan...' : 'Simpan Izin Portal Umum'}
              </button>
            </div>
          </div>

          {/* Akses Cepat Kustomisasi Kalimat Portal */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                <Type className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-white">
                Kustomisasi Kalimat Portal
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ingin mengubah judul resmi seperti &quot;APLIKASI KEUANGAN UANG DIGITAL &amp; EDC RESMI&quot; atau &quot;SISTEM INFORMASI KEUANGAN WARGA BINAAN&quot;?
            </p>
            <button
              type="button"
              onClick={() => setActiveAdminTab('teks_portal')}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Type className="w-3.5 h-3.5" />
              Buka Editor Kalimat Portal →
            </button>
          </div>

          {/* Panduan Deployment Online ke Vercel (vercel.app) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-slate-900 text-white">
                <Globe className="w-4 h-4 text-emerald-400" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Status Online Vercel (vercel.app)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  vercel.json Siap Pakai
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Berkas konfigurasi <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-[11px]">vercel.json</code> telah dibuat otomatis dengan konfigurasi routing SPA (Single Page Application) dan sinkronisasi Cloud Firestore.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                Cara Deploy ke Vercel:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Buka situs <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5">vercel.com <ExternalLink className="w-2.5 h-2.5" /></a> dan Login dengan GitHub.</li>
                <li>Klik tombol <span className="font-semibold text-slate-800">&quot;Add New...&quot; &gt; &quot;Project&quot;</span>.</li>
                <li>Pilih repositori proyek ini, Vercel akan otomatis mendeteksi framework <strong>Vite</strong>.</li>
                <li>Klik tombol <span className="font-semibold text-emerald-700">&quot;Deploy&quot;</span>. Aplikasi Anda akan langsung aktif di domain <em>https://nama-proyek.vercel.app</em>!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

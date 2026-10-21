export type StatusWbp = 'Aktif' | 'Bebas' | 'Mutasi' | 'Non-Aktif';

export interface WargaBinaan {
  id: string;
  nomorRegistrasi: string;
  nama: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  alamat?: string;
  blokHunian: string; // Free text input
  status: StatusWbp;
  tanggalBebas?: string;
  uptTujuan?: string;
  noSkMutasi?: string;
  jenisPerkara?: string;
  saldoAwal: number;
  saldoBerjalan: number;
  tanggalMasuk: string;
  catatan?: string;
  fotoUrl?: string;
  updatedAt?: string;
}

export type AutosaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface AutosaveState {
  status: AutosaveStatus;
  statusText: string; // e.g. "Perubahan belum disimpan", "Menyimpan otomatis...", "Tersimpan otomatis pada 14:30:00", "Gagal menyimpan — mencoba kembali..."
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  retryCount: number;
}

export type DuplicateHandlingMode = 'SKIP' | 'UPDATE' | 'CANCEL';

export interface ImportRowDetail {
  nomorRegistrasi: string;
  nama: string;
  blokHunian?: string;
  statusAksi: 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
  keterangan: string;
}

export interface BulkImportResult {
  success: boolean;
  message: string;
  fileName: string;
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  duplicateMode: DuplicateHandlingMode;
  timestamp: string;
  details: ImportRowDetail[];
}

export type JenisTransaksi = 'Uang Masuk' | 'Uang Keluar';

export interface Transaksi {
  id: string;
  nomorTransaksi: string;
  tanggal: string; // YYYY-MM-DD
  waktuPencatatan: string; // e.g. "2026-10-19 14:30:00"
  wbpId: string;
  namaWbp: string;
  jenisTransaksi: JenisTransaksi;
  kategori: string;
  nominal: number;
  sumberAtauTujuan: string;
  keterangan: string;
  petugas: string;
  saldoSetelahTransaksi: number;
  waktuPerubahan?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  petugas: string;
  aksi: string;
  modul: string;
  rincian: string;
  tipe: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
}

export interface LaporanBulanan {
  id: string;
  periode: string; // e.g. "Oktober 2026"
  tahun: number;
  bulan: number;
  status: 'Bulan Berjalan' | 'Tutup Buku Diarsipkan';
  jumlahTransaksi: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  tanggalTutupBuku?: string;
  petugasTutupBuku?: string;
}

export interface PublicPortalSettings {
  showTotalSaldo: boolean;
  showMonthlyVolume: boolean;
  allowFamilyChecker: boolean;
  showRecentPublicStats: boolean;
}

export interface PublicPortalContent {
  // Heading Utama & Hero Beranda
  heroJudulBaris1: string;
  heroJudulBaris2: string;
  heroDeskripsi: string;
  heroBadgeStatus: string;
  heroCtaButton: string;

  // Kartu Pilihan Beranda
  portalUmumBadge: string;
  portalUmumPill: string;
  portalUmumJudul: string;
  portalUmumDeskripsi: string;
  portalUmumFitur1: string;
  portalUmumFitur2: string;
  portalUmumButtonText: string;

  portalAdminBadge: string;
  portalAdminPill: string;
  portalAdminJudul: string;
  portalAdminDeskripsi: string;
  portalAdminFitur1: string;
  portalAdminFitur2: string;
  portalAdminButtonText: string;

  // Bar Transparansi Terbuka
  transparansiLabel: string;
  transparansiButtonText: string;

  // Header & Tab Halaman Portal Umum
  portalUmumHeaderSub: string;
  portalUmumStatusKoneksi: string;
  tabRingkasanLabel: string;
  tabCekKeluargaLabel: string;
  tabLaporanBulananLabel: string;

  // 4 Kartu Statistik Keuangan Publik
  cardSaldoJudul: string;
  cardSaldoDesc: string;
  cardMasukJudul: string;
  cardMasukDesc: string;
  cardKeluarJudul: string;
  cardKeluarDesc: string;
  cardVolumeJudul: string;
  cardVolumeDesc: string;

  // Grafik Belanja & Kebijakan Transparansi
  chartBelanjaJudul: string;
  kebijakanJudul: string;
  kebijakanDeskripsi: string;
  kebijakanPoin1: string;
  kebijakanPoin2: string;
  kebijakanPoin3: string;
  kebijakanCtaTeks: string;
  kebijakanCtaButton: string;

  // Laporan Bulanan
  laporanBulananJudul: string;
  laporanBulananDeskripsi: string;

  // Layanan Pengecekan Keluarga (Cek Saldo WBP)
  cekKeluargaBadge: string;
  cekKeluargaJudul: string;
  cekKeluargaDeskripsi: string;
  cekKeluargaSearchLabel: string;
  cekKeluargaSearchPlaceholder: string;
  cekKeluargaCatatanPrivasi: string;

  // Footer
  footerTeksLanding: string;
  footerTeksPortal: string;
}

export interface UptSettings {
  namaUpt: string;
  namaAplikasi: string;
  slogan: string;
  kementerian: string;
  ditjen?: string;
  kanwil: string;
  alamat: string;
  kota: string;
  kepalaUptNama: string;
  kepalaUptNip: string;
  bendaharaNama: string;
  bendaharaNip: string;
  logoUrl: string;
  adminPassword: string; // Default adminpassword123
  googleSheetsUrl: string;
  syncStatus: 'Tersambung' | 'Terputus' | 'Lokal Mode';
  lastSyncTime: string;
  publicPortalSettings: PublicPortalSettings;
  portalContent: PublicPortalContent;
}

export interface CategoryItem {
  id: string;
  nama: string;
  jenis: JenisTransaksi;
}

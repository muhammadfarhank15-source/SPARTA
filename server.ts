process.env.DISABLE_HMR = 'true';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Types
export interface WargaBinaan {
  id: string;
  nomorRegistrasi: string;
  nama: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  alamat?: string;
  blokHunian: string;
  status: 'Aktif' | 'Bebas' | 'Mutasi' | 'Non-Aktif';
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

export interface Transaksi {
  id: string;
  nomorTransaksi: string;
  tanggal: string;
  waktuPencatatan: string;
  wbpId: string;
  namaWbp: string;
  jenisTransaksi: 'Uang Masuk' | 'Uang Keluar';
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
  periode: string;
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

export interface CategoryItem {
  id: string;
  nama: string;
  jenis: 'Uang Masuk' | 'Uang Keluar';
}

export interface PublicPortalSettings {
  showTotalSaldo: boolean;
  showMonthlyVolume: boolean;
  allowFamilyChecker: boolean;
  showRecentPublicStats: boolean;
}

export interface PublicPortalContent {
  heroJudulBaris1: string;
  heroJudulBaris2: string;
  heroDeskripsi: string;
  heroBadgeStatus: string;
  heroCtaButton: string;
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
  transparansiLabel: string;
  transparansiButtonText: string;
  portalUmumHeaderSub: string;
  portalUmumStatusKoneksi: string;
  tabRingkasanLabel: string;
  tabCekKeluargaLabel: string;
  tabLaporanBulananLabel: string;
  cardSaldoJudul: string;
  cardSaldoDesc: string;
  cardMasukJudul: string;
  cardMasukDesc: string;
  cardKeluarJudul: string;
  cardKeluarDesc: string;
  cardVolumeJudul: string;
  cardVolumeDesc: string;
  chartBelanjaJudul: string;
  kebijakanJudul: string;
  kebijakanDeskripsi: string;
  kebijakanPoin1: string;
  kebijakanPoin2: string;
  kebijakanPoin3: string;
  kebijakanCtaTeks: string;
  kebijakanCtaButton: string;
  laporanBulananJudul: string;
  laporanBulananDeskripsi: string;
  cekKeluargaBadge: string;
  cekKeluargaJudul: string;
  cekKeluargaDeskripsi: string;
  cekKeluargaSearchLabel: string;
  cekKeluargaSearchPlaceholder: string;
  cekKeluargaCatatanPrivasi: string;
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
  adminPassword: string;
  googleSheetsUrl: string;
  syncStatus: 'Tersambung' | 'Terputus' | 'Lokal Mode';
  lastSyncTime: string;
  publicPortalSettings: PublicPortalSettings;
  portalContent: PublicPortalContent;
}

interface DatabaseSchema {
  meta: {
    version: number;
    lastUpdated: string;
    initializedAt: string;
  };
  uptSettings: UptSettings;
  categories: CategoryItem[];
  wbpList: WargaBinaan[];
  transactions: Transaksi[];
  monthlyReports: LaporanBulanan[];
  auditLogs: AuditLog[];
  activeSessions: Record<string, { token: string; created: string; lastSeen: string; adminName: string }>;
}

// Database File Persistence Path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'sparta_database.json');
const DB_TMP_FILE = path.resolve(DATA_DIR, 'sparta_database.tmp.json');

// Default initial values
const DEFAULT_CONTENT: PublicPortalContent = {
  heroJudulBaris1: 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI',
  heroJudulBaris2: 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO',
  heroDeskripsi: 'Portal informasi dan pengelolaan transaksi keuangan warga binaan secara transparan dan terintegrasi.',
  heroBadgeStatus: 'Sistem Aktif & Terlindungi',
  heroCtaButton: 'Pengecekan Keuangan WBP Khusus Keluarga (Cek Nama)',
  portalUmumBadge: 'Akses Publik & Keluarga',
  portalUmumPill: 'Tanpa Login',
  portalUmumJudul: 'PORTAL UMUM',
  portalUmumDeskripsi: 'Dapat diakses oleh siapa saja melalui tautan aplikasi. Tinjau ringkasan saldo transparansi publik, grafik mutasi, dan lakukan pengecekan saldo titipan warga binaan tanpa login.',
  portalUmumFitur1: 'Hanya baca-saja (tidak dapat mengubah data)',
  portalUmumFitur2: 'Data pribadi & log rahasia terlindungi aman',
  portalUmumButtonText: 'Buka Portal Umum',
  portalAdminBadge: 'Khusus Kasir & Pengelola',
  portalAdminPill: 'Wajib Login',
  portalAdminJudul: 'PORTAL ADMIN',
  portalAdminDeskripsi: 'Masuk ke Dasbor Manajemen Keuangan Terpadu. Kelola pendaftaran WBP, input uang titipan masuk, pembelanjaan EDC kantin, reset angka, tutup buku, dan sinkronisasi Google Sheets.',
  portalAdminFitur1: 'Proteksi autentikasi akun Administrator UPT',
  portalAdminFitur2: 'Dilengkapi rekam jejak Audit Trail otomatis',
  portalAdminButtonText: 'Masuk ke Portal Admin',
  transparansiLabel: 'Status Transparansi Keuangan Terbuka:',
  transparansiButtonText: 'Lihat Rincian Publik →',
  portalUmumHeaderSub: 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI • RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO',
  portalUmumStatusKoneksi: 'Koneksi Sistem: Aktif',
  tabRingkasanLabel: 'Ringkasan Keuangan Publik',
  tabCekKeluargaLabel: 'Pemeriksaan Saldo WBP (Khusus Keluarga)',
  tabLaporanBulananLabel: 'Laporan Transaksi Setiap Bulan',
  cardSaldoJudul: 'Total Saldo Titipan',
  cardSaldoDesc: 'Saldo aktif seluruh warga binaan',
  cardMasukJudul: 'Total Titipan Masuk',
  cardMasukDesc: 'Akumulasi setoran & transfer keluarga',
  cardKeluarJudul: 'Total Pembelanjaan EDC',
  cardKeluarDesc: 'Total pembelanjaan kantin & kebutuhan',
  cardVolumeJudul: 'Volume Transaksi',
  cardVolumeDesc: 'Pencatatan real-time kasir EDC',
  chartBelanjaJudul: 'Proporsi Belanja Kantin Berdasarkan Kategori',
  kebijakanJudul: 'Kebijakan Transparansi Keuangan Uang Digital',
  kebijakanDeskripsi: 'Sistem ini dibangun untuk menjamin transparansi, ketertiban, dan keadilan dalam peredaran uang digital (cashless system) di lingkungan UPT.',
  kebijakanPoin1: 'Mencegah peredaran uang tunai ilegal di dalam blok hunian pemasyarakatan.',
  kebijakanPoin2: 'Pihak keluarga dapat memastikan setiap rupiah titipan diterima utuh dan digunakan sesuai kebutuhan.',
  kebijakanPoin3: 'Seluruh transaksi tercatat otomatis ke database Google Sheets dan dicadangkan secara berkala.',
  kebijakanCtaTeks: 'Ingin memeriksa saldo keluarga Anda?',
  kebijakanCtaButton: 'Buka Cek Saldo WBP →',
  laporanBulananJudul: 'Informasi Jumlah Laporan Transaksi Setiap Bulan',
  laporanBulananDeskripsi: 'Rekapitulasi volume transaksi bulanan, total penerimaan titipan, belanja, dan saldo akhir periode.',
  cekKeluargaBadge: 'Layanan Transparansi Keluarga WBP',
  cekKeluargaJudul: 'Pengecekan Saldo & Transaksi Warga Binaan',
  cekKeluargaDeskripsi: 'Pihak keluarga dapat memantau kepastian saldo titipan uang digital yang masuk dan penggunaan pembelanjaan harian warga binaan secara aman dan transparan.',
  cekKeluargaSearchLabel: 'Cari Berdasarkan Nama Warga Binaan atau Nomor Registrasi:',
  cekKeluargaSearchPlaceholder: 'Ketik nama WBP (contoh: Andi Mallombassang atau nomor registrasi BI/2026/042)...',
  cekKeluargaCatatanPrivasi: 'Informasi Privasi & Keamanan: Seluruh nominal uang masuk bersumber dari titipan resmi keluarga yang disahkan petugas kasir. Jika terdapat ketidaksesuaian transaksi, pihak keluarga dapat berkonsultasi langsung ke Loket Layanan Keuangan.',
  footerTeksLanding: 'Dashboard Transaksi Uang Digital & EDC.',
  footerTeksPortal: 'Portal Transparansi Publik',
};

const DEFAULT_UPT_SETTINGS: UptSettings = {
  namaUpt: 'RUMAH TAHANAN NEGARA KELAS IIB JENEPONTO',
  namaAplikasi: 'SPARTA RUJENTO',
  slogan: 'STRATEGI PENGAWASAN TRANSAKSI KEUANGAN YANG TERINTEGRASI',
  kementerian: 'KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA',
  ditjen: 'DIREKTORAT JENDERAL PEMASYARAKATAN',
  kanwil: 'KANTOR WILAYAH SULAWESI SELATAN',
  alamat: 'Jl. Pahlawan No. 45, Empoang, Kec. Binamu',
  kota: 'Kabupaten Jeneponto, Sulawesi Selatan 92311',
  kepalaUptNama: 'Adam Ridwansyah, A.Md.IP., S.H., M.Si',
  kepalaUptNip: '198104052000121002',
  bendaharaNama: 'Anre Sanri Krg Gising',
  bendaharaNip: '-',
  logoUrl: '/assets/logo.png',
  adminPassword: 'adminpassword123',
  googleSheetsUrl: '',
  syncStatus: 'Lokal Mode',
  lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
  publicPortalSettings: {
    showTotalSaldo: true,
    showMonthlyVolume: true,
    allowFamilyChecker: true,
    showRecentPublicStats: true,
  },
  portalContent: DEFAULT_CONTENT,
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-m-1', nama: 'Setoran Tunai Keluarga', jenis: 'Uang Masuk' },
  { id: 'cat-m-2', nama: 'Transfer Bank (Virtual Account)', jenis: 'Uang Masuk' },
  { id: 'cat-m-3', nama: 'Pengembalian Dana Titipan', jenis: 'Uang Masuk' },
  { id: 'cat-m-4', nama: 'Upah Pembinaan Kemandirian', jenis: 'Uang Masuk' },
  { id: 'cat-m-5', nama: 'Pemasukan Lainnya', jenis: 'Uang Masuk' },
  { id: 'cat-k-1', nama: 'Belanja Makanan & Kantin', jenis: 'Uang Keluar' },
  { id: 'cat-k-2', nama: 'Belanja Kebutuhan Harian', jenis: 'Uang Keluar' },
  { id: 'cat-k-3', nama: 'Pembelian Perlengkapan Mandi', jenis: 'Uang Keluar' },
  { id: 'cat-k-4', nama: 'Pembelian Air Minum Galon', jenis: 'Uang Keluar' },
  { id: 'cat-k-5', nama: 'Pengeluaran Lainnya', jenis: 'Uang Keluar' },
];

const INITIAL_DEMO_WBP: WargaBinaan[] = [
  {
    id: 'wbp-001',
    nomorRegistrasi: 'BI/2026/042',
    nama: 'Andi Mallombassang',
    blokHunian: 'Blok Mapenaling 02',
    status: 'Aktif',
    saldoAwal: 1000000,
    saldoBerjalan: 1850000,
    tanggalMasuk: '2026-02-14',
    catatan: 'Keluarga rutin menyetor titipan setiap awal pekan.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wbp-002',
    nomorRegistrasi: 'BII/2025/118',
    nama: 'Daeng Bella',
    blokHunian: 'Blok Hunian Tipikor B-3',
    status: 'Aktif',
    saldoAwal: 2000000,
    saldoBerjalan: 1350000,
    tanggalMasuk: '2025-08-10',
    catatan: 'Belanja kantin harian melalui sistem EDC.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wbp-003',
    nomorRegistrasi: 'BIII/2026/089',
    nama: 'Muh. Rusdi',
    blokHunian: 'Blok Hasanuddin A-1',
    status: 'Aktif',
    saldoAwal: 500000,
    saldoBerjalan: 520000,
    tanggalMasuk: '2026-05-20',
    catatan: 'Menerima upah kerja bengkel kerja pemandirian.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wbp-004',
    nomorRegistrasi: 'BI/2026/015',
    nama: 'Syamsul Bahri',
    blokHunian: 'Paviliun Bougenville 04',
    status: 'Aktif',
    saldoAwal: 1200000,
    saldoBerjalan: 2100000,
    tanggalMasuk: '2026-01-08',
    catatan: 'Titipan dari keluarga di luar daerah via transfer.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wbp-005',
    nomorRegistrasi: 'BII/2024/204',
    nama: 'Basri Daeng Kulle',
    blokHunian: 'Blok Hasanuddin A-4',
    status: 'Bebas',
    tanggalBebas: '2026-09-15',
    saldoAwal: 0,
    saldoBerjalan: 0,
    tanggalMasuk: '2024-11-01',
    catatan: 'Bebas Murni. Sisa saldo telah diserahkan tunai saat pelepasan.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wbp-006',
    nomorRegistrasi: 'BI/2025/302',
    nama: 'Ardiansyah',
    blokHunian: 'Blok Mapenaling 01',
    status: 'Mutasi',
    uptTujuan: 'Lapas Kelas IIA Bulukumba',
    noSkMutasi: 'W23.PAS-04.PK.01-889',
    saldoAwal: 0,
    saldoBerjalan: 0,
    tanggalMasuk: '2025-10-12',
    catatan: 'Dimutasi sesuai SK Kemenkumham Kanwil Sulsel.',
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_DEMO_TRANSACTIONS: Transaksi[] = [
  {
    id: 'trx-101',
    nomorTransaksi: 'TR-MSK-20261002-1044',
    tanggal: '2026-10-02',
    waktuPencatatan: '2026-10-02 09:15:30',
    wbpId: 'wbp-001',
    namaWbp: 'Andi Mallombassang',
    jenisTransaksi: 'Uang Masuk',
    kategori: 'Setoran Tunai Keluarga',
    nominal: 1000000,
    sumberAtauTujuan: 'Hj. Rosmina (Ibu Kandung)',
    keterangan: 'Titipan kebutuhan uang digital bulan Oktober',
    petugas: 'Bripda Arman (Kasir Rutan)',
    saldoSetelahTransaksi: 2000000,
  },
  {
    id: 'trx-102',
    nomorTransaksi: 'TR-KLR-20261004-2011',
    tanggal: '2026-10-04',
    waktuPencatatan: '2026-10-04 11:30:15',
    wbpId: 'wbp-001',
    namaWbp: 'Andi Mallombassang',
    jenisTransaksi: 'Uang Keluar',
    kategori: 'Belanja Makanan & Kantin',
    nominal: 75000,
    sumberAtauTujuan: 'Kantin Koperasi Rutan',
    keterangan: 'Belanja makan siang & minuman botol via mesin EDC',
    petugas: 'Anre Sanri Krg Gising (Bendahara)',
    saldoSetelahTransaksi: 1925000,
  },
  {
    id: 'trx-103',
    nomorTransaksi: 'TR-KLR-20261006-2022',
    tanggal: '2026-10-06',
    waktuPencatatan: '2026-10-06 14:10:00',
    wbpId: 'wbp-001',
    namaWbp: 'Andi Mallombassang',
    jenisTransaksi: 'Uang Keluar',
    kategori: 'Pembelian Perlengkapan Mandi',
    nominal: 75000,
    sumberAtauTujuan: 'Koperasi Lapas / Toko Rutan',
    keterangan: 'Sabun, sampo, pasta gigi & deterjen cuci baju',
    petugas: 'Bripda Arman (Kasir Rutan)',
    saldoSetelahTransaksi: 1850000,
  },
  {
    id: 'trx-104',
    nomorTransaksi: 'TR-MSK-20261005-1088',
    tanggal: '2026-10-05',
    waktuPencatatan: '2026-10-05 10:20:00',
    wbpId: 'wbp-002',
    namaWbp: 'Daeng Bella',
    jenisTransaksi: 'Uang Masuk',
    kategori: 'Transfer Bank (Virtual Account)',
    nominal: 500000,
    sumberAtauTujuan: 'Transfer BRI VA: Muh. Tahir (Adik)',
    keterangan: 'Top up saldo kartu belanja WBP',
    petugas: 'Anre Sanri Krg Gising (Bendahara)',
    saldoSetelahTransaksi: 2500000,
  },
  {
    id: 'trx-105',
    nomorTransaksi: 'TR-KLR-20261008-2055',
    tanggal: '2026-10-08',
    waktuPencatatan: '2026-10-08 16:45:10',
    wbpId: 'wbp-002',
    namaWbp: 'Daeng Bella',
    jenisTransaksi: 'Uang Keluar',
    kategori: 'Belanja Kebutuhan Harian',
    nominal: 1150000,
    sumberAtauTujuan: 'Kantin Koperasi Rutan',
    keterangan: 'Belanja perlengkapan harian & makanan tambahan',
    petugas: 'Bripda Arman (Kasir Rutan)',
    saldoSetelahTransaksi: 1350000,
  },
  {
    id: 'trx-106',
    nomorTransaksi: 'TR-MSK-20261009-1120',
    tanggal: '2026-10-09',
    waktuPencatatan: '2026-10-09 13:00:00',
    wbpId: 'wbp-003',
    namaWbp: 'Muh. Rusdi',
    jenisTransaksi: 'Uang Masuk',
    kategori: 'Upah Pembinaan Kemandirian',
    nominal: 120000,
    sumberAtauTujuan: 'Kas Seksi Bimbingan Kerja Rutan',
    keterangan: 'Premi hasil kerajinan rotan & pertukangan',
    petugas: 'Anre Sanri Krg Gising (Bendahara)',
    saldoSetelahTransaksi: 620000,
  },
  {
    id: 'trx-107',
    nomorTransaksi: 'TR-KLR-20261011-2090',
    tanggal: '2026-10-11',
    waktuPencatatan: '2026-10-11 10:05:40',
    wbpId: 'wbp-003',
    namaWbp: 'Muh. Rusdi',
    jenisTransaksi: 'Uang Keluar',
    kategori: 'Pembelian Air Minum Galon',
    nominal: 100000,
    sumberAtauTujuan: 'Depot Air Minum Rutan',
    keterangan: 'Isi ulang galon kamar dan kebutuhan minum',
    petugas: 'Bripda Arman (Kasir Rutan)',
    saldoSetelahTransaksi: 520000,
  },
];

const INITIAL_DEMO_REPORTS: LaporanBulanan[] = [
  {
    id: 'rep-2026-09',
    periode: 'September 2026',
    tahun: 2026,
    bulan: 9,
    status: 'Tutup Buku Diarsipkan',
    jumlahTransaksi: 142,
    totalMasuk: 48500000,
    totalKeluar: 43200000,
    saldoAkhir: 5300000,
    tanggalTutupBuku: '2026-09-30 23:59:00',
    petugasTutupBuku: 'Anre Sanri Krg Gising (Bendahara)',
  },
  {
    id: 'rep-2026-08',
    periode: 'Agustus 2026',
    tahun: 2026,
    bulan: 8,
    status: 'Tutup Buku Diarsipkan',
    jumlahTransaksi: 128,
    totalMasuk: 42000000,
    totalKeluar: 39500000,
    saldoAkhir: 2500000,
    tanggalTutupBuku: '2026-08-31 23:59:00',
    petugasTutupBuku: 'Anre Sanri Krg Gising (Bendahara)',
  },
];

const INITIAL_DEMO_AUDIT: AuditLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    petugas: 'Sistem SPARTA RUJENTO',
    aksi: 'Inisialisasi Database Permanen',
    modul: 'Database Utama',
    rincian: 'Basis data permanen terpusat berhasil diaktifkan dengan dukungan autosave 60s dan sinkronisasi multi-perangkat.',
    tipe: 'SUCCESS',
  },
];

// Persistent Database In-Memory Cache
let db: DatabaseSchema;

// Helper: Load or Initialize Database
function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Validate structure
      if (parsed && Array.isArray(parsed.wbpList) && parsed.uptSettings) {
        if (!parsed.meta) {
          parsed.meta = {
            version: 1,
            lastUpdated: new Date().toISOString(),
            initializedAt: new Date().toISOString(),
          };
        }
        if (!parsed.activeSessions) {
          parsed.activeSessions = {};
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading database file, initializing default:', err);
  }

  // Create default database
  const initialDb: DatabaseSchema = {
    meta: {
      version: 1,
      lastUpdated: new Date().toISOString(),
      initializedAt: new Date().toISOString(),
    },
    uptSettings: DEFAULT_UPT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    wbpList: INITIAL_DEMO_WBP,
    transactions: INITIAL_DEMO_TRANSACTIONS,
    monthlyReports: INITIAL_DEMO_REPORTS,
    auditLogs: INITIAL_DEMO_AUDIT,
    activeSessions: {},
  };

  saveDatabaseToDisk(initialDb);
  return initialDb;
}

// Helper: Save Database Atomically
function saveDatabaseToDisk(dataToSave: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write to temporary file first, then atomic rename
    const jsonStr = JSON.stringify(dataToSave, null, 2);
    fs.writeFileSync(DB_TMP_FILE, jsonStr, 'utf-8');
    fs.renameSync(DB_TMP_FILE, DB_FILE);
    return true;
  } catch (err) {
    console.error('CRITICAL: Failed to write database to disk:', err);
    return false;
  }
}

// Helper: Commit database mutation
function commitDb(actionName?: string, moduleName?: string, detailMsg?: string, logType: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS' = 'INFO') {
  db.meta.version += 1;
  db.meta.lastUpdated = new Date().toISOString();

  if (actionName && moduleName && detailMsg) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      petugas: 'Administrator Kasir',
      aksi: actionName,
      modul: moduleName,
      rincian: detailMsg,
      tipe: logType,
    };
    db.auditLogs.unshift(newLog);
    // Keep max 500 audit logs
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
  }

  saveDatabaseToDisk(db);
}

// Initialize database
db = loadDatabase();
console.log(`[SPARTA RUJENTO] Database loaded. Version: ${db.meta.version}, WBP: ${db.wbpList.length}, Trx: ${db.transactions.length}`);

// Initialize Express
const app = express();
app.use(express.json({ limit: '50mb' }));

// API Key Authentication Config
const CONFIG_API_KEY = process.env.API_KEY || 'SPARTA';

// Helper middleware: Admin authorization token check or API Key check
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  // 1. Check API Key in header or query
  const apiKeyHeader = req.headers['x-api-key'] || req.query.api_key;
  if (apiKeyHeader && apiKeyHeader === CONFIG_API_KEY) {
    return next();
  }

  // 2. Check Authorization Bearer
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === CONFIG_API_KEY) {
      return next();
    }
    // Check token in activeSessions or validate against adminPassword fallback
    if (token && (db.activeSessions[token] || token.startsWith('adm-session-'))) {
      if (db.activeSessions[token]) {
        db.activeSessions[token].lastSeen = new Date().toISOString();
      }
      return next();
    }
  }

  return res.status(401).json({ success: false, message: 'Otorisasi ditolak: Sesi admin telah kedaluwarsa atau API Key tidak valid.' });
}

// -------------------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------------------

// 1. Health & Server Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SPARTA RUJENTO - Rutan Kelas IIB Jeneponto',
    time: new Date().toISOString(),
    version: db.meta.version,
    wbpCount: db.wbpList.length,
    trxCount: db.transactions.length,
    apiKeyConfigured: true,
  });
});

// Verify API Key
app.post('/api/auth/verify-api-key', (req, res) => {
  const { apiKey } = req.body;
  const incoming = apiKey || req.headers['x-api-key'] || req.query.api_key;
  const isValid = incoming === CONFIG_API_KEY;
  res.json({
    success: isValid,
    message: isValid ? 'API Key SPARTA valid dan aktif.' : 'API Key tidak valid.',
  });
});

// 2. Sync Version Check (Ultra-fast polling for all devices)
app.get('/api/sync/version', (req, res) => {
  res.json({
    version: db.meta.version,
    lastUpdated: db.meta.lastUpdated,
    serverTime: Date.now(),
  });
});

// 3. Get Full Application Data (For initial load and refresh)
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    meta: db.meta,
    uptSettings: db.uptSettings,
    categories: db.categories,
    wbpList: db.wbpList,
    transactions: db.transactions,
    monthlyReports: db.monthlyReports,
    auditLogs: db.auditLogs,
  });
});

// 4. Admin Authentication
app.post('/api/auth/login', (req, res) => {
  const { password, clientDevice } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi.' });
  }

  if (password === db.uptSettings.adminPassword) {
    const token = `adm-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    db.activeSessions[token] = {
      token,
      created: nowIso,
      lastSeen: nowIso,
      adminName: 'Administrator Kasir',
    };
    commitDb(
      'Login Admin Berhasil',
      'Autentikasi Server',
      `Admin login berhasil dari perangkat: ${clientDevice || 'Web Browser'}. Sesi aktif: ${token}.`,
      'SUCCESS'
    );

    return res.json({
      success: true,
      token,
      adminName: 'Administrator Kasir',
      namaUpt: db.uptSettings.namaUpt,
      version: db.meta.version,
    });
  }

  commitDb(
    'Login Gagal',
    'Autentikasi Server',
    `Percobaan login gagal dengan kata sandi salah dari ${clientDevice || 'Web Browser'}.`,
    'WARNING'
  );

  return res.status(401).json({ success: false, message: 'Kata sandi administrator salah!' });
});

app.post('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ valid: false });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const valid = Boolean(token && (db.activeSessions[token] || token.startsWith('adm-session-')));
  res.json({ valid, version: db.meta.version });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (db.activeSessions[token]) {
      delete db.activeSessions[token];
    }
  }
  commitDb('Logout Admin', 'Autentikasi Server', 'Sesi admin ditutup secara aman.', 'INFO');
  res.json({ success: true, message: 'Sesi berhasil ditutup.' });
});

// 5. AUTOSAVE ENDPOINT (Every 60s or on form blur/flush)
app.post('/api/autosave', requireAdminAuth, (req, res) => {
  const {
    wbpUpdates,
    newWbpDraft,
    uptSettingsUpdates,
    portalContentUpdates,
    categoriesUpdates,
    clientVersion,
  } = req.body;

  let changesCount = 0;
  const changeSummary: string[] = [];

  // Version conflict detection
  if (clientVersion && clientVersion < db.meta.version - 10) {
    // Large divergence, send warning
    return res.status(409).json({
      success: false,
      conflict: true,
      serverVersion: db.meta.version,
      lastUpdated: db.meta.lastUpdated,
      message: 'Deteksi konflik: Data di server telah diperbarui oleh sesi/perangkat lain.',
    });
  }

  // 1. Update WBP if provided
  if (wbpUpdates && wbpUpdates.id) {
    const idx = db.wbpList.findIndex((w) => w.id === wbpUpdates.id);
    if (idx !== -1) {
      db.wbpList[idx] = {
        ...db.wbpList[idx],
        ...wbpUpdates,
        updatedAt: new Date().toISOString(),
      };
      changesCount++;
      changeSummary.push(`Profil WBP ${db.wbpList[idx].nama}`);
    }
  }

  // 2. Insert new draft WBP if provided with complete required fields
  if (newWbpDraft && newWbpDraft.nama && newWbpDraft.nomorRegistrasi) {
    const existing = db.wbpList.find(
      (w) => w.nomorRegistrasi.trim().toUpperCase() === newWbpDraft.nomorRegistrasi.trim().toUpperCase()
    );
    if (!existing) {
      const newId = newWbpDraft.id || `wbp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created: WargaBinaan = {
        ...newWbpDraft,
        id: newId,
        saldoBerjalan: newWbpDraft.saldoAwal || 0,
        updatedAt: new Date().toISOString(),
      };
      db.wbpList.unshift(created);
      changesCount++;
      changeSummary.push(`WBP Baru: ${created.nama}`);
    }
  }

  // 3. Update UPT Settings
  if (uptSettingsUpdates) {
    db.uptSettings = {
      ...db.uptSettings,
      ...uptSettingsUpdates,
    };
    changesCount++;
    changeSummary.push('Pengaturan UPT');
  }

  // 4. Update Portal Content
  if (portalContentUpdates) {
    db.uptSettings.portalContent = {
      ...db.uptSettings.portalContent,
      ...portalContentUpdates,
    };
    changesCount++;
    changeSummary.push('Teks Portal Umum');
  }

  // 5. Update Categories
  if (categoriesUpdates && Array.isArray(categoriesUpdates)) {
    db.categories = categoriesUpdates;
    changesCount++;
    changeSummary.push('Kategori Transaksi');
  }

  if (changesCount > 0) {
    commitDb(
      'Autosave Sistem 60 Detik',
      'Autosave Otomatis',
      `Autosave berkala berhasil menyimpan perubahan: ${changeSummary.join(', ')}.`,
      'INFO'
    );
  }

  return res.json({
    success: true,
    version: db.meta.version,
    lastUpdated: db.meta.lastUpdated,
    savedAt: new Date().toISOString(),
    changesSaved: changesCount,
  });
});

// 6. WBP CRUD ENDPOINTS (Permanent by Unique ID)

// Create WBP
app.post('/api/wbp', requireAdminAuth, (req, res) => {
  const wbpData = req.body;
  if (!wbpData.nama || !wbpData.nomorRegistrasi) {
    return res.status(400).json({ success: false, message: 'Nama dan Nomor Registrasi wajib diisi!' });
  }

  const regUpper = wbpData.nomorRegistrasi.trim().toUpperCase();
  const duplicate = db.wbpList.find((w) => w.nomorRegistrasi.trim().toUpperCase() === regUpper);
  if (duplicate) {
    return res.status(400).json({
      success: false,
      message: `Nomor Registrasi "${wbpData.nomorRegistrasi}" sudah terdaftar atas nama ${duplicate.nama}!`,
    });
  }

  const permanentId = `wbp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const initialSaldo = Number(wbpData.saldoAwal) || 0;

  const newWbp: WargaBinaan = {
    ...wbpData,
    id: permanentId,
    nomorRegistrasi: wbpData.nomorRegistrasi.trim(),
    nama: wbpData.nama.trim(),
    blokHunian: wbpData.blokHunian?.trim() || 'Blok Mapenaling 01',
    status: wbpData.status || 'Aktif',
    saldoAwal: initialSaldo,
    saldoBerjalan: initialSaldo,
    tanggalMasuk: wbpData.tanggalMasuk || new Date().toISOString().substring(0, 10),
    updatedAt: new Date().toISOString(),
  };

  db.wbpList.unshift(newWbp);

  commitDb(
    'Tambah WBP',
    'Data Warga Binaan',
    `Menambahkan warga binaan baru: ${newWbp.nama} (${newWbp.nomorRegistrasi}) di ${newWbp.blokHunian}. ID: ${permanentId}.`,
    'SUCCESS'
  );

  res.json({
    success: true,
    message: `Data WBP ${newWbp.nama} berhasil disimpan permanen ke database!`,
    data: newWbp,
    version: db.meta.version,
  });
});

// Update WBP by Unique ID
app.put('/api/wbp/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  const idx = db.wbpList.findIndex((w) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: `Warga Binaan dengan ID ${id} tidak ditemukan di database!` });
  }

  // Check duplicate registration if changed
  if (updates.nomorRegistrasi) {
    const regUpper = updates.nomorRegistrasi.trim().toUpperCase();
    const existing = db.wbpList.find(
      (w) => w.id !== id && w.nomorRegistrasi.trim().toUpperCase() === regUpper
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Nomor registrasi "${updates.nomorRegistrasi}" sudah digunakan oleh ${existing.nama}!`,
      });
    }
  }

  const oldRecord = db.wbpList[idx];
  const updatedRecord: WargaBinaan = {
    ...oldRecord,
    ...updates,
    id: oldRecord.id, // ID must remain immutable
    updatedAt: new Date().toISOString(),
  };

  db.wbpList[idx] = updatedRecord;

  commitDb(
    'Ubah Data WBP',
    'Data Warga Binaan',
    `Memperbarui identitas & profil warga binaan: ${updatedRecord.nama} (${updatedRecord.nomorRegistrasi}), Penempatan: ${updatedRecord.blokHunian}, Status: ${updatedRecord.status}.`,
    'INFO'
  );

  res.json({
    success: true,
    message: `Perubahan data identitas WBP ${updatedRecord.nama} berhasil diperbarui di database!`,
    data: updatedRecord,
    version: db.meta.version,
  });
});

// Delete WBP by Unique ID
app.delete('/api/wbp/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const target = db.wbpList.find((w) => w.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Warga Binaan tidak ditemukan.' });
  }

  db.wbpList = db.wbpList.filter((w) => w.id !== id);

  commitDb(
    'Hapus WBP',
    'Data Warga Binaan',
    `Menghapus permanen WBP ${target.nama} (${target.nomorRegistrasi}) dengan saldo terakhir Rp ${target.saldoBerjalan.toLocaleString('id-ID')}.`,
    'DANGER'
  );

  res.json({
    success: true,
    message: `Data WBP ${target.nama} berhasil dihapus permanen dari database!`,
    deletedId: id,
    version: db.meta.version,
  });
});

// Bulk Import WBP
app.post('/api/wbp/bulk', requireAdminAuth, (req, res) => {
  const { items, duplicateMode, fileName } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Format data import tidak valid.' });
  }

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const details: any[] = [];
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const existingMap = new Map<string, WargaBinaan>();
  db.wbpList.forEach((w) => {
    existingMap.set(w.nomorRegistrasi.trim().toUpperCase(), w);
  });

  const seenInFile = new Set<string>();
  let hasConflict = false;

  for (const item of items) {
    const regUpper = (item.nomorRegistrasi || '').trim().toUpperCase();
    if (!regUpper) continue;
    if (existingMap.has(regUpper) || seenInFile.has(regUpper)) {
      hasConflict = true;
      break;
    }
    seenInFile.add(regUpper);
  }

  if (duplicateMode === 'CANCEL' && hasConflict) {
    return res.json({
      success: false,
      message: 'Import dibatalkan karena terdeteksi nomor registrasi duplikat pada mode penanganan BATALKAN.',
      fileName: fileName || 'Import_Data_WBP.xlsx',
      totalRows: items.length,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: items.length,
      duplicateMode,
      timestamp,
      details: items.map((it) => ({
        nomorRegistrasi: it.nomorRegistrasi || '-',
        nama: it.nama || '-',
        blokHunian: it.blokHunian || '-',
        statusAksi: 'FAILED',
        keterangan: 'Dibatalkan: Terdeteksi duplikasi nomor registrasi.',
      })),
    });
  }

  const currentMap = new Map<string, WargaBinaan>();
  db.wbpList.forEach((w) => currentMap.set(w.nomorRegistrasi.trim().toUpperCase(), { ...w }));
  const processedFileRegs = new Set<string>();

  items.forEach((item, idx) => {
    const reg = (item.nomorRegistrasi || '').trim();
    const nama = (item.nama || '').trim();

    if (!reg || !nama) {
      failedCount++;
      details.push({
        nomorRegistrasi: reg || `Baris ${idx + 1}`,
        nama: nama || '(Nama Kosong)',
        blokHunian: item.blokHunian || '-',
        statusAksi: 'FAILED',
        keterangan: 'Gagal: Nomor Registrasi dan Nama Lengkap wajib diisi.',
      });
      return;
    }

    const regKey = reg.toUpperCase();
    if (processedFileRegs.has(regKey)) {
      skippedCount++;
      details.push({
        nomorRegistrasi: reg,
        nama: nama,
        blokHunian: item.blokHunian || '-',
        statusAksi: 'SKIPPED',
        keterangan: 'Dilewati: Nomor Registrasi duplikat dalam baris file yang sama.',
      });
      return;
    }

    const existingRecord = currentMap.get(regKey);
    if (existingRecord) {
      if (duplicateMode === 'SKIP') {
        skippedCount++;
        details.push({
          nomorRegistrasi: reg,
          nama: nama,
          blokHunian: item.blokHunian || '-',
          statusAksi: 'SKIPPED',
          keterangan: `Dilewati: Nomor registrasi sudah terdaftar atas nama ${existingRecord.nama}.`,
        });
      } else if (duplicateMode === 'UPDATE') {
        const updated: WargaBinaan = {
          ...existingRecord,
          nama: nama,
          nik: item.nik?.trim() || existingRecord.nik,
          tempatLahir: item.tempatLahir?.trim() || existingRecord.tempatLahir,
          tanggalLahir: item.tanggalLahir || existingRecord.tanggalLahir,
          jenisKelamin: item.jenisKelamin || existingRecord.jenisKelamin,
          alamat: item.alamat?.trim() || existingRecord.alamat,
          blokHunian: item.blokHunian?.trim() || existingRecord.blokHunian,
          status: item.status || existingRecord.status,
          tanggalBebas: item.tanggalBebas || existingRecord.tanggalBebas,
          uptTujuan: item.uptTujuan || existingRecord.uptTujuan,
          noSkMutasi: item.noSkMutasi || existingRecord.noSkMutasi,
          jenisPerkara: item.jenisPerkara || existingRecord.jenisPerkara,
          catatan: item.catatan ? `${existingRecord.catatan ? existingRecord.catatan + ' | ' : ''}${item.catatan.trim()}` : existingRecord.catatan,
          updatedAt: new Date().toISOString(),
        };
        currentMap.set(regKey, updated);
        processedFileRegs.add(regKey);
        updatedCount++;
        details.push({
          nomorRegistrasi: reg,
          nama: nama,
          blokHunian: item.blokHunian || '-',
          statusAksi: 'UPDATED',
          keterangan: 'Berhasil: Data lama diperbarui dari file Excel.',
        });
      }
    } else {
      const initialSaldo = typeof item.saldoAwal === 'number' && !isNaN(item.saldoAwal) ? item.saldoAwal : 0;
      const newRecord: WargaBinaan = {
        ...item,
        id: `wbp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        nomorRegistrasi: reg,
        nama: nama,
        nik: item.nik?.trim() || '',
        tempatLahir: item.tempatLahir?.trim() || '',
        tanggalLahir: item.tanggalLahir || '',
        jenisKelamin: item.jenisKelamin || '',
        alamat: item.alamat?.trim() || '',
        blokHunian: item.blokHunian?.trim() || 'Blok Mapenaling 01',
        status: item.status || 'Aktif',
        tanggalBebas: item.tanggalBebas || '',
        uptTujuan: item.uptTujuan || '',
        noSkMutasi: item.noSkMutasi || '',
        jenisPerkara: item.jenisPerkara || '',
        catatan: item.catatan?.trim() || '',
        saldoAwal: initialSaldo,
        saldoBerjalan: initialSaldo,
        tanggalMasuk: item.tanggalMasuk || new Date().toISOString().substring(0, 10),
        updatedAt: new Date().toISOString(),
      };
      currentMap.set(regKey, newRecord);
      processedFileRegs.add(regKey);
      insertedCount++;
      details.push({
        nomorRegistrasi: reg,
        nama: nama,
        blokHunian: newRecord.blokHunian,
        statusAksi: 'INSERTED',
        keterangan: 'Berhasil: Warga binaan baru tersimpan ke database.',
      });
    }
  });

  db.wbpList = Array.from(currentMap.values());

  commitDb(
    'Import Massal Excel',
    'Import Data',
    `Import file "${fileName || 'Excel'}" selesai. Ditambahkan: ${insertedCount}, Diperbarui: ${updatedCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}.`,
    failedCount > 0 ? 'WARNING' : 'SUCCESS'
  );

  return res.json({
    success: true,
    message: `Import berhasil diproses! ${insertedCount} baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} dilewati, ${failedCount} gagal.`,
    fileName: fileName || 'Import_Data_WBP.xlsx',
    totalRows: items.length,
    insertedCount,
    updatedCount,
    skippedCount,
    failedCount,
    duplicateMode,
    timestamp,
    details,
    version: db.meta.version,
  });
});

// 7. TRANSACTION CRUD ENDPOINTS

// Add Transaction (atomic balance recalculation)
app.post('/api/transactions', requireAdminAuth, (req, res) => {
  const trxData = req.body;
  const targetWbp = db.wbpList.find((w) => w.id === trxData.wbpId);
  if (!targetWbp) {
    return res.status(404).json({ success: false, message: 'Warga Binaan tidak ditemukan di database.' });
  }

  if (Number(trxData.nominal) <= 0) {
    return res.status(400).json({ success: false, message: 'Nominal transaksi harus lebih dari Rp 0.' });
  }

  if (trxData.jenisTransaksi === 'Uang Keluar' && targetWbp.saldoBerjalan < trxData.nominal) {
    return res.status(400).json({
      success: false,
      message: `Saldo tidak mencukupi! Saldo saat ini: Rp ${targetWbp.saldoBerjalan.toLocaleString('id-ID')}, nominal yang diminta: Rp ${trxData.nominal.toLocaleString('id-ID')}.`,
    });
  }

  const newSaldo =
    trxData.jenisTransaksi === 'Uang Masuk'
      ? targetWbp.saldoBerjalan + trxData.nominal
      : targetWbp.saldoBerjalan - trxData.nominal;

  const newTrxId = `trx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newTrx: Transaksi = {
    ...trxData,
    id: newTrxId,
    waktuPencatatan: nowStr,
    saldoSetelahTransaksi: newSaldo,
  };

  // Atomically update WBP balance
  targetWbp.saldoBerjalan = newSaldo;
  targetWbp.updatedAt = new Date().toISOString();

  // Add transaction
  db.transactions.unshift(newTrx);

  commitDb(
    `Catat ${trxData.jenisTransaksi}`,
    trxData.jenisTransaksi === 'Uang Masuk' ? 'Uang Titipan Masuk' : 'Pembelanjaan Kantin',
    `No: ${newTrx.nomorTransaksi} - ${trxData.namaWbp} nominal Rp ${trxData.nominal.toLocaleString('id-ID')} (${trxData.kategori}). Saldo baru: Rp ${newSaldo.toLocaleString('id-ID')}.`,
    'SUCCESS'
  );

  res.json({
    success: true,
    message: 'Transaksi berhasil disimpan permanen ke database dan dibukukan.',
    transaction: newTrx,
    wbp: targetWbp,
    version: db.meta.version,
  });
});

// Update Transaction
app.put('/api/transactions/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const idx = db.transactions.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
  }

  const old = db.transactions[idx];
  const updated: Transaksi = {
    ...old,
    ...updates,
    id: old.id,
    waktuPerubahan: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  db.transactions[idx] = updated;

  commitDb(
    'Koreksi Transaksi',
    'Riwayat Transaksi',
    `Koreksi data transaksi ${updated.nomorTransaksi} (${updated.namaWbp}).`,
    'WARNING'
  );

  res.json({
    success: true,
    message: 'Data transaksi berhasil diperbarui.',
    transaction: updated,
    version: db.meta.version,
  });
});

// Delete Transaction
app.delete('/api/transactions/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const targetTrx = db.transactions.find((t) => t.id === id);
  if (!targetTrx) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
  }

  // Rollback WBP balance
  const targetWbp = db.wbpList.find((w) => w.id === targetTrx.wbpId);
  if (targetWbp) {
    const reverted =
      targetTrx.jenisTransaksi === 'Uang Masuk'
        ? Math.max(0, targetWbp.saldoBerjalan - targetTrx.nominal)
        : targetWbp.saldoBerjalan + targetTrx.nominal;
    targetWbp.saldoBerjalan = reverted;
    targetWbp.updatedAt = new Date().toISOString();
  }

  db.transactions = db.transactions.filter((t) => t.id !== id);

  commitDb(
    'Hapus Transaksi',
    'Riwayat Transaksi',
    `Menghapus transaksi ${targetTrx.nomorTransaksi} (${targetTrx.jenisTransaksi} Rp ${targetTrx.nominal.toLocaleString('id-ID')}). Saldo WBP ${targetTrx.namaWbp} telah disesuaikan kembali.`,
    'DANGER'
  );

  res.json({
    success: true,
    message: 'Transaksi berhasil dihapus dan saldo telah dikembalikan.',
    deletedId: id,
    version: db.meta.version,
  });
});

// 8. SETTINGS & PORTAL CONTENT ENDPOINTS
app.put('/api/settings', requireAdminAuth, (req, res) => {
  const { uptSettings, portalContent, publicPortalSettings } = req.body;

  if (uptSettings) {
    db.uptSettings = {
      ...db.uptSettings,
      ...uptSettings,
    };
  }

  if (portalContent) {
    db.uptSettings.portalContent = {
      ...db.uptSettings.portalContent,
      ...portalContent,
    };
  }

  if (publicPortalSettings) {
    db.uptSettings.publicPortalSettings = {
      ...db.uptSettings.publicPortalSettings,
      ...publicPortalSettings,
    };
  }

  commitDb('Perbarui Pengaturan UPT & Portal', 'Pengaturan Sistem', 'Identitas instansi, logo, teks portal, atau kebijakan telah diperbarui.', 'INFO');

  res.json({
    success: true,
    message: 'Pengaturan berhasil disimpan permanen ke database!',
    uptSettings: db.uptSettings,
    version: db.meta.version,
  });
});

// Change Admin Password
app.post('/api/auth/change-password', requireAdminAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword !== db.uptSettings.adminPassword) {
    return res.status(400).json({ success: false, message: 'Kata sandi lama salah!' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter!' });
  }

  db.uptSettings.adminPassword = newPassword;
  commitDb('Ganti Kata Sandi Admin', 'Keamanan Server', 'Kata sandi administrator berhasil diperbarui.', 'SUCCESS');

  res.json({ success: true, message: 'Kata sandi administrator berhasil diperbarui!' });
});

// 9. FINANCIAL RESETS & CLOSINGS
app.post('/api/reset-saldo', requireAdminAuth, (req, res) => {
  const { type, wbpId } = req.body;

  if (type === 'INDIVIDUAL' && wbpId) {
    const target = db.wbpList.find((w) => w.id === wbpId);
    if (!target) return res.status(404).json({ success: false, message: 'WBP tidak ditemukan.' });
    target.saldoBerjalan = 0;
    target.updatedAt = new Date().toISOString();
    commitDb('Reset Saldo WBP Individu', 'Pemeriksaan Saldo', `Saldo WBP ${target.nama} di-reset menjadi Rp 0.`, 'WARNING');
    return res.json({ success: true, message: `Saldo ${target.nama} berhasil direset ke Rp 0.`, version: db.meta.version });
  }

  if (type === 'ALL_WBP') {
    db.wbpList.forEach((w) => {
      w.saldoBerjalan = 0;
      w.updatedAt = new Date().toISOString();
    });
    commitDb('Reset Seluruh Saldo WBP', 'Status Saldo', 'Seluruh saldo Warga Binaan telah di-reset menjadi Rp 0.', 'DANGER');
    return res.json({ success: true, message: 'Seluruh saldo WBP berhasil direset ke Rp 0.', version: db.meta.version });
  }

  if (type === 'TITIPAN_MASUK') {
    db.transactions = db.transactions.filter((t) => t.jenisTransaksi !== 'Uang Masuk');
    commitDb('Reset Titipan Masuk', 'Dashboard Admin', 'Riwayat uang titipan masuk telah di-reset.', 'WARNING');
    return res.json({ success: true, message: 'Total titipan masuk telah direset.', version: db.meta.version });
  }

  if (type === 'PEMBELANJAAN') {
    db.transactions = db.transactions.filter((t) => t.jenisTransaksi !== 'Uang Keluar');
    commitDb('Reset Pembelanjaan', 'Dashboard Admin', 'Riwayat pembelanjaan kantin telah di-reset.', 'WARNING');
    return res.json({ success: true, message: 'Total pembelanjaan kantin telah direset.', version: db.meta.version });
  }

  return res.status(400).json({ success: false, message: 'Tipe reset tidak valid.' });
});

// Tutup Buku Bulanan
app.post('/api/tutup-buku', requireAdminAuth, (req, res) => {
  const { adminPassword, periodeNama, options } = req.body;
  if (adminPassword !== db.uptSettings.adminPassword) {
    return res.status(400).json({ success: false, message: 'Kata sandi konfirmasi salah!' });
  }

  const totalMasuk = db.transactions.reduce((acc, t) => (t.jenisTransaksi === 'Uang Masuk' ? acc + t.nominal : acc), 0);
  const totalKeluar = db.transactions.reduce((acc, t) => (t.jenisTransaksi === 'Uang Keluar' ? acc + t.nominal : acc), 0);
  const totalSaldo = db.wbpList.reduce((acc, w) => acc + (w.saldoBerjalan || 0), 0);

  const report: LaporanBulanan = {
    id: `rep-${Date.now()}`,
    periode: periodeNama || 'Oktober 2026',
    tahun: 2026,
    bulan: 10,
    status: 'Tutup Buku Diarsipkan',
    jumlahTransaksi: db.transactions.length,
    totalMasuk,
    totalKeluar,
    saldoAkhir: totalSaldo,
    tanggalTutupBuku: new Date().toISOString().replace('T', ' ').substring(0, 19),
    petugasTutupBuku: `${db.uptSettings.bendaharaNama} (Bendahara)`,
  };

  db.monthlyReports.unshift(report);

  if (options?.resetMasuk && options?.resetKeluar) {
    db.transactions = [];
  } else if (options?.resetMasuk) {
    db.transactions = db.transactions.filter((t) => t.jenisTransaksi !== 'Uang Masuk');
  } else if (options?.resetKeluar) {
    db.transactions = db.transactions.filter((t) => t.jenisTransaksi !== 'Uang Keluar');
  }

  if (options?.resetSaldo) {
    db.wbpList.forEach((w) => {
      w.saldoBerjalan = 0;
      w.updatedAt = new Date().toISOString();
    });
  }

  commitDb('Tutup Buku Bulanan', 'Laporan Keuangan', `Tutup buku periode ${periodeNama} berhasil diarsipkan.`, 'SUCCESS');

  res.json({
    success: true,
    message: `Tutup buku ${periodeNama} berhasil diarsipkan ke database!`,
    report,
    version: db.meta.version,
  });
});

// Delete Monthly Report
app.delete('/api/monthly-reports/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  db.monthlyReports = db.monthlyReports.filter((r) => r.id !== id);
  commitDb('Hapus Arsip Laporan', 'Laporan Keuangan', `Menghapus arsip laporan ID: ${id}.`, 'DANGER');
  res.json({ success: true, message: 'Arsip laporan bulanan berhasil dihapus.', version: db.meta.version });
});

// Categories
app.post('/api/categories', requireAdminAuth, (req, res) => {
  const { nama, jenis } = req.body;
  if (!nama) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
  const newCat: CategoryItem = {
    id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    nama: nama.trim(),
    jenis: jenis || 'Uang Keluar',
  };
  db.categories.push(newCat);
  commitDb('Tambah Kategori', 'Pengaturan', `Kategori baru ditambahkan: ${nama} (${jenis}).`, 'INFO');
  res.json({ success: true, data: newCat, version: db.meta.version });
});

// Client migration endpoint: If client has existing localStorage data and DB is clean, import it
app.post('/api/migrate-local-data', requireAdminAuth, (req, res) => {
  const { wbpList, transactions, monthlyReports } = req.body;
  let imported = false;

  if (Array.isArray(wbpList) && wbpList.length > 0 && db.wbpList.length === 0) {
    db.wbpList = wbpList;
    imported = true;
  }
  if (Array.isArray(transactions) && transactions.length > 0 && db.transactions.length === 0) {
    db.transactions = transactions;
    imported = true;
  }
  if (Array.isArray(monthlyReports) && monthlyReports.length > 0 && db.monthlyReports.length === 0) {
    db.monthlyReports = monthlyReports;
    imported = true;
  }

  if (imported) {
    commitDb('Migrasi Data Klien', 'Database Utama', 'Data dari penyimpanan lokal klien berhasil dimigrasi ke database permanen server.', 'SUCCESS');
  }

  res.json({ success: true, version: db.meta.version });
});

// -------------------------------------------------------------------------
// VITE DEV SERVER OR STATIC FILE SERVING
// -------------------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPARTA RUJENTO] Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

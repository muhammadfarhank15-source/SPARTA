import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCw,
  Search,
  Eye,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  StatusWbp,
  DuplicateHandlingMode,
  BulkImportResult,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface ParsedRow {
  rowIndex: number;
  nomorRegistrasi: string;
  nama: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  alamat?: string;
  blokHunian: string;
  status: StatusWbp;
  tanggalMasuk: string;
  tanggalBebas?: string;
  jenisPerkara?: string;
  saldoAwal: number;
  catatan?: string;
  // Validation status
  isValid: boolean;
  isDuplicateDb: boolean;
  isDuplicateFile: boolean;
  duplicateWithNama?: string;
  errors: string[];
  warnings: string[];
}

export const ImportExcelWbp: React.FC = () => {
  const {
    wbpList,
    bulkImportWbp,
    uptSettings,
    setActiveAdminTab,
  } = useApp();

  // File & parsing states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Configuration options
  const [duplicateMode, setDuplicateMode] = useState<DuplicateHandlingMode>('SKIP');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALID' | 'DUPLICATE' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals & Results
  const [confirmImportModal, setConfirmImportModal] = useState(false);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [selectedRowDetail, setSelectedRowDetail] = useState<ParsedRow | null>(null);

  // Helper: Normalized header matching
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Helper: Date parser from Excel (can be serial number, or YYYY-MM-DD or DD/MM/YYYY)
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().substring(0, 10);
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const partsSlash = str.split('/');
    if (partsSlash.length === 3) {
      const d = partsSlash[0].padStart(2, '0');
      const m = partsSlash[1].padStart(2, '0');
      const y = partsSlash[2];
      return `${y}-${m}-${d}`;
    }
    const partsDash = str.split('-');
    if (partsDash.length === 3 && partsDash[0].length <= 2 && partsDash[2].length === 4) {
      const d = partsDash[0].padStart(2, '0');
      const m = partsDash[1].padStart(2, '0');
      const y = partsDash[2];
      return `${y}-${m}-${d}`;
    }
    return str;
  };

  // 1. Download Template Excel Resmi
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();

      const headers = [
        'Nomor Registrasi',
        'Nama Lengkap',
        'NIK',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Jenis Kelamin',
        'Alamat',
        'Nomor Kamar atau Blok',
        'Tanggal Masuk',
        'Tanggal Bebas atau Perkiraan Bebas',
        'Jenis Perkara',
        'Status Warga Binaan',
        'Saldo Awal Titipan',
        'Keterangan Tambahan',
      ];

      const sampleRows = [
        [
          'BI/2026/101',
          'Andi Muhammad Rahmat',
          '7304011205920001',
          'Jeneponto',
          '1992-05-12',
          'Laki-laki',
          'Kec. Binamu, Kab. Jeneponto',
          'Blok Mapenaling 01',
          '2026-01-15',
          '2028-01-15',
          'Tindak Pidana Umum',
          'Aktif',
          150000,
          'WBP baru titipan kejaksaan',
        ],
        [
          'BI/2026/102',
          'Dg. Tutu Bin Kamaruddin',
          '7304021508890002',
          'Makassar',
          '1989-08-15',
          'Laki-laki',
          'Kec. Tamalatea, Kab. Jeneponto',
          'Kamar 03 Blok A',
          '2026-02-10',
          '2027-08-10',
          'Narkotika',
          'Aktif',
          250000,
          'Keluarga rutin menyetor saldo',
        ],
        [
          'BI/2026/103',
          'Baharuddin Dg. Rate',
          '7304032203950003',
          'Jeneponto',
          '1995-03-22',
          'Laki-laki',
          'Kec. Kelara, Kab. Jeneponto',
          'Kamar 05 Blok B',
          '2026-03-01',
          '2029-03-01',
          'Pencurian',
          'Aktif',
          0,
          'Saldo awal nol rupiah',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

      ws['!cols'] = [
        { wch: 20 },
        { wch: 28 },
        { wch: 20 },
        { wch: 16 },
        { wch: 15 },
        { wch: 15 },
        { wch: 32 },
        { wch: 24 },
        { wch: 15 },
        { wch: 24 },
        { wch: 22 },
        { wch: 20 },
        { wch: 20 },
        { wch: 28 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Template_Warga_Binaan');

      // Sheet 2: Petunjuk Resmi Pengisian
      const petunjukData = [
        ['PETUNJUK RESMI PENGISIAN TEMPLATE IMPORT WARGA BINAAN'],
        [`Unit Kerja: ${uptSettings.namaUpt}`],
        [''],
        ['No', 'Nama Kolom', 'Kewajiban', 'Ketentuan & Contoh'],
        ['1', 'Nomor Registrasi', 'WAJIB', 'Identitas unik WBP di rutan (contoh: BI/2026/101). Wajib unik.'],
        ['2', 'Nama Lengkap', 'WAJIB', 'Nama lengkap warga binaan sesuai berkas resmi registrasi.'],
        ['3', 'NIK', 'OPSIONAL', 'Nomor Induk Kependudukan (16 digit angka). Boleh dikosongkan jika belum ada.'],
        ['4', 'Tempat Lahir', 'OPSIONAL', 'Kota/kabupaten kelahiran warga binaan.'],
        ['5', 'Tanggal Lahir', 'OPSIONAL', 'Format YYYY-MM-DD (Contoh: 1992-05-12).'],
        ['6', 'Jenis Kelamin', 'OPSIONAL', 'Pilihan: Laki-laki atau Perempuan.'],
        ['7', 'Alamat', 'OPSIONAL', 'Alamat domisili asal warga binaan.'],
        ['8', 'Nomor Kamar atau Blok', 'DIANJURKAN', 'Contoh: "Blok Mapenaling 01", "Kamar 02 Blok B". Jika kosong diisi default.'],
        ['9', 'Tanggal Masuk', 'WAJIB', 'Format YYYY-MM-DD (Contoh: 2026-01-15). Jika kosong diisi tanggal hari ini.'],
        ['10', 'Tanggal Bebas atau Perkiraan Bebas', 'OPSIONAL', 'Format YYYY-MM-DD. Boleh dikosongkan.'],
        ['11', 'Jenis Perkara', 'OPSIONAL', 'Contoh: Narkotika, Pidana Umum, Tipikor, Pencurian, dsb.'],
        ['12', 'Status Warga Binaan', 'OPSIONAL', 'Pilihan: Aktif, Bebas, Mutasi, Non-Aktif. Default jika kosong: Aktif.'],
        ['13', 'Saldo Awal Titipan', 'OPSIONAL', 'Angka rupiah nominal (contoh: 150000). Default jika kosong: 0.'],
        ['14', 'Keterangan Tambahan', 'OPSIONAL', 'Catatan tambahan khusus WBP jika ada.'],
      ];
      const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
      wsPetunjuk['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 14 }, { wch: 65 }];
      XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk_Pengisian');

      XLSX.writeFile(wb, `Template_Import_WBP_${uptSettings.namaAplikasi}_Jeneponto.xlsx`);
    } catch (err) {
      console.error('Error generating template:', err);
      alert('Gagal membuat template Excel.');
    }
  };

  // 2. Process uploaded file (.xlsx, .xls, .csv)
  const processUploadedFile = async (file: File) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isExtensionValid = validExts.some((ext) => lowerName.endsWith(ext));
    if (!isExtensionValid) {
      alert('Format file tidak didukung! Harap unggah file dengan format .xlsx, .xls, atau .csv');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal ukuran file adalah 20MB.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        alert('File Excel kosong atau tidak memiliki baris data (hanya header atau kosong).');
        setIsParsing(false);
        return;
      }

      // Map headers
      const rawHeaderRow = (rawRows[0] || []).map((h) => String(h || '').trim());
      const headerMap: { [key: string]: number } = {};

      rawHeaderRow.forEach((colName, idx) => {
        const norm = normalizeKey(colName);
        if (norm.includes('registrasi') || norm === 'noreg' || norm === 'reg') {
          headerMap['reg'] = idx;
        } else if (norm.includes('nama') || norm === 'wbp') {
          headerMap['nama'] = idx;
        } else if (norm.includes('nik') || norm.includes('ktp')) {
          headerMap['nik'] = idx;
        } else if (norm.includes('tempatlahir') || norm === 'kotalahir') {
          headerMap['tempatLahir'] = idx;
        } else if (norm.includes('tanggallahir') || norm === 'tgllahir') {
          headerMap['tanggalLahir'] = idx;
        } else if (norm.includes('jeniskelamin') || norm === 'jk' || norm === 'gender' || norm === 'sex') {
          headerMap['jenisKelamin'] = idx;
        } else if (norm.includes('alamat') || norm === 'domisili') {
          headerMap['alamat'] = idx;
        } else if (
          norm.includes('kamar') ||
          norm.includes('blok') ||
          norm.includes('paviliun') ||
          norm.includes('hunian')
        ) {
          headerMap['blok'] = idx;
        } else if (norm.includes('tanggalmasuk') || norm === 'tglmasuk' || norm === 'masuk') {
          headerMap['tanggalMasuk'] = idx;
        } else if (
          norm.includes('tanggalbebas') ||
          norm.includes('perkiraanbebas') ||
          norm === 'tglbebas' ||
          norm === 'bebas'
        ) {
          headerMap['tanggalBebas'] = idx;
        } else if (norm.includes('perkara') || norm.includes('kasus') || norm.includes('pasal')) {
          headerMap['jenisPerkara'] = idx;
        } else if (norm.includes('status')) {
          headerMap['status'] = idx;
        } else if (norm.includes('saldo')) {
          headerMap['saldoAwal'] = idx;
        } else if (norm.includes('keterangan') || norm.includes('catatan')) {
          headerMap['catatan'] = idx;
        }
      });

      const getVal = (row: any[], key: string, fallbackIdx: number): any => {
        const mappedIdx = headerMap[key];
        if (mappedIdx !== undefined && mappedIdx < row.length) {
          return row[mappedIdx];
        }
        if (fallbackIdx < row.length) {
          return row[fallbackIdx];
        }
        return '';
      };

      const existingDbRegMap = new Map<string, string>();
      wbpList.forEach((w) => {
        existingDbRegMap.set(w.nomorRegistrasi.trim().toUpperCase(), w.nama);
      });

      const seenFileRegs = new Map<string, number>();
      const rows: ParsedRow[] = [];
      const todayStr = new Date().toISOString().substring(0, 10);

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every((c) => c === '' || c === null || c === undefined)) {
          continue;
        }

        const rawReg = String(getVal(row, 'reg', 0) || '').trim();
        const rawNama = String(getVal(row, 'nama', 1) || '').trim();
        const rawNik = String(getVal(row, 'nik', 2) || '').trim();
        const rawTempatLahir = String(getVal(row, 'tempatLahir', 3) || '').trim();
        const rawTglLahir = parseExcelDate(getVal(row, 'tanggalLahir', 4));
        const rawJk = String(getVal(row, 'jenisKelamin', 5) || '').trim();
        const rawAlamat = String(getVal(row, 'alamat', 6) || '').trim();
        const rawBlok = String(getVal(row, 'blok', 7) || '').trim() || 'Blok Mapenaling 01';
        const rawTglMasuk = parseExcelDate(getVal(row, 'tanggalMasuk', 8)) || todayStr;
        const rawTglBebas = parseExcelDate(getVal(row, 'tanggalBebas', 9));
        const rawPerkara = String(getVal(row, 'jenisPerkara', 10) || '').trim();
        const rawStatus = String(getVal(row, 'status', 11) || '').trim();
        const rawSaldo = Number(getVal(row, 'saldoAwal', 12)) || 0;
        const rawCatatan = String(getVal(row, 'catatan', 13) || '').trim();

        const errors: string[] = [];
        const warnings: string[] = [];

        if (!rawReg) {
          errors.push('Nomor Registrasi wajib diisi (tidak boleh kosong).');
        }

        if (!rawNama) {
          errors.push('Nama Lengkap WBP wajib diisi.');
        }

        if (rawNik && !/^\d{16}$/.test(rawNik)) {
          warnings.push('Format NIK tidak 16 digit angka standar.');
        }

        let parsedStatus: StatusWbp = 'Aktif';
        const normStatus = rawStatus.toLowerCase();
        if (normStatus.includes('bebas')) {
          parsedStatus = 'Bebas';
        } else if (normStatus.includes('mutasi')) {
          parsedStatus = 'Mutasi';
        } else if (normStatus.includes('non') || normStatus.includes('pasif')) {
          parsedStatus = 'Non-Aktif';
        } else {
          parsedStatus = 'Aktif';
        }

        const regKey = rawReg.toUpperCase();
        let isDuplicateFile = false;
        if (regKey) {
          if (seenFileRegs.has(regKey)) {
            isDuplicateFile = true;
            warnings.push(`Nomor registrasi ganda dalam baris ke-${seenFileRegs.get(regKey)} pada file ini.`);
          } else {
            seenFileRegs.set(regKey, i + 1);
          }
        }

        let isDuplicateDb = false;
        let duplicateWithNama: string | undefined;
        if (regKey && existingDbRegMap.has(regKey)) {
          isDuplicateDb = true;
          duplicateWithNama = existingDbRegMap.get(regKey);
          warnings.push(`Nomor Registrasi sudah terdaftar di database atas nama "${duplicateWithNama}".`);
        }

        rows.push({
          rowIndex: i + 1,
          nomorRegistrasi: rawReg,
          nama: rawNama,
          nik: rawNik || undefined,
          tempatLahir: rawTempatLahir || undefined,
          tanggalLahir: rawTglLahir || undefined,
          jenisKelamin: rawJk || undefined,
          alamat: rawAlamat || undefined,
          blokHunian: rawBlok,
          status: parsedStatus,
          tanggalMasuk: rawTglMasuk,
          tanggalBebas: rawTglBebas || undefined,
          jenisPerkara: rawPerkara || undefined,
          saldoAwal: isNaN(rawSaldo) ? 0 : rawSaldo,
          catatan: rawCatatan || undefined,
          isValid: errors.length === 0,
          isDuplicateDb,
          isDuplicateFile,
          duplicateWithNama,
          errors,
          warnings,
        });
      }

      setParsedRows(rows);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      alert(`Gagal membaca file Excel: ${err?.message || 'Pastikan file tidak rusak atau terproteksi password.'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (filterStatus === 'VALID' && (!r.isValid || r.isDuplicateDb || r.isDuplicateFile)) return false;
      if (filterStatus === 'DUPLICATE' && !r.isDuplicateDb && !r.isDuplicateFile) return false;
      if (filterStatus === 'ERROR' && r.isValid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.nomorRegistrasi.toLowerCase().includes(q) ||
          r.nama.toLowerCase().includes(q) ||
          r.blokHunian.toLowerCase().includes(q) ||
          (r.jenisPerkara && r.jenisPerkara.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [parsedRows, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const validCount = parsedRows.filter((r) => r.isValid && !r.isDuplicateDb && !r.isDuplicateFile).length;
    const duplicateCount = parsedRows.filter((r) => r.isDuplicateDb || r.isDuplicateFile).length;
    const errorCount = parsedRows.filter((r) => !r.isValid).length;
    return { total, validCount, duplicateCount, errorCount };
  }, [parsedRows]);

  const handleCancelImport = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setConfirmCancelModal(false);
  };

  const executeBulkImport = async () => {
    setConfirmImportModal(false);
    setIsImporting(true);
    setImportProgress(15);

    const validCandidates = parsedRows.filter((r) => r.isValid);

    if (validCandidates.length === 0) {
      alert('Tidak ada data valid yang dapat diimpor! Silakan periksa kolom nomor registrasi dan nama.');
      setIsImporting(false);
      return;
    }

    const itemsToImport = validCandidates.map((r) => ({
      nomorRegistrasi: r.nomorRegistrasi,
      nama: r.nama,
      nik: r.nik,
      tempatLahir: r.tempatLahir,
      tanggalLahir: r.tanggalLahir,
      jenisKelamin: r.jenisKelamin,
      alamat: r.alamat,
      blokHunian: r.blokHunian,
      status: r.status,
      tanggalMasuk: r.tanggalMasuk,
      tanggalBebas: r.tanggalBebas,
      jenisPerkara: r.jenisPerkara,
      saldoAwal: r.saldoAwal,
      catatan: r.catatan,
    }));

    setImportProgress(50);
    await new Promise((res) => setTimeout(res, 200));
    setImportProgress(85);

    const result = await bulkImportWbp(itemsToImport, duplicateMode, selectedFile?.name || 'Bulk_WBP.xlsx');

    setImportProgress(100);
    await new Promise((res) => setTimeout(res, 100));

    setIsImporting(false);
    setImportResult(result);
  };

  const handleDownloadResultReport = () => {
    if (!importResult) return;
    try {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ['LAPORAN HASIL IMPORT MASSAL WARGA BINAAN'],
        [`Unit Kerja: ${uptSettings.namaUpt}`],
        [`Waktu Pelaksanaan: ${importResult.timestamp}`],
        [`Nama File Sumber: ${importResult.fileName}`],
        [`Mode Penanganan Duplikat: ${importResult.duplicateMode}`],
        [''],
        ['METRIK HASIL IMPORT', 'JUMLAH'],
        ['Total Baris Diproses', importResult.totalRows],
        ['Data Berhasil Ditambahkan (Baru)', importResult.insertedCount],
        ['Data Berhasil Diperbarui (Update)', importResult.updatedCount],
        ['Data Dilewati (Skip)', importResult.skippedCount],
        ['Data Gagal (Error)', importResult.failedCount],
        ['Status Eksekusi', importResult.success ? 'SUKSES' : 'GAGAL / DIBATALKAN'],
        ['Keterangan', importResult.message],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Import');

      const detailHeaders = ['No', 'Nomor Registrasi', 'Nama Lengkap', 'Blok / Kamar', 'Status Hasil', 'Keterangan Sistem'];
      const detailRows = importResult.details.map((d, idx) => [
        idx + 1,
        d.nomorRegistrasi,
        d.nama,
        d.blokHunian || '-',
        d.statusAksi === 'INSERTED'
          ? 'BERHASIL (BARU)'
          : d.statusAksi === 'UPDATED'
          ? 'DIPERBARUI'
          : d.statusAksi === 'SKIPPED'
          ? 'DILEWATI'
          : 'GAGAL',
        d.keterangan,
      ]);
      const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
      wsDetails['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 30 }, { wch: 24 }, { wch: 18 }, { wch: 55 }];
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Rincian_Data_Import');

      XLSX.writeFile(wb, `Laporan_Hasil_Import_WBP_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Gagal mengunduh file laporan hasil import.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-blue-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-300" />
              <span>Modul Integrasi Database Massal • Rutan Kelas IIB Jeneponto</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat-extrabold text-white tracking-tight">
              IMPORT DATA WARGA BINAAN SECARA MASSAL
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unggah ratusan hingga ribuan data warga binaan sekaligus via file Excel (.xlsx, .xls) atau CSV.
              Sistem akan memvalidasi data otomatis, mendeteksi duplikat, dan menyimpannya langsung ke database utama.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('wbp')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Lihat Daftar WBP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border transition-all ${!selectedFile ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${!selectedFile ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {selectedFile ? '✓' : '1'}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">1. Unggah File</div>
              <div className="text-[11px] text-slate-500">Pilih atau Drag & Drop</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${selectedFile && !importResult ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedFile && !importResult ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              2
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">2. Validasi & Preview</div>
              <div className="text-[11px] text-slate-500">Cek error & duplikat</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${selectedFile && !importResult && stats.validCount > 0 ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedFile && !importResult && stats.validCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              3
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">3. Import Massal</div>
              <div className="text-[11px] text-slate-500">Batch simpan database</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${importResult ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${importResult ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              4
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">4. Laporan Hasil</div>
              <div className="text-[11px] text-slate-500">Unduh rekapitulasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone if no file or parsing */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processUploadedFile(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Tarik & Lepas File Excel di Sini</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung file berekstensi <span className="font-semibold text-slate-700">.xlsx</span>,{' '}
                <span className="font-semibold text-slate-700">.xls</span>, atau{' '}
                <span className="font-semibold text-slate-700">.csv</span> hingga 20MB.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Pilih File Excel Dari Komputer</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Template Resmi</span>
              </button>
            </div>

            <div className="pt-4 text-[11px] text-slate-400 border-t border-slate-100 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Format Kolom Fleksibel
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Deteksi Duplikat Cerdas
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Validasi Otomatis
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Parsing Loading State */}
      {isParsing && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Sedang Membaca dan Memvalidasi File Excel...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Sistem sedang memeriksa seluruh baris, kolom, tipe data, dan mencocokkan nomor registrasi dengan database.
            </p>
          </div>
        </div>
      )}

      {/* Result Banner if already imported */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Proses Import Massal Selesai!</h3>
                <p className="text-xs text-emerald-700">{importResult.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleDownloadResultReport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan Hasil (.xlsx)</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('wbp')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Data Warga Binaan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelImport}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Upload File Lain
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200">
              <div className="text-[11px] text-slate-500 font-medium">Baris Diproses</div>
              <div className="text-xl font-bold text-slate-800">{importResult.totalRows}</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200">
              <div className="text-[11px] text-emerald-600 font-medium">Baru Disimpan</div>
              <div className="text-xl font-bold text-emerald-700">{importResult.insertedCount}</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200">
              <div className="text-[11px] text-blue-600 font-medium">Data Diperbarui</div>
              <div className="text-xl font-bold text-blue-700">{importResult.updatedCount}</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200">
              <div className="text-[11px] text-amber-600 font-medium">Dilewati / Gagal</div>
              <div className="text-xl font-bold text-amber-700">
                {importResult.skippedCount + importResult.failedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section if parsed rows available */}
      {selectedFile && !isParsing && parsedRows.length > 0 && (
        <div className="space-y-6">
          {/* File Info & Metric Summary Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedFile.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    File berhasil dibaca. Silakan tinjau ringkasan validasi sebelum menyimpan ke database.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ganti File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancelModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Batalkan Import</span>
                </button>
                <button
                  type="button"
                  disabled={isImporting || stats.validCount + stats.duplicateCount === 0}
                  onClick={() => setConfirmImportModal(true)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  <span>Import Semua Data</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Total Baris</span>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-[11px] text-slate-400 mt-1">Data terbaca dari file</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
                  <span className="font-semibold">Data Valid (Baru)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-700">{stats.validCount}</div>
                <div className="text-[11px] text-emerald-600/80 mt-1">Siap langsung disimpan</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center justify-between text-amber-700 text-xs mb-1">
                  <span className="font-semibold">Data Duplikat</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-700">{stats.duplicateCount}</div>
                <div className="text-[11px] text-amber-600/80 mt-1">
                  {duplicateMode === 'SKIP' ? 'Akan dilewati aman' : duplicateMode === 'UPDATE' ? 'Akan diperbarui' : 'Dibatalkan'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
                  <span className="font-semibold">Data Error</span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-bold text-rose-700">{stats.errorCount}</div>
                <div className="text-[11px] text-rose-600/80 mt-1">Wajib diperbaiki</div>
              </div>
            </div>

            {/* Duplicate Handling Mode Setting */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Pengaturan Penanganan Nomor Registrasi Duplikat:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'SKIP'
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateMode"
                    value="SKIP"
                    checked={duplicateMode === 'SKIP'}
                    onChange={() => setDuplicateMode('SKIP')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>1. Lewati Data Duplikat</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Rekomendasi
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Data yang no. registrasinya sudah ada tidak akan diubah atau digandakan. Data lama tetap aman.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'UPDATE'
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateMode"
                    value="UPDATE"
                    checked={duplicateMode === 'UPDATE'}
                    onChange={() => setDuplicateMode('UPDATE')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">2. Perbarui Data Lama (Update)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Data lama dengan no. registrasi sama akan ditimpa dengan informasi baru dari Excel.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'CANCEL'
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateMode"
                    value="CANCEL"
                    checked={duplicateMode === 'CANCEL'}
                    onChange={() => setDuplicateMode('CANCEL')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">3. Batalkan Jika Duplikat</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Proses import otomatis dibatalkan seluruhnya jika terdeteksi 1 saja duplikasi data.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Importing Progress Bar */}
            {isImporting && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Sedang Menyimpan Data ke Database Utama...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Control Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Filter Status:</span>
                <button
                  onClick={() => {
                    setFilterStatus('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('VALID');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'VALID'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Valid ({stats.validCount})
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('DUPLICATE');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'DUPLICATE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Duplikat ({stats.duplicateCount})
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('ERROR');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'ERROR'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Error ({stats.errorCount})
                </button>
              </div>

              {/* Search and page size */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari no. reg / nama..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden"
                >
                  <option value={10}>10 / hal</option>
                  <option value={25}>25 / hal</option>
                  <option value={50}>50 / hal</option>
                  <option value={100}>100 / hal</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4 w-12 text-center">Baris</th>
                    <th className="py-3 px-4">Status Validasi</th>
                    <th className="py-3 px-4">No. Registrasi</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kamar / Blok</th>
                    <th className="py-3 px-4">Status WBP</th>
                    <th className="py-3 px-4">Tgl Masuk</th>
                    <th className="py-3 px-4 text-right">Saldo Awal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ada data yang sesuai dengan filter atau kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r) => {
                      const isErr = !r.isValid;
                      const isDup = r.isDuplicateDb || r.isDuplicateFile;

                      return (
                        <tr
                          key={r.rowIndex}
                          className={`hover:bg-slate-50 transition-colors ${
                            isErr
                              ? 'bg-rose-50/40 text-rose-950'
                              : isDup
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                            #{r.rowIndex}
                          </td>
                          <td className="py-3 px-4">
                            {isErr ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Error: {r.errors[0]}</span>
                              </span>
                            ) : isDup ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Duplikat {r.isDuplicateDb ? '(DB)' : '(File)'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Valid (Siap Simpan)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {r.nomorRegistrasi || <span className="text-rose-500 italic">Kosong</span>}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {r.nama || <span className="text-rose-500 italic">Kosong</span>}
                            {r.nik && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                NIK: {r.nik.substring(0, 6)}******{r.nik.substring(12)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.blokHunian}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                r.status === 'Aktif'
                                  ? 'bg-blue-100 text-blue-800'
                                  : r.status === 'Bebas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {r.tanggalMasuk}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                            {formatRupiah(r.saldoAwal)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedRowDetail(r)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Lihat Detail Lengkap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Menampilkan {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} baris
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Detail Inspection Modal */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Eye className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Detail Baris Excel #{selectedRowDetail.rowIndex}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400">Nomor Registrasi:</span>
                  <div className="font-bold font-mono text-slate-900">{selectedRowDetail.nomorRegistrasi || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Nama Lengkap:</span>
                  <div className="font-bold text-slate-900">{selectedRowDetail.nama || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">NIK:</span>
                  <div className="font-mono text-slate-800">{selectedRowDetail.nik || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Tempat, Tanggal Lahir:</span>
                  <div className="text-slate-800">
                    {selectedRowDetail.tempatLahir || '-'}, {selectedRowDetail.tanggalLahir || '-'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Jenis Kelamin:</span>
                  <div className="text-slate-800">{selectedRowDetail.jenisKelamin || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Kamar / Blok Hunian:</span>
                  <div className="font-semibold text-slate-800">{selectedRowDetail.blokHunian}</div>
                </div>
                <div>
                  <span className="text-slate-400">Tanggal Masuk:</span>
                  <div className="text-slate-800">{selectedRowDetail.tanggalMasuk}</div>
                </div>
                <div>
                  <span className="text-slate-400">Tanggal Bebas:</span>
                  <div className="text-slate-800">{selectedRowDetail.tanggalBebas || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Jenis Perkara:</span>
                  <div className="text-slate-800">{selectedRowDetail.jenisPerkara || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Saldo Awal Titipan:</span>
                  <div className="font-mono font-bold text-emerald-600">
                    {formatRupiah(selectedRowDetail.saldoAwal)}
                  </div>
                </div>
              </div>

              {selectedRowDetail.alamat && (
                <div>
                  <span className="text-slate-400 font-medium">Alamat Domisili:</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700">{selectedRowDetail.alamat}</div>
                </div>
              )}

              {selectedRowDetail.catatan && (
                <div>
                  <span className="text-slate-400 font-medium">Keterangan / Catatan:</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700">{selectedRowDetail.catatan}</div>
                </div>
              )}

              {/* Status Warning or Errors */}
              {selectedRowDetail.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Kesalahan Data (Wajib Diperbaiki):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 pl-1">
                    {selectedRowDetail.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRowDetail.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Catatan Sistem / Duplikasi:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 pl-1">
                    {selectedRowDetail.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Import Execution */}
      <ConfirmModal
        isOpen={confirmImportModal}
        title="Konfirmasi Import Massal Warga Binaan"
        message={`Anda akan mengimpor data dari file "${selectedFile?.name}". 
Rincian data: ${stats.validCount} data baru, ${stats.duplicateCount} data duplikat (Mode: ${
          duplicateMode === 'SKIP' ? 'Lewati Duplikat' : duplicateMode === 'UPDATE' ? 'Perbarui Data Lama' : 'Batalkan'
        }), dan ${stats.errorCount} data error dilewati. 
Apakah Anda yakin ingin menyimpan seluruh data yang valid ke database utama sekarang?`}
        confirmText="Ya, Simpan ke Database"
        cancelText="Kembali & Periksa"
        isDanger={duplicateMode === 'UPDATE'}
        onConfirm={executeBulkImport}
        onCancel={() => setConfirmImportModal(false)}
      />

      {/* Confirmation Modal for Cancel Process */}
      <ConfirmModal
        isOpen={confirmCancelModal}
        title="Batalkan Proses Import?"
        message="Seluruh file yang telah diunggah dan hasil preview akan dibersihkan. Anda dapat mengunggah file baru kapan saja."
        confirmText="Ya, Batalkan"
        cancelText="Tidak, Lanjutkan"
        isDanger={true}
        onConfirm={handleCancelImport}
        onCancel={() => setConfirmCancelModal(false)}
      />
    </div>
  );
};

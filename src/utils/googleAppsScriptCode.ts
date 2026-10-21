/**
 * Complete Google Apps Script (Code.gs) for SIK-WBP
 * Can be deployed as a Web App to connect Google Sheets with the React App.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - SISTEM INFORMASI KEUANGAN WARGA BINAAN (SIK-WBP)
 * RUTAN KELAS IIB JENEPONTO
 * =========================================================================
 * 
 * PETUNJUK DEPLOYMENT:
 * 1. Buka spreadsheet baru di Google Sheets.
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus kode default, lalu salin (paste) SELURUH KODE ini ke file Code.gs.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik fungsi "inisialisasiSheetDanFormat" lalu klik "Jalankan" (Run) untuk membuat 
 *    tabel & header rapi secara otomatis di Google Sheets.
 * 6. Klik tombol biru "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
 * 7. Pilih Jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: SIK-WBP API v1.0
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 8. Klik "Terapkan", berikan izin akses akun Google jika diminta.
 * 9. Salin URL Aplikasi Web yang dihasilkan (berakhiran /exec), 
 *    lalu tempelkan di menu "Integrasi Google Sheets" pada Dashboard Admin aplikasi.
 */

const API_KEY = "SPARTA";
const SHEET_TRANSAKSI = "TRANSAKSI";
const SHEET_WARGA_BINAAN = "WARGA_BINAAN";
const SHEET_PENGATURAN = "PENGATURAN";
const SHEET_ARSIP_BULANAN = "ARSIP_BULANAN";

/**
 * Handle HTTP GET Request
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "GET_ALL";
    const apiKey = e && e.parameter ? (e.parameter.apiKey || e.parameter.api_key || "") : "";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "GET_PUBLIC_SUMMARY") {
      // Endpoint publik aman: hanya agregat tanpa data sensitif
      const trxSheet = ss.getSheetByName(SHEET_TRANSAKSI);
      const wbpSheet = ss.getSheetByName(SHEET_WARGA_BINAAN);

      let totalMasuk = 0;
      let totalKeluar = 0;
      let totalSaldo = 0;
      let countTrx = 0;

      if (trxSheet && trxSheet.getLastRow() > 1) {
        const data = trxSheet.getRange(2, 1, trxSheet.getLastRow() - 1, 11).getValues();
        countTrx = data.length;
        data.forEach(r => {
          const jenis = r[3];
          const nominal = Number(r[5]) || 0;
          if (jenis === "Uang Masuk") totalMasuk += nominal;
          if (jenis === "Uang Keluar") totalKeluar += nominal;
        });
      }

      if (wbpSheet && wbpSheet.getLastRow() > 1) {
        const wbpData = wbpSheet.getRange(2, 1, wbpSheet.getLastRow() - 1, 8).getValues();
        wbpData.forEach(r => {
          totalSaldo += (Number(r[6]) || 0);
        });
      }

      return jsonResponse({
        success: true,
        data: {
          totalMasuk,
          totalKeluar,
          totalSaldo,
          jumlahTransaksi: countTrx,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Proteksi Keamanan: Akses data penuh memerlukan API Key yang valid
    if (API_KEY && apiKey !== API_KEY) {
      return jsonResponse({
        success: false,
        error: "Akses ditolak: Parameter apiKey tidak valid atau tidak disertakan."
      });
    }

    // Default GET_ALL (untuk Admin yang memegang script URL & API Key)
    const transaksi = readSheet(ss, SHEET_TRANSAKSI);
    const wargaBinaan = readSheet(ss, SHEET_WARGA_BINAAN);
    const arsipBulanan = readSheet(ss, SHEET_ARSIP_BULANAN);
    const pengaturan = readSheet(ss, SHEET_PENGATURAN);

    return jsonResponse({
      success: true,
      data: {
        transaksi,
        wargaBinaan,
        arsipBulanan,
        pengaturan,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Request
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const apiKey = payload.apiKey || payload.api_key || (e && e.parameter && (e.parameter.apiKey || e.parameter.api_key));

    // Validasi Keamanan API Key SPARTA
    if (API_KEY && apiKey !== API_KEY) {
      return jsonResponse({
        success: false,
        error: "Akses ditolak: API Key keamanan SPARTA tidak valid atau belum dicantumkan."
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Inisialisasi / Sync Semuanya
    if (action === "SYNC_ALL") {
      inisialisasiSheetDanFormat();
      if (payload.wargaBinaan) overwriteSheet(ss, SHEET_WARGA_BINAAN, payload.wargaBinaan);
      if (payload.transaksi) overwriteSheet(ss, SHEET_TRANSAKSI, payload.transaksi);
      if (payload.arsipBulanan) overwriteSheet(ss, SHEET_ARSIP_BULANAN, payload.arsipBulanan);
      return jsonResponse({ success: true, message: "Sinkronisasi penuh berhasil." });
    }

    // 2. Tambah Transaksi
    if (action === "ADD_TRANSAKSI") {
      const sheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      const t = payload.data;
      sheet.appendRow([
        t.id,
        t.nomorTransaksi,
        t.tanggal,
        t.namaWbp,
        t.jenisTransaksi,
        t.kategori,
        t.nominal,
        t.sumberAtauTujuan,
        t.keterangan,
        t.petugas,
        t.waktuPencatatan
      ]);
      return jsonResponse({ success: true, message: "Transaksi berhasil dicatat." });
    }

    // 3. Tambah / Update WBP
    if (action === "SAVE_WBP") {
      const sheet = getOrCreateSheet(ss, SHEET_WARGA_BINAAN);
      const w = payload.data;
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === w.id) {
          foundIndex = i + 1;
          break;
        }
      }
      const rowData = [
        w.id,
        w.nomorRegistrasi,
        w.nama,
        w.blokHunian,
        w.status,
        w.saldoAwal,
        w.saldoBerjalan,
        w.tanggalMasuk,
        w.tanggalBebas || "",
        w.uptTujuan || "",
        w.noSkMutasi || ""
      ];

      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return jsonResponse({ success: true, message: "Data WBP berhasil disimpan." });
    }

    return jsonResponse({ success: false, error: "Aksi tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Format helper response JSON
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Buat struktur tabel rapi dengan warna Kementerian / Pemasyarakatan
 */
function inisialisasiSheetDanFormat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. TRANSAKSI
  const sTrx = getOrCreateSheet(ss, SHEET_TRANSAKSI);
  sTrx.clear();
  const headersTrx = [
    "ID Transaksi", "No Transaksi", "Tanggal", "Nama WBP", 
    "Jenis Transaksi", "Kategori", "Nominal (Rp)", "Sumber/Tujuan", 
    "Keterangan", "Petugas Kasir", "Waktu Pencatatan"
  ];
  sTrx.getRange(1, 1, 1, headersTrx.length).setValues([headersTrx]);
  formatHeaderRow(sTrx, headersTrx.length, "#0F172A", "#FFFFFF"); // Navy Blue

  // 2. WARGA BINAAN
  const sWbp = getOrCreateSheet(ss, SHEET_WARGA_BINAAN);
  sWbp.clear();
  const headersWbp = [
    "ID", "No Registrasi", "Nama Lengkap", "Blok Hunian", 
    "Status", "Saldo Awal (Rp)", "Saldo Berjalan (Rp)", "Tanggal Masuk", 
    "Tanggal Bebas", "UPT Tujuan", "No SK Mutasi"
  ];
  sWbp.getRange(1, 1, 1, headersWbp.length).setValues([headersWbp]);
  formatHeaderRow(sWbp, headersWbp.length, "#0F172A", "#FFFFFF");

  // 3. PENGATURAN
  const sSet = getOrCreateSheet(ss, SHEET_PENGATURAN);
  sSet.clear();
  sSet.getRange(1, 1, 1, 2).setValues([["Parameter", "Nilai"]]);
  formatHeaderRow(sSet, 2, "#0F172A", "#FFFFFF");
  sSet.appendRow(["Kementerian", "Kementerian Imigrasi dan Pemasyarakatan Republik Indonesia"]);
  sSet.appendRow(["Direktorat Jenderal", "Direktorat Jenderal Pemasyarakatan"]);
  sSet.appendRow(["Kantor Wilayah", "Kantor Wilayah Sulawesi Selatan"]);
  sSet.appendRow(["Nama Instansi", "RUTAN KELAS IIB JENEPONTO"]);
  sSet.appendRow(["Nama Aplikasi", "APLIKASI KEUANGAN UANG DIGITAL & EDC RESMI (SIK-WBP)"]);
  sSet.appendRow(["Waktu Inisialisasi", new Date().toLocaleString("id-ID")]);

  // 4. ARSIP BULANAN
  const sArsip = getOrCreateSheet(ss, SHEET_ARSIP_BULANAN);
  sArsip.clear();
  const headersArsip = [
    "ID", "Periode", "Tahun", "Bulan", "Status Pembukuan", 
    "Jumlah Transaksi", "Total Masuk (Rp)", "Total Keluar (Rp)", "Saldo Bersih (Rp)", "Tanggal Tutup Buku", "Petugas"
  ];
  sArsip.getRange(1, 1, 1, headersArsip.length).setValues([headersArsip]);
  formatHeaderRow(sArsip, headersArsip.length, "#B45309", "#FFFFFF"); // Amber Emas
}

function formatHeaderRow(sheet, numCols, bgColor, textColor) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground(bgColor);
  range.setFontColor(textColor);
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function readSheet(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  return range.getValues();
}

function overwriteSheet(ss, name, rows) {
  const sheet = getOrCreateSheet(ss, name);
  if (rows && rows.length > 0) {
    // Keep header, clear data
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    const numRows = rows.length;
    const numCols = rows[0].length;
    sheet.getRange(2, 1, numRows, numCols).setValues(rows);
  }
}
`;

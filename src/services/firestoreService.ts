import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import {
  WargaBinaan,
  Transaksi,
  LaporanBulanan,
  AuditLog,
  UptSettings,
  CategoryItem,
  PublicPortalContent,
  DuplicateHandlingMode,
  BulkImportResult,
} from '../types';

// Collection references
const COL_WBP = 'warga_binaan';
const COL_TRX = 'transaksi_uang';
const COL_REPORTS = 'laporan_bulanan';
const COL_AUDIT = 'audit_logs';
const COL_SETTINGS = 'pengaturan_upt';
const COL_CATEGORIES = 'kategori';
const DOC_SETTINGS_MAIN = 'main';

export interface FirestoreSubscriptionHandlers {
  onWbpChange: (list: WargaBinaan[]) => void;
  onTrxChange: (list: Transaksi[]) => void;
  onReportsChange: (list: LaporanBulanan[]) => void;
  onAuditChange?: (list: AuditLog[]) => void;
  onSettingsChange: (settings: UptSettings) => void;
  onCategoriesChange: (cats: CategoryItem[]) => void;
  onError?: (err: Error) => void;
}

class FirestoreService {
  /**
   * 1. Real-time multi-device sync listener using onSnapshot()
   */
  public subscribeRealtimeData(handlers: FirestoreSubscriptionHandlers): () => void {
    const unsubscribers: Unsubscribe[] = [];

    // 1.1 Warga Binaan Collection
    try {
      const qWbp = query(collection(db, COL_WBP));
      const unsubWbp = onSnapshot(
        qWbp,
        (snapshot) => {
          const list: WargaBinaan[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<WargaBinaan, 'id'>) });
          });
          // Sort by name or updatedAt
          list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
          handlers.onWbpChange(list);
        },
        (error) => {
          console.warn('[Firestore] WBP subscription error:', error);
          if (handlers.onError) handlers.onError(error);
          handleFirestoreError(error, OperationType.LIST, COL_WBP);
        }
      );
      unsubscribers.push(unsubWbp);
    } catch (err) {
      console.warn('Failed to attach WBP snapshot:', err);
    }

    // 1.2 Transaksi Keuangan Collection
    try {
      const qTrx = query(collection(db, COL_TRX));
      const unsubTrx = onSnapshot(
        qTrx,
        (snapshot) => {
          const list: Transaksi[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<Transaksi, 'id'>) });
          });
          // Sort by date / time descending
          list.sort((a, b) => (b.waktuPencatatan || b.tanggal).localeCompare(a.waktuPencatatan || a.tanggal));
          handlers.onTrxChange(list);
        },
        (error) => {
          console.warn('[Firestore] Transaksi subscription error:', error);
          if (handlers.onError) handlers.onError(error);
          handleFirestoreError(error, OperationType.LIST, COL_TRX);
        }
      );
      unsubscribers.push(unsubTrx);
    } catch (err) {
      console.warn('Failed to attach Transaksi snapshot:', err);
    }

    // 1.3 Laporan Bulanan Collection
    try {
      const qRep = query(collection(db, COL_REPORTS));
      const unsubRep = onSnapshot(
        qRep,
        (snapshot) => {
          const list: LaporanBulanan[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<LaporanBulanan, 'id'>) });
          });
          list.sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan);
          handlers.onReportsChange(list);
        },
        (error) => {
          console.warn('[Firestore] Laporan subscription error:', error);
          if (handlers.onError) handlers.onError(error);
          handleFirestoreError(error, OperationType.LIST, COL_REPORTS);
        }
      );
      unsubscribers.push(unsubRep);
    } catch (err) {
      console.warn('Failed to attach Laporan snapshot:', err);
    }

    // 1.4 Audit Logs Collection (Top 100 recent)
    try {
      const qAudit = query(collection(db, COL_AUDIT), limit(100));
      const unsubAudit = onSnapshot(
        qAudit,
        (snapshot) => {
          const list: AuditLog[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) });
          });
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          if (handlers.onAuditChange) handlers.onAuditChange(list);
        },
        (error) => {
          // Non-admin may be denied audit read per security rules; ignore gracefully
          console.info('[Firestore] Audit log access limited to admins:', error.message);
        }
      );
      unsubscribers.push(unsubAudit);
    } catch (err) {
      // Ignore
    }

    // 1.5 Pengaturan UPT & Portal Content
    try {
      const docRef = doc(db, COL_SETTINGS, DOC_SETTINGS_MAIN);
      const unsubSettings = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            handlers.onSettingsChange(snap.data() as UptSettings);
          }
        },
        (error) => {
          console.warn('[Firestore] Settings subscription error:', error);
          if (handlers.onError) handlers.onError(error);
          handleFirestoreError(error, OperationType.GET, `${COL_SETTINGS}/${DOC_SETTINGS_MAIN}`);
        }
      );
      unsubscribers.push(unsubSettings);
    } catch (err) {
      console.warn('Failed to attach Settings snapshot:', err);
    }

    // 1.6 Kategori Transaksi
    try {
      const qCat = query(collection(db, COL_CATEGORIES));
      const unsubCat = onSnapshot(
        qCat,
        (snapshot) => {
          const list: CategoryItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<CategoryItem, 'id'>) });
          });
          handlers.onCategoriesChange(list);
        },
        (error) => {
          console.warn('[Firestore] Categories subscription error:', error);
          if (handlers.onError) handlers.onError(error);
          handleFirestoreError(error, OperationType.LIST, COL_CATEGORIES);
        }
      );
      unsubscribers.push(unsubCat);
    } catch (err) {
      console.warn('Failed to attach Categories snapshot:', err);
    }

    // Return cleanup unsubscriber function
    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // Ignore
        }
      });
    };
  }

  /**
   * 2. Seed Initial Data If Firestore is Empty on First Boot
   */
  public async seedInitialDataIfEmpty(
    initialWbp: WargaBinaan[],
    initialTrx: Transaksi[],
    initialReports: LaporanBulanan[],
    initialSettings: UptSettings,
    initialCategories: CategoryItem[]
  ): Promise<boolean> {
    const settingsPath = `${COL_SETTINGS}/${DOC_SETTINGS_MAIN}`;
    try {
      const settingsSnap = await getDoc(doc(db, COL_SETTINGS, DOC_SETTINGS_MAIN));
      if (settingsSnap.exists()) {
        // Database already seeded
        return false;
      }

      console.log('[Firestore] Basis data kosong, melakukan inisialisasi awal ke Cloud Firestore...');
      const batch = writeBatch(db);

      // Seed UPT Settings
      batch.set(doc(db, COL_SETTINGS, DOC_SETTINGS_MAIN), initialSettings);

      // Seed Categories
      for (const cat of initialCategories) {
        batch.set(doc(db, COL_CATEGORIES, cat.id), cat);
      }

      // Seed initial WBP
      for (const wbp of initialWbp) {
        batch.set(doc(db, COL_WBP, wbp.id), wbp);
      }

      // Seed initial Transactions
      for (const trx of initialTrx) {
        batch.set(doc(db, COL_TRX, trx.id), trx);
      }

      // Seed initial Reports
      for (const rep of initialReports) {
        batch.set(doc(db, COL_REPORTS, rep.id), rep);
      }

      // Commit batch
      await batch.commit();

      // Log initial seed audit
      await this.recordAuditLog(
        'Inisialisasi Cloud Firestore',
        'Database Utama',
        'Migrasi data awal sistem SPARTA RUJENTO berhasil disimpan ke Cloud Firestore secara permanen.',
        'SUCCESS'
      );

      console.log('[Firestore] Inisialisasi awal ke Cloud Firestore selesai.');
      return true;
    } catch (error) {
      console.warn('[Firestore] Seed check/write notice:', error);
      // Non-fatal if offline or already configured
      return false;
    }
  }

  /**
   * 3. WBP CRUD Operations
   */
  public async createWbp(data: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>): Promise<WargaBinaan> {
    const wbpId = `wbp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const path = `${COL_WBP}/${wbpId}`;
    const initialSaldo = Number(data.saldoAwal) || 0;

    const newRecord: WargaBinaan = {
      ...data,
      id: wbpId,
      nomorRegistrasi: data.nomorRegistrasi.trim(),
      nama: data.nama.trim(),
      blokHunian: data.blokHunian?.trim() || 'Blok Mapenaling 01',
      status: data.status || 'Aktif',
      saldoAwal: initialSaldo,
      saldoBerjalan: initialSaldo,
      tanggalMasuk: data.tanggalMasuk || new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COL_WBP, wbpId), newRecord);
      await this.recordAuditLog(
        'Tambah WBP',
        'Data Warga Binaan',
        `Mendaftarkan WBP baru: ${newRecord.nama} (${newRecord.nomorRegistrasi}) di ${newRecord.blokHunian}. Saldo: Rp ${initialSaldo.toLocaleString('id-ID')}.`,
        'SUCCESS'
      );
      return newRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public async updateWbp(id: string, updates: Partial<WargaBinaan>): Promise<void> {
    const path = `${COL_WBP}/${id}`;
    try {
      const payload: Record<string, any> = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      delete payload.id; // ID is immutable

      await updateDoc(doc(db, COL_WBP, id), payload);
      await this.recordAuditLog(
        'Ubah Data WBP',
        'Data Warga Binaan',
        `Memperbarui profil WBP ID: ${id}. Bidang diubah: ${Object.keys(updates).join(', ')}.`,
        'INFO'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async deleteWbp(id: string, wbpNama: string, saldo: number): Promise<void> {
    const path = `${COL_WBP}/${id}`;
    try {
      await deleteDoc(doc(db, COL_WBP, id));
      await this.recordAuditLog(
        'Hapus WBP',
        'Data Warga Binaan',
        `Menghapus data WBP ${wbpNama} (ID: ${id}) dengan saldo Rp ${saldo.toLocaleString('id-ID')}.`,
        'DANGER'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async bulkImportWbp(
    items: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>[],
    duplicateMode: DuplicateHandlingMode,
    fileName: string = 'Import_Data_WBP.xlsx'
  ): Promise<BulkImportResult> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const details: any[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      // Fetch existing WBP to detect duplicates
      const snap = await getDocs(collection(db, COL_WBP));
      const existingMap = new Map<string, WargaBinaan>();
      snap.forEach((d) => {
        const item = { id: d.id, ...(d.data() as Omit<WargaBinaan, 'id'>) };
        existingMap.set(item.nomorRegistrasi.trim().toUpperCase(), item);
      });

      // Check if CANCEL mode triggered by duplicate
      if (duplicateMode === 'CANCEL') {
        const seenInFile = new Set<string>();
        let hasConflict = false;
        for (const item of items) {
          const regUpper = (item.nomorRegistrasi || '').trim().toUpperCase();
          if (regUpper && (existingMap.has(regUpper) || seenInFile.has(regUpper))) {
            hasConflict = true;
            break;
          }
          if (regUpper) seenInFile.add(regUpper);
        }

        if (hasConflict) {
          return {
            success: false,
            message: 'Import dibatalkan karena terdeteksi nomor registrasi duplikat pada mode penanganan BATALKAN.',
            fileName,
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
          };
        }
      }

      const batch = writeBatch(db);
      let batchCount = 0;

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
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
          continue;
        }

        const regKey = reg.toUpperCase();
        const existingRecord = existingMap.get(regKey);

        if (existingRecord) {
          if (duplicateMode === 'SKIP') {
            skippedCount++;
            details.push({
              nomorRegistrasi: reg,
              nama,
              blokHunian: item.blokHunian || '-',
              statusAksi: 'SKIPPED',
              keterangan: `Dilewati: Nomor registrasi sudah terdaftar atas nama ${existingRecord.nama}.`,
            });
          } else if (duplicateMode === 'UPDATE') {
            const updatedDoc: Record<string, any> = {
              nama,
              nik: item.nik?.trim() || existingRecord.nik || '',
              tempatLahir: item.tempatLahir?.trim() || existingRecord.tempatLahir || '',
              tanggalLahir: item.tanggalLahir || existingRecord.tanggalLahir || '',
              jenisKelamin: item.jenisKelamin || existingRecord.jenisKelamin || '',
              alamat: item.alamat?.trim() || existingRecord.alamat || '',
              blokHunian: item.blokHunian?.trim() || existingRecord.blokHunian || '',
              status: item.status || existingRecord.status || 'Aktif',
              tanggalBebas: item.tanggalBebas || existingRecord.tanggalBebas || '',
              uptTujuan: item.uptTujuan || existingRecord.uptTujuan || '',
              noSkMutasi: item.noSkMutasi || existingRecord.noSkMutasi || '',
              jenisPerkara: item.jenisPerkara || existingRecord.jenisPerkara || '',
              catatan: item.catatan
                ? `${existingRecord.catatan ? existingRecord.catatan + ' | ' : ''}${item.catatan.trim()}`
                : existingRecord.catatan || '',
              updatedAt: new Date().toISOString(),
            };
            batch.update(doc(db, COL_WBP, existingRecord.id), updatedDoc);
            batchCount++;
            updatedCount++;
            details.push({
              nomorRegistrasi: reg,
              nama,
              blokHunian: item.blokHunian || '-',
              statusAksi: 'UPDATED',
              keterangan: 'Berhasil: Data lama diperbarui dari file Excel ke Firestore.',
            });
          }
        } else {
          const newId = `wbp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
          const initialSaldo = typeof item.saldoAwal === 'number' && !isNaN(item.saldoAwal) ? item.saldoAwal : 0;
          const newDoc: WargaBinaan = {
            ...item,
            id: newId,
            nomorRegistrasi: reg,
            nama,
            blokHunian: item.blokHunian?.trim() || 'Blok Mapenaling 01',
            status: item.status || 'Aktif',
            saldoAwal: initialSaldo,
            saldoBerjalan: initialSaldo,
            tanggalMasuk: item.tanggalMasuk || new Date().toISOString().substring(0, 10),
            updatedAt: new Date().toISOString(),
          };
          batch.set(doc(db, COL_WBP, newId), newDoc);
          batchCount++;
          insertedCount++;
          details.push({
            nomorRegistrasi: reg,
            nama,
            blokHunian: newDoc.blokHunian,
            statusAksi: 'INSERTED',
            keterangan: 'Berhasil: Warga binaan baru tersimpan ke Firestore.',
          });
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      await this.recordAuditLog(
        'Import Massal Excel (Firestore)',
        'Import Data',
        `Import file "${fileName}" ke Firestore selesai. Ditambahkan: ${insertedCount}, Diperbarui: ${updatedCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}.`,
        failedCount > 0 ? 'WARNING' : 'SUCCESS'
      );

      return {
        success: true,
        message: `Import berhasil disimpan ke Firestore! ${insertedCount} baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} dilewati, ${failedCount} gagal.`,
        fileName,
        totalRows: items.length,
        insertedCount,
        updatedCount,
        skippedCount,
        failedCount,
        duplicateMode,
        timestamp,
        details,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COL_WBP);
    }
  }

  /**
   * 4. Transaksi Keuangan CRUD Operations
   */
  public async createTransaction(
    trxData: Omit<Transaksi, 'id' | 'waktuPencatatan' | 'saldoSetelahTransaksi'>,
    targetWbp: WargaBinaan
  ): Promise<{ transaction: Transaksi; updatedWbp: WargaBinaan }> {
    if (Number(trxData.nominal) <= 0) {
      throw new Error('Nominal transaksi harus lebih dari Rp 0.');
    }

    if (trxData.jenisTransaksi === 'Uang Keluar' && targetWbp.saldoBerjalan < trxData.nominal) {
      throw new Error(
        `Saldo tidak mencukupi! Saldo saat ini: Rp ${targetWbp.saldoBerjalan.toLocaleString('id-ID')}, nominal yang diminta: Rp ${trxData.nominal.toLocaleString('id-ID')}.`
      );
    }

    const newSaldo =
      trxData.jenisTransaksi === 'Uang Masuk'
        ? targetWbp.saldoBerjalan + trxData.nominal
        : targetWbp.saldoBerjalan - trxData.nominal;

    const trxId = `trx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newTrx: Transaksi = {
      ...trxData,
      id: trxId,
      waktuPencatatan: nowStr,
      saldoSetelahTransaksi: newSaldo,
    };

    const updatedWbp: WargaBinaan = {
      ...targetWbp,
      saldoBerjalan: newSaldo,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Atomic Batch Write: Update transaction and update WBP balance together
      const batch = writeBatch(db);
      batch.set(doc(db, COL_TRX, trxId), newTrx);
      batch.update(doc(db, COL_WBP, targetWbp.id), {
        saldoBerjalan: newSaldo,
        updatedAt: updatedWbp.updatedAt,
      });

      await batch.commit();

      await this.recordAuditLog(
        `Catat ${trxData.jenisTransaksi}`,
        trxData.jenisTransaksi === 'Uang Masuk' ? 'Uang Titipan Masuk' : 'Pembelanjaan Kantin',
        `No: ${newTrx.nomorTransaksi} - ${trxData.namaWbp} nominal Rp ${trxData.nominal.toLocaleString('id-ID')} (${trxData.kategori}). Saldo baru: Rp ${newSaldo.toLocaleString('id-ID')}.`,
        'SUCCESS'
      );

      return { transaction: newTrx, updatedWbp };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COL_TRX}/${trxId}`);
    }
  }

  public async updateTransaction(id: string, updates: Partial<Transaksi>): Promise<void> {
    const path = `${COL_TRX}/${id}`;
    try {
      const payload = {
        ...updates,
        waktuPerubahan: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      delete (payload as any).id;

      await updateDoc(doc(db, COL_TRX, id), payload);
      await this.recordAuditLog(
        'Koreksi Transaksi',
        'Riwayat Transaksi',
        `Koreksi data transaksi ID: ${id}. Bidang diubah: ${Object.keys(updates).join(', ')}.`,
        'WARNING'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async deleteTransaction(trx: Transaksi, targetWbp?: WargaBinaan): Promise<void> {
    const path = `${COL_TRX}/${trx.id}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, COL_TRX, trx.id));

      if (targetWbp) {
        const revertedSaldo =
          trx.jenisTransaksi === 'Uang Masuk'
            ? Math.max(0, targetWbp.saldoBerjalan - trx.nominal)
            : targetWbp.saldoBerjalan + trx.nominal;

        batch.update(doc(db, COL_WBP, targetWbp.id), {
          saldoBerjalan: revertedSaldo,
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();

      await this.recordAuditLog(
        'Hapus Transaksi',
        'Riwayat Transaksi',
        `Menghapus transaksi ${trx.nomorTransaksi} (${trx.jenisTransaksi} Rp ${trx.nominal.toLocaleString('id-ID')}). Saldo WBP ${trx.namaWbp} telah disesuaikan kembali.`,
        'DANGER'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * 5. Settings & Content Operations
   */
  public async updateUptSettings(settings: Partial<UptSettings>): Promise<void> {
    const path = `${COL_SETTINGS}/${DOC_SETTINGS_MAIN}`;
    try {
      await setDoc(doc(db, COL_SETTINGS, DOC_SETTINGS_MAIN), settings, { merge: true });
      await this.recordAuditLog(
        'Ubah Pengaturan UPT',
        'Pengaturan UPT',
        'Memperbarui identitas instansi UPT dan pengaturan portal di Firestore.',
        'INFO'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async updatePortalContent(content: Partial<PublicPortalContent>): Promise<void> {
    const path = `${COL_SETTINGS}/${DOC_SETTINGS_MAIN}`;
    try {
      await setDoc(
        doc(db, COL_SETTINGS, DOC_SETTINGS_MAIN),
        { portalContent: content },
        { merge: true }
      );
      await this.recordAuditLog(
        'Ubah Teks Portal',
        'Pengaturan Portal',
        'Memperbarui pengumuman teks portal transparansi publik di Firestore.',
        'INFO'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async addCategory(nama: string, jenis: 'Uang Masuk' | 'Uang Keluar'): Promise<CategoryItem> {
    const catId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: CategoryItem = { id: catId, nama, jenis };
    const path = `${COL_CATEGORIES}/${catId}`;
    try {
      await setDoc(doc(db, COL_CATEGORIES, catId), newCat);
      return newCat;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * 6. Financial Resets & Tutup Buku
   */
  public async resetSaldo(
    type: 'INDIVIDUAL' | 'ALL_WBP' | 'TITIPAN_MASUK' | 'PEMBELANJAAN',
    wbpId?: string,
    allWbp?: WargaBinaan[],
    allTrx?: Transaksi[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      if (type === 'INDIVIDUAL' && wbpId) {
        batch.update(doc(db, COL_WBP, wbpId), {
          saldoBerjalan: 0,
          updatedAt: new Date().toISOString(),
        });
        await this.recordAuditLog('Reset Saldo Perorangan', 'Status Saldo WBP', `Reset saldo WBP ID: ${wbpId} menjadi Rp 0.`, 'WARNING');
      } else if (type === 'ALL_WBP' && allWbp) {
        for (const w of allWbp) {
          batch.update(doc(db, COL_WBP, w.id), {
            saldoBerjalan: 0,
            updatedAt: new Date().toISOString(),
          });
        }
        await this.recordAuditLog('Reset Seluruh Saldo Titipan', 'Status Saldo WBP', 'Mengosongkan saldo berjalan seluruh WBP.', 'DANGER');
      } else if (type === 'TITIPAN_MASUK' && allTrx) {
        const masukTrx = allTrx.filter((t) => t.jenisTransaksi === 'Uang Masuk');
        for (const t of masukTrx) {
          batch.delete(doc(db, COL_TRX, t.id));
        }
        await this.recordAuditLog('Reset Titipan Masuk', 'Status Saldo WBP', `Menghapus ${masukTrx.length} arsip transaksi titipan masuk.`, 'DANGER');
      } else if (type === 'PEMBELANJAAN' && allTrx) {
        const keluarTrx = allTrx.filter((t) => t.jenisTransaksi === 'Uang Keluar');
        for (const t of keluarTrx) {
          batch.delete(doc(db, COL_TRX, t.id));
        }
        await this.recordAuditLog('Reset Pembelanjaan Kantin', 'Status Saldo WBP', `Menghapus ${keluarTrx.length} arsip transaksi belanja keluar.`, 'DANGER');
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset_saldo');
    }
  }

  public async tutupBuku(payload: {
    periodeNama: string;
    report: LaporanBulanan;
    options: { resetMasuk: boolean; resetKeluar: boolean; resetSaldo: boolean };
    allWbp: WargaBinaan[];
    allTrx: Transaksi[];
  }): Promise<void> {
    const reportPath = `${COL_REPORTS}/${payload.report.id}`;
    try {
      const batch = writeBatch(db);

      // Save monthly report
      batch.set(doc(db, COL_REPORTS, payload.report.id), payload.report);

      // Apply resets if checked
      if (payload.options.resetSaldo) {
        for (const w of payload.allWbp) {
          batch.update(doc(db, COL_WBP, w.id), {
            saldoBerjalan: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (payload.options.resetMasuk) {
        const masuk = payload.allTrx.filter((t) => t.jenisTransaksi === 'Uang Masuk');
        for (const t of masuk) {
          batch.delete(doc(db, COL_TRX, t.id));
        }
      }

      if (payload.options.resetKeluar) {
        const keluar = payload.allTrx.filter((t) => t.jenisTransaksi === 'Uang Keluar');
        for (const t of keluar) {
          batch.delete(doc(db, COL_TRX, t.id));
        }
      }

      await batch.commit();

      await this.recordAuditLog(
        'Tutup Buku Bulanan',
        'Laporan Keuangan',
        `Tutup buku periode ${payload.periodeNama} selesai dan diarsipkan ke Cloud Firestore.`,
        'SUCCESS'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reportPath);
    }
  }

  public async deleteMonthlyReport(id: string): Promise<void> {
    const path = `${COL_REPORTS}/${id}`;
    try {
      await deleteDoc(doc(db, COL_REPORTS, id));
      await this.recordAuditLog('Hapus Arsip Laporan', 'Laporan Keuangan', `Menghapus arsip laporan ID: ${id}.`, 'WARNING');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * 7. Autosave Flush to Firestore (Debounced & 60-Second Engine)
   */
  public async autosavePayload(payload: {
    wbpUpdates?: Partial<WargaBinaan> & { id: string };
    newWbpDraft?: Partial<WargaBinaan>;
    uptSettingsUpdates?: Partial<UptSettings>;
    portalContentUpdates?: Partial<PublicPortalContent>;
  }): Promise<boolean> {
    try {
      if (payload.wbpUpdates && payload.wbpUpdates.id) {
        await this.updateWbp(payload.wbpUpdates.id, payload.wbpUpdates);
      }
      if (payload.newWbpDraft && payload.newWbpDraft.nama && payload.newWbpDraft.nomorRegistrasi) {
        await this.createWbp(payload.newWbpDraft as any);
      }
      if (payload.uptSettingsUpdates) {
        await this.updateUptSettings(payload.uptSettingsUpdates);
      }
      if (payload.portalContentUpdates) {
        await this.updatePortalContent(payload.portalContentUpdates);
      }
      return true;
    } catch (err) {
      console.warn('[Firestore] Autosave draft failure:', err);
      return false;
    }
  }

  /**
   * 8. Audit Trail Logger
   */
  public async recordAuditLog(
    aksi: string,
    modul: string,
    rincian: string,
    tipe: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS' = 'INFO',
    petugasName?: string
  ): Promise<void> {
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const path = `${COL_AUDIT}/${logId}`;
    const logUser = petugasName || auth.currentUser?.email || auth.currentUser?.displayName || 'Administrator Kasir';

    const logEntry: AuditLog = {
      id: logId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      petugas: logUser,
      aksi,
      modul,
      rincian,
      tipe,
    };

    try {
      await setDoc(doc(db, COL_AUDIT, logId), logEntry);
    } catch (err) {
      // Non-blocking log catch
      console.info('[Firestore] Audit log record notice:', err);
    }
  }
}

export const firestoreService = new FirestoreService();

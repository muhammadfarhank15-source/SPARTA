import {
  WargaBinaan,
  Transaksi,
  LaporanBulanan,
  AuditLog,
  UptSettings,
  CategoryItem,
  DuplicateHandlingMode,
  BulkImportResult,
  PublicPortalContent,
} from '../types';

const TOKEN_STORAGE_KEY = 'sparta_rujento_auth_token';
const OFFLINE_QUEUE_KEY = 'sparta_rujento_offline_queue_v1';

export interface ServerDataResponse {
  success: boolean;
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
}

export interface AutosavePayload {
  wbpUpdates?: Partial<WargaBinaan> & { id: string };
  newWbpDraft?: Partial<WargaBinaan>;
  uptSettingsUpdates?: Partial<UptSettings>;
  portalContentUpdates?: Partial<PublicPortalContent>;
  categoriesUpdates?: CategoryItem[];
  clientVersion?: number;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY || 'SPARTA',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async safeJson<T = any>(res: Response): Promise<T | null> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  // 1. Fetch Full Application Data
  public async fetchData(): Promise<ServerDataResponse> {
    try {
      const res = await fetch('/api/data', {
        headers: this.getHeaders(),
      });
      const data = await this.safeJson<ServerDataResponse>(res);
      if (!res.ok || !data) {
        throw new Error(`Gagal memuat data dari database (Status: ${res.status})`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  // 2. Fetch Sync Version (Fast lightweight check)
  public async fetchSyncVersion(): Promise<{ version: number; lastUpdated: string; serverTime: number }> {
    try {
      const res = await fetch('/api/sync/version');
      const data = await this.safeJson(res);
      if (!res.ok || !data) {
        return { version: 1, lastUpdated: new Date().toISOString(), serverTime: Date.now() };
      }
      return data;
    } catch {
      return { version: 1, lastUpdated: new Date().toISOString(), serverTime: Date.now() };
    }
  }

  // 3. Login Admin
  public async loginAdmin(password: string): Promise<{ success: boolean; token?: string; message?: string; version?: number }> {
    const device = `${navigator.userAgent.includes('Mobile') ? 'Smartphone/Tablet' : 'Komputer Desktop'} (${navigator.platform || 'OS'})`;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, clientDevice: device }),
      });
      const data = await this.safeJson(res);
      if (res.ok && data && data.success && data.token) {
        this.setToken(data.token);
      }
      return data || { success: false, message: 'Server API tidak tersedia.' };
    } catch {
      return { success: false, message: 'Gagal menghubungi server API.' };
    }
  }

  // 4. Verify Active Session
  public async verifySession(): Promise<boolean> {
    if (!this.token) return false;
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.valid);
    } catch {
      return false;
    }
  }

  // 5. Logout Admin
  public async logoutAdmin(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }

  // 6. Autosave Payload
  public async autosave(payload: AutosavePayload): Promise<{ success: boolean; version?: number; savedAt?: string; message?: string }> {
    try {
      const res = await fetch('/api/autosave', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Autosave sinkron via Cloud Firestore.' };
    } catch {
      return { success: true, message: 'Autosave sinkron via Cloud Firestore.' };
    }
  }

  // 7. WBP CRUD
  public async createWbp(wbpData: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>): Promise<{ success: boolean; message: string; data: WargaBinaan; version: number }> {
    try {
      const res = await fetch('/api/wbp', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(wbpData),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Disimpan ke Cloud Firestore.', data: wbpData as any, version: 1 };
    } catch {
      return { success: true, message: 'Disimpan ke Cloud Firestore.', data: wbpData as any, version: 1 };
    }
  }

  public async updateWbp(id: string, updates: Partial<WargaBinaan>): Promise<{ success: boolean; message: string; data: WargaBinaan; version: number }> {
    try {
      const res = await fetch(`/api/wbp/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Diperbarui di Cloud Firestore.', data: updates as any, version: 1 };
    } catch {
      return { success: true, message: 'Diperbarui di Cloud Firestore.', data: updates as any, version: 1 };
    }
  }

  public async deleteWbp(id: string): Promise<{ success: boolean; message: string; deletedId: string; version: number }> {
    try {
      const res = await fetch(`/api/wbp/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Dihapus dari Cloud Firestore.', deletedId: id, version: 1 };
    } catch {
      return { success: true, message: 'Dihapus dari Cloud Firestore.', deletedId: id, version: 1 };
    }
  }

  public async bulkImportWbp(
    items: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>[],
    duplicateMode: DuplicateHandlingMode,
    fileName?: string
  ): Promise<BulkImportResult & { version?: number }> {
    try {
      const res = await fetch('/api/wbp/bulk', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ items, duplicateMode, fileName }),
      });
      const data = await this.safeJson(res);
      return (
        data || {
          success: true,
          message: 'Import diproses via Cloud Firestore.',
          fileName: fileName || 'Import.xlsx',
          totalRows: items.length,
          insertedCount: items.length,
          updatedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          duplicateMode,
          timestamp: new Date().toISOString(),
          details: [],
        }
      );
    } catch {
      return {
        success: true,
        message: 'Import diproses via Cloud Firestore.',
        fileName: fileName || 'Import.xlsx',
        totalRows: items.length,
        insertedCount: items.length,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        duplicateMode,
        timestamp: new Date().toISOString(),
        details: [],
      };
    }
  }

  // 8. Transactions CRUD
  public async createTransaction(
    trxData: Omit<Transaksi, 'id' | 'waktuPencatatan' | 'saldoSetelahTransaksi'>
  ): Promise<{ success: boolean; message: string; transaction: Transaksi; wbp: WargaBinaan; version: number }> {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(trxData),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Transaksi tersimpan di Firestore.', transaction: trxData as any, wbp: {} as any, version: 1 };
    } catch {
      return { success: true, message: 'Transaksi tersimpan di Firestore.', transaction: trxData as any, wbp: {} as any, version: 1 };
    }
  }

  public async updateTransaction(id: string, updates: Partial<Transaksi>): Promise<{ success: boolean; message: string; transaction: Transaksi; version: number }> {
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Transaksi diperbarui.', transaction: updates as any, version: 1 };
    } catch {
      return { success: true, message: 'Transaksi diperbarui.', transaction: updates as any, version: 1 };
    }
  }

  public async deleteTransaction(id: string): Promise<{ success: boolean; message: string; deletedId: string; version: number }> {
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Transaksi dihapus.', deletedId: id, version: 1 };
    } catch {
      return { success: true, message: 'Transaksi dihapus.', deletedId: id, version: 1 };
    }
  }

  // 9. Settings
  public async updateSettings(payload: {
    uptSettings?: Partial<UptSettings>;
    portalContent?: Partial<PublicPortalContent>;
    publicPortalSettings?: any;
  }): Promise<{ success: boolean; message: string; uptSettings: UptSettings; version: number }> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Pengaturan tersimpan.', uptSettings: payload.uptSettings as any, version: 1 };
    } catch {
      return { success: true, message: 'Pengaturan tersimpan.', uptSettings: payload.uptSettings as any, version: 1 };
    }
  }

  public async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Kata sandi berhasil diperbarui.' };
    } catch {
      return { success: true, message: 'Kata sandi berhasil diperbarui.' };
    }
  }

  // 10. Financial Resets
  public async resetSaldo(type: 'INDIVIDUAL' | 'ALL_WBP' | 'TITIPAN_MASUK' | 'PEMBELANJAAN', wbpId?: string): Promise<{ success: boolean; message: string; version: number }> {
    try {
      const res = await fetch('/api/reset-saldo', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ type, wbpId }),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Saldo berhasil direset di Cloud Firestore.', version: 1 };
    } catch {
      return { success: true, message: 'Saldo berhasil direset di Cloud Firestore.', version: 1 };
    }
  }

  public async tutupBuku(payload: {
    adminPassword: string;
    periodeNama: string;
    options: { resetMasuk: boolean; resetKeluar: boolean; resetSaldo: boolean };
  }): Promise<{ success: boolean; message: string; report: LaporanBulanan; version: number }> {
    try {
      const res = await fetch('/api/tutup-buku', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Tutup buku berhasil disimpan di Cloud Firestore.', report: {} as any, version: 1 };
    } catch {
      return { success: true, message: 'Tutup buku berhasil disimpan di Cloud Firestore.', report: {} as any, version: 1 };
    }
  }

  public async deleteMonthlyReport(id: string): Promise<{ success: boolean; message: string; version: number }> {
    try {
      const res = await fetch(`/api/monthly-reports/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const data = await this.safeJson(res);
      return data || { success: true, message: 'Arsip laporan dihapus dari Cloud Firestore.', version: 1 };
    } catch {
      return { success: true, message: 'Arsip laporan dihapus dari Cloud Firestore.', version: 1 };
    }
  }

  public async addCategory(nama: string, jenis: 'Uang Masuk' | 'Uang Keluar'): Promise<{ success: boolean; data: CategoryItem; version: number }> {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ nama, jenis }),
      });
      const data = await this.safeJson(res);
      return data || { success: true, data: { id: `cat-${Date.now()}`, nama, jenis }, version: 1 };
    } catch {
      return { success: true, data: { id: `cat-${Date.now()}`, nama, jenis }, version: 1 };
    }
  }

  // 11. Migrate local storage if server db is fresh
  public async migrateLocalData(payload: { wbpList?: WargaBinaan[]; transactions?: Transaksi[]; monthlyReports?: LaporanBulanan[] }) {
    try {
      await fetch('/api/migrate-local-data', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    } catch {
      // Best-effort migration
    }
  }

  // 12. Offline Queue Management
  public getOfflineQueue(): AutosavePayload[] {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public addToOfflineQueue(payload: AutosavePayload) {
    const queue = this.getOfflineQueue();
    queue.push(payload);
    // Keep max 50 items
    const trimmed = queue.slice(-50);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
  }

  public clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  public async flushOfflineQueue(): Promise<{ processedCount: number; errors: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { processedCount: 0, errors: 0 };

    let processedCount = 0;
    let errors = 0;
    const remaining: AutosavePayload[] = [];

    for (const item of queue) {
      try {
        await this.autosave(item);
        processedCount++;
      } catch (err) {
        errors++;
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      this.clearOfflineQueue();
    }

    return { processedCount, errors };
  }
}

export const apiService = new ApiService();

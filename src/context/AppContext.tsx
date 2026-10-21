import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  WargaBinaan,
  Transaksi,
  AuditLog,
  LaporanBulanan,
  UptSettings,
  CategoryItem,
  PublicPortalContent,
  DuplicateHandlingMode,
  BulkImportResult,
  AutosaveState,
} from '../types';
import {
  INITIAL_UPT_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_WBP,
  INITIAL_TRANSACTIONS,
  INITIAL_MONTHLY_REPORTS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_PUBLIC_PORTAL_CONTENT,
} from '../data/initialData';
import { apiService } from '../services/apiService';
import { firestoreService } from '../services/firestoreService';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword } from '../services/firebase';

export type AdminTab =
  | 'dashboard'
  | 'wbp'
  | 'import_excel'
  | 'saldo'
  | 'cek_wbp'
  | 'titipan_masuk'
  | 'pembelanjaan'
  | 'riwayat'
  | 'rincian_keluar'
  | 'laporan'
  | 'teks_portal'
  | 'pengaturan_publik'
  | 'audit'
  | 'pengaturan_upt'
  | 'google_sheets';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation & Auth
  currentPortal: 'landing' | 'public' | 'admin';
  setCurrentPortal: (portal: 'landing' | 'public' | 'admin') => void;
  adminLoggedIn: boolean;
  firebaseUser: User | null;
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
  loginAdmin: (password: string, email?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logoutAdmin: () => Promise<void>;

  // Data States (Loaded from Cloud Firestore in Real-Time)
  wbpList: WargaBinaan[];
  transactions: Transaksi[];
  monthlyReports: LaporanBulanan[];
  auditLogs: AuditLog[];
  uptSettings: UptSettings;
  categories: CategoryItem[];
  isUsingDummyData: boolean;

  // Selected WBP for inspection
  selectedWbpIdForInspection: string | null;
  setSelectedWbpIdForInspection: (id: string | null) => void;

  // Computed Totals
  totalMasuk: number;
  totalKeluar: number;
  totalSaldo: number;
  transaksiBulanIniCount: number;
  pengeluaranBulanIni: number;

  // CRUD Actions (Permanently Synced to Cloud Firestore)
  addWbp: (data: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>) => Promise<boolean>;
  updateWbp: (id: string, updates: Partial<WargaBinaan>) => Promise<boolean>;
  deleteWbp: (id: string) => Promise<boolean>;
  bulkImportWbp: (
    items: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>[],
    duplicateMode: DuplicateHandlingMode,
    fileName?: string
  ) => Promise<BulkImportResult>;

  addTransaction: (
    trx: Omit<Transaksi, 'id' | 'waktuPencatatan' | 'saldoSetelahTransaksi'>
  ) => Promise<{ success: boolean; message: string; transaction?: Transaksi }>;
  updateTransaction: (id: string, updates: Partial<Transaksi>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;

  // Financial Reset actions
  resetTotalTitipanMasuk: () => Promise<void>;
  resetTotalPembelanjaan: () => Promise<void>;
  resetTotalSaldoTitipan: () => Promise<void>;
  resetSaldoIndividualWbp: (wbpId: string) => Promise<void>;
  tutupBukuBulanan: (
    adminPasswordConfirm: string,
    periodeNama: string,
    options: { resetMasuk: boolean; resetKeluar: boolean; resetSaldo: boolean }
  ) => Promise<{ success: boolean; message: string }>;

  deleteMonthlyReport: (id: string) => Promise<void>;

  // Settings & Category
  updateUptSettings: (settings: Partial<UptSettings>) => Promise<void>;
  updatePortalContent: (content: Partial<PublicPortalContent>) => Promise<void>;
  resetPortalContent: () => Promise<void>;
  changeAdminPassword: (
    oldPass: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
  addCategory: (nama: string, jenis: 'Uang Masuk' | 'Uang Keluar') => Promise<void>;

  // Demo Data Reset
  clearAllDummyData: () => Promise<void>;
  loadDummyData: () => Promise<void>;

  // Sync with Google Sheets
  syncWithGoogleSheets: () => Promise<{ success: boolean; message: string }>;

  // --- AUTOSAVE 60-DETIK & STATUS SINKRONISASI ---
  autosaveState: AutosaveState;
  setFormDraft: (formKey: string, draftData: any) => void;
  clearFormDraft: (formKey: string) => void;
  triggerImmediateSave: () => Promise<boolean>;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string;
  databaseVersion: number;
  hasSyncConflict: boolean;
  resolveSyncConflict: (choice: 'reload' | 'override') => Promise<void>;
  refreshDatabase: () => Promise<void>;
  toastNotification: ToastMessage | null;
  setToastNotification: (toast: ToastMessage | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local fallback keys for offline persistence & cache
const STORAGE_KEYS = {
  WBP: 'sparta_rujento_wbp_v1',
  TRX: 'sparta_rujento_trx_v1',
  REPORTS: 'sparta_rujento_reports_v1',
  AUDIT: 'sparta_rujento_audit_v1',
  SETTINGS: 'sparta_rujento_settings_v1',
  CATEGORIES: 'sparta_rujento_categories_v1',
  AUTH: 'sparta_rujento_auth_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPortal, setCurrentPortal] = useState<'landing' | 'public' | 'admin'>('landing');
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [selectedWbpIdForInspection, setSelectedWbpIdForInspection] = useState<string | null>(null);

  // Firestore Live States
  const [wbpList, setWbpList] = useState<WargaBinaan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WBP);
    return saved ? JSON.parse(saved) : INITIAL_WBP;
  });

  const [transactions, setTransactions] = useState<Transaksi[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRX);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [monthlyReports, setMonthlyReports] = useState<LaporanBulanan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_REPORTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [uptSettings, setUptSettings] = useState<UptSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return INITIAL_UPT_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_UPT_SETTINGS,
        ...parsed,
        publicPortalSettings: {
          ...INITIAL_UPT_SETTINGS.publicPortalSettings,
          ...(parsed.publicPortalSettings || {}),
        },
        portalContent: {
          ...DEFAULT_PUBLIC_PORTAL_CONTENT,
          ...(parsed.portalContent || {}),
        },
      };
    } catch {
      return INITIAL_UPT_SETTINGS;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [isUsingDummyData, setIsUsingDummyData] = useState<boolean>(false);
  const [databaseVersion, setDatabaseVersion] = useState<number>(1);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toISOString().substring(11, 19));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasSyncConflict, setHasSyncConflict] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<ToastMessage | null>(null);

  // --- AUTOSAVE 60-DETIK STATE ENGINE ---
  const [autosaveState, setAutosaveState] = useState<AutosaveState>({
    status: 'idle',
    statusText: 'Terhubung ke Cloud Firestore',
    lastSavedAt: null,
    hasUnsavedChanges: false,
    isSaving: false,
    retryCount: 0,
  });

  // Track active uncommitted form drafts
  const [formDrafts, setFormDrafts] = useState<Record<string, any>>({});
  const formDraftsRef = useRef<Record<string, any>>({});
  formDraftsRef.current = formDrafts;

  const hasUnsavedDraftsRef = useRef(false);
  hasUnsavedDraftsRef.current = Object.keys(formDrafts).length > 0;

  const isSavingRef = useRef(false);
  isSavingRef.current = autosaveState.isSaving;

  // Refs for current data snapshot
  const wbpListRef = useRef(wbpList);
  wbpListRef.current = wbpList;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  // Helper: Display Toast Notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastNotification({ type, message });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Cache to LocalStorage for instant zero-latency startup & offline fallback
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WBP, JSON.stringify(wbpList));
  }, [wbpList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRX, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(monthlyReports));
  }, [monthlyReports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(uptSettings));
  }, [uptSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, adminLoggedIn ? 'true' : 'false');
  }, [adminLoggedIn]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setAdminLoggedIn(true);
      }
    });
    return () => unsubAuth();
  }, []);

  // 1. ATTACH CLOUD FIRESTORE REAL-TIME onSnapshot LISTENERS
  useEffect(() => {
    setIsSyncing(true);

    // Initial check & auto-seed to Firestore if empty
    firestoreService
      .seedInitialDataIfEmpty(
        INITIAL_WBP,
        INITIAL_TRANSACTIONS,
        INITIAL_MONTHLY_REPORTS,
        INITIAL_UPT_SETTINGS,
        INITIAL_CATEGORIES
      )
      .then((seeded) => {
        if (seeded) {
          console.log('[Firestore] Data awal berhasil dimigrasikan ke Cloud Firestore.');
        }
      })
      .catch((err) => console.warn('[Firestore] Seed check notice:', err));

    // Subscribe to real-time streams
    const unsubscribeAll = firestoreService.subscribeRealtimeData({
      onWbpChange: (list) => {
        if (list && list.length > 0) {
          setWbpList(list);
          setDatabaseVersion((v) => v + 1);
          setLastSyncTime(new Date().toISOString().substring(11, 19));
        }
      },
      onTrxChange: (list) => {
        setTransactions(list);
        setDatabaseVersion((v) => v + 1);
        setLastSyncTime(new Date().toISOString().substring(11, 19));
      },
      onReportsChange: (list) => {
        setMonthlyReports(list);
      },
      onAuditChange: (list) => {
        setAuditLogs(list);
      },
      onSettingsChange: (settings) => {
        if (settings) {
          setUptSettings((prev) => ({
            ...prev,
            ...settings,
            portalContent: {
              ...DEFAULT_PUBLIC_PORTAL_CONTENT,
              ...(settings.portalContent || {}),
            },
          }));
        }
      },
      onCategoriesChange: (cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      },
      onError: (err) => {
        console.warn('[Firestore Stream] Sync warning:', err.message);
      },
    });

    setIsSyncing(false);

    return () => {
      unsubscribeAll();
    };
  }, []);

  // Online / Offline detection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung. Menyinkronkan perubahan ke Cloud Firestore...', 'info');
      try {
        if (hasUnsavedDraftsRef.current) {
          await triggerImmediateSave();
        }
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutosaveState((prev) => ({
          ...prev,
          status: 'saved',
          statusText: `Tersimpan di Cloud Firestore (${nowTime})`,
          retryCount: 0,
        }));
      } catch (err) {
        console.error('Online sync error:', err);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setAutosaveState((prev) => ({
        ...prev,
        status: 'error',
        statusText: 'Gagal menyimpan — koneksi terputus (data tersimpan di antrean lokal)...',
      }));
      showToast('Koneksi terputus. Data Anda tetap aman dan akan otomatis disinkronkan saat online.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // --- DRAFT REGISTRATION FOR AUTOSAVE ---
  const setFormDraft = useCallback((formKey: string, draftData: any) => {
    setFormDrafts((prev) => ({
      ...prev,
      [formKey]: draftData,
    }));
    setAutosaveState((prev) => ({
      ...prev,
      hasUnsavedChanges: true,
      status: 'unsaved',
      statusText: 'Perubahan belum disimpan',
    }));
  }, []);

  const clearFormDraft = useCallback((formKey: string) => {
    setFormDrafts((prev) => {
      const next = { ...prev };
      delete next[formKey];
      return next;
    });
    setAutosaveState((st) => ({
      ...st,
      hasUnsavedChanges: false,
      status: st.status === 'unsaved' ? 'idle' : st.status,
      statusText: st.status === 'unsaved' ? 'Tersimpan ke Cloud Firestore' : st.statusText,
    }));
  }, []);

  // --- AUTOSAVE ENGINE (FLUSH TO CLOUD FIRESTORE) ---
  const performAutosave = useCallback(async (): Promise<boolean> => {
    const currentDrafts = formDraftsRef.current;
    const draftKeys = Object.keys(currentDrafts);
    if (draftKeys.length === 0) {
      return true;
    }

    if (isSavingRef.current) {
      return false;
    }

    setAutosaveState((prev) => ({
      ...prev,
      isSaving: true,
      status: 'saving',
      statusText: 'Menyimpan otomatis ke Firebase...',
    }));

    try {
      const ok = await firestoreService.autosavePayload({
        wbpUpdates: currentDrafts.wbp_edit,
        newWbpDraft: currentDrafts.wbp_new,
        uptSettingsUpdates: currentDrafts.upt_settings,
        portalContentUpdates: currentDrafts.portal_content,
      });

      apiService.autosave({
        wbpUpdates: currentDrafts.wbp_edit,
        newWbpDraft: currentDrafts.wbp_new,
        uptSettingsUpdates: currentDrafts.upt_settings,
        portalContentUpdates: currentDrafts.portal_content,
      }).catch(() => {});

      if (ok) {
        const nowTime = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setAutosaveState({
          status: 'saved',
          statusText: `Tersimpan otomatis pada ${nowTime}`,
          lastSavedAt: nowTime,
          hasUnsavedChanges: false,
          isSaving: false,
          retryCount: 0,
        });

        setFormDrafts({});
        return true;
      } else {
        throw new Error('Gagal menulis perubahan ke Firestore.');
      }
    } catch (err: unknown) {
      console.warn('Autosave failure to Firestore:', err);

      setAutosaveState((prev) => ({
        ...prev,
        isSaving: false,
        status: 'error',
        statusText: 'Gagal menyimpan — mencoba kembali...',
        retryCount: prev.retryCount + 1,
      }));

      // Retry after 10 seconds
      setTimeout(() => {
        if (hasUnsavedDraftsRef.current && navigator.onLine) {
          performAutosave();
        }
      }, 10000);

      return false;
    }
  }, []);

  const triggerImmediateSave = useCallback(async (): Promise<boolean> => {
    return performAutosave();
  }, [performAutosave]);

  // 60-Second interval for active admin session
  useEffect(() => {
    if (!adminLoggedIn) {
      return;
    }

    const intervalTimer = setInterval(() => {
      if (hasUnsavedDraftsRef.current && !isSavingRef.current) {
        performAutosave();
      }
    }, 60000);

    return () => {
      clearInterval(intervalTimer);
    };
  }, [adminLoggedIn, performAutosave]);

  // Conflict resolution
  const resolveSyncConflict = async (choice: 'reload' | 'override') => {
    if (choice === 'reload') {
      setFormDrafts({});
      setHasSyncConflict(false);
      showToast('Data Cloud Firestore terbaru berhasil dimuat.', 'info');
    } else {
      await performAutosave();
      setHasSyncConflict(false);
      showToast('Perubahan lokal berhasil ditulis ke Cloud Firestore.', 'success');
    }
  };

  // Helper: Refresh database
  const refreshDatabase = useCallback(async () => {
    // Firestore realtime listener automatically keeps state updated
    setLastSyncTime(new Date().toISOString().substring(11, 19));
  }, []);

  // --- AUTHENTICATION ACTIONS ---
  const loginAdmin = async (password: string, email?: string): Promise<boolean> => {
    try {
      // If email provided, attempt Firebase Auth Email/Password login first
      if (email && email.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          setAdminLoggedIn(true);
          setCurrentPortal('admin');
          showToast(`Login berhasil sebagai ${email} melalui Firebase Authentication!`, 'success');
          return true;
        } catch (authErr: any) {
          console.info('Firebase email auth fell back to UPT passcode:', authErr.code);
        }
      }

      // Fallback verification against UPT Admin Password / Backend
      if (password === uptSettings.adminPassword) {
        setAdminLoggedIn(true);
        setCurrentPortal('admin');
        showToast('Login berhasil! Sesi admin aktif terhubung ke Cloud Firestore.', 'success');
        await firestoreService.recordAuditLog(
          'Login Admin UPT',
          'Autentikasi',
          'Admin berhasil masuk menggunakan kredensial UPT terverifikasi.',
          'SUCCESS'
        );
        return true;
      } else {
        // Also try server API fallback if available
        try {
          const res = await apiService.loginAdmin(password);
          if (res && res.success) {
            setAdminLoggedIn(true);
            setCurrentPortal('admin');
            showToast('Login berhasil! Sesi admin aktif.', 'success');
            return true;
          }
        } catch {
          // Non-fatal if server API is unavailable
        }
      }

      showToast('Kata sandi administrator salah!', 'error');
      return false;
    } catch (err: unknown) {
      showToast('Terjadi kesalahan saat verifikasi login.', 'error');
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        setAdminLoggedIn(true);
        setCurrentPortal('admin');
        showToast(`Login berhasil! Selamat datang, ${result.user.displayName || result.user.email}.`, 'success');
        await firestoreService.recordAuditLog(
          'Login Google Firebase Auth',
          'Autentikasi',
          `Petugas masuk via Google Auth: ${result.user.email} (${result.user.uid}).`,
          'SUCCESS',
          result.user.displayName || result.user.email || 'Petugas'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast(`Gagal login dengan Google: ${err.message || 'Jendela ditutup'}`, 'error');
      return false;
    }
  };

  const logoutAdmin = async () => {
    if (hasUnsavedDraftsRef.current) {
      await performAutosave();
    }
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    setAdminLoggedIn(false);
    setFirebaseUser(null);
    setCurrentPortal('landing');
    setFormDrafts({});
    setAutosaveState({
      status: 'idle',
      statusText: 'Sesi ditutup',
      lastSavedAt: null,
      hasUnsavedChanges: false,
      isSaving: false,
      retryCount: 0,
    });
    showToast('Anda telah keluar dari sesi Admin.', 'info');
  };

  // Computed Totals
  const totalMasuk = transactions.reduce((acc, t) => (t.jenisTransaksi === 'Uang Masuk' ? acc + t.nominal : acc), 0);
  const totalKeluar = transactions.reduce((acc, t) => (t.jenisTransaksi === 'Uang Keluar' ? acc + t.nominal : acc), 0);
  const totalSaldo = wbpList.reduce((acc, w) => acc + (w.saldoBerjalan || 0), 0);

  const currentYear = 2026;
  const currentMonth = 10;
  const thisMonthTrx = transactions.filter((t) => {
    const d = new Date(t.tanggal);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const transaksiBulanIniCount = thisMonthTrx.length;
  const pengeluaranBulanIni = thisMonthTrx
    .filter((t) => t.jenisTransaksi === 'Uang Keluar')
    .reduce((acc, t) => acc + t.nominal, 0);

  // --- CRUD WBP (SYNCHRONIZED TO CLOUD FIRESTORE) ---
  const addWbp = async (data: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>): Promise<boolean> => {
    try {
      const created = await firestoreService.createWbp(data);
      if (created) {
        setWbpList((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
        apiService.createWbp(data).catch(() => {});
        showToast(`Warga binaan ${created.nama} berhasil disimpan ke Cloud Firestore.`, 'success');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal menambahkan WBP: ${msg}`, 'error');
      return false;
    }
  };

  const updateWbp = async (id: string, updates: Partial<WargaBinaan>): Promise<boolean> => {
    try {
      setWbpList((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
      await firestoreService.updateWbp(id, updates);
      apiService.updateWbp(id, updates).catch(() => {});
      clearFormDraft('wbp_edit');
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutosaveState((prev) => ({
        ...prev,
        status: 'saved',
        statusText: `Tersimpan pada ${nowTime}`,
        lastSavedAt: nowTime,
        hasUnsavedChanges: false,
      }));
      showToast('Perubahan data WBP berhasil disimpan ke Cloud Firestore.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal memperbarui WBP: ${msg}`, 'error');
      return false;
    }
  };

  const deleteWbp = async (id: string): Promise<boolean> => {
    try {
      const target = wbpList.find((w) => w.id === id);
      setWbpList((prev) => prev.filter((w) => w.id !== id));
      await firestoreService.deleteWbp(id, target?.nama || 'WBP', target?.saldoBerjalan || 0);
      apiService.deleteWbp(id).catch(() => {});
      showToast(`Warga binaan berhasil dihapus dari Cloud Firestore.`, 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal menghapus WBP: ${msg}`, 'error');
      return false;
    }
  };

  const bulkImportWbp = async (
    items: Omit<WargaBinaan, 'id' | 'saldoBerjalan'>[],
    duplicateMode: DuplicateHandlingMode,
    fileName: string = 'Import_Data_WBP.xlsx'
  ): Promise<BulkImportResult> => {
    try {
      const result = await firestoreService.bulkImportWbp(items, duplicateMode, fileName);
      showToast(result.message, result.success ? 'success' : 'warning');
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Gagal import Excel: ${msg}`, 'error');
      return {
        success: false,
        message: msg,
        fileName,
        totalRows: items.length,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: items.length,
        duplicateMode,
        timestamp: new Date().toISOString(),
        details: [],
      };
    }
  };

  // --- CRUD TRANSAKSI (SYNCHRONIZED TO CLOUD FIRESTORE) ---
  const addTransaction = async (
    trxData: Omit<Transaksi, 'id' | 'waktuPencatatan' | 'saldoSetelahTransaksi'>
  ): Promise<{ success: boolean; message: string; transaction?: Transaksi }> => {
    const targetWbp = wbpList.find((w) => w.id === trxData.wbpId);
    if (!targetWbp) {
      showToast('Warga Binaan tidak ditemukan.', 'error');
      return { success: false, message: 'Warga Binaan tidak ditemukan.' };
    }

    try {
      const result = await firestoreService.createTransaction(trxData, targetWbp);
      setTransactions((prev) => [result.transaction, ...prev]);
      setWbpList((prev) => prev.map((w) => (w.id === result.updatedWbp.id ? result.updatedWbp : w)));
      apiService.createTransaction(trxData).catch(() => {});
      showToast(`Transaksi berhasil dibukukan & disimpan ke Cloud Firestore!`, 'success');
      return { success: true, message: 'Transaksi berhasil dibukukan.', transaction: result.transaction };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaksi>): Promise<boolean> => {
    try {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      await firestoreService.updateTransaction(id, updates);
      apiService.updateTransaction(id, updates).catch(() => {});
      showToast('Data transaksi berhasil diperbarui di Cloud Firestore.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    const targetTrx = transactions.find((t) => t.id === id);
    if (!targetTrx) {
      showToast('Transaksi tidak ditemukan.', 'error');
      return false;
    }
    const targetWbp = wbpList.find((w) => w.id === targetTrx.wbpId);

    try {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (targetWbp) {
        const reverted =
          targetTrx.jenisTransaksi === 'Uang Masuk'
            ? Math.max(0, targetWbp.saldoBerjalan - targetTrx.nominal)
            : targetWbp.saldoBerjalan + targetTrx.nominal;
        setWbpList((prev) => prev.map((w) => (w.id === targetWbp.id ? { ...w, saldoBerjalan: reverted } : w)));
      }
      await firestoreService.deleteTransaction(targetTrx, targetWbp);
      apiService.deleteTransaction(id).catch(() => {});
      showToast('Transaksi berhasil dihapus dan saldo telah disesuaikan.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return false;
    }
  };

  // --- RESET ACTIONS ---
  const resetTotalTitipanMasuk = async () => {
    try {
      setTransactions((prev) => prev.filter((t) => t.jenisTransaksi !== 'Uang Masuk'));
      await firestoreService.resetSaldo('TITIPAN_MASUK', undefined, undefined, transactionsRef.current);
      apiService.resetSaldo('TITIPAN_MASUK').catch(() => {});
      showToast('Seluruh arsip titipan masuk berhasil direset di Cloud Firestore.', 'warning');
    } catch (err) {
      showToast('Gagal mereset titipan masuk.', 'error');
    }
  };

  const resetTotalPembelanjaan = async () => {
    try {
      setTransactions((prev) => prev.filter((t) => t.jenisTransaksi !== 'Uang Keluar'));
      await firestoreService.resetSaldo('PEMBELANJAAN', undefined, undefined, transactionsRef.current);
      apiService.resetSaldo('PEMBELANJAAN').catch(() => {});
      showToast('Seluruh data belanja kantin berhasil direset di Cloud Firestore.', 'warning');
    } catch (err) {
      showToast('Gagal mereset pembelanjaan kantin.', 'error');
    }
  };

  const resetTotalSaldoTitipan = async () => {
    try {
      setWbpList((prev) => prev.map((w) => ({ ...w, saldoBerjalan: 0 })));
      await firestoreService.resetSaldo('ALL_WBP', undefined, wbpListRef.current, undefined);
      apiService.resetSaldo('ALL_WBP').catch(() => {});
      showToast('Seluruh saldo WBP berhasil dinolkan di Cloud Firestore.', 'warning');
    } catch (err) {
      showToast('Gagal mereset saldo WBP.', 'error');
    }
  };

  const resetSaldoIndividualWbp = async (wbpId: string) => {
    try {
      setWbpList((prev) => prev.map((w) => (w.id === wbpId ? { ...w, saldoBerjalan: 0 } : w)));
      await firestoreService.resetSaldo('INDIVIDUAL', wbpId);
      apiService.resetSaldo('INDIVIDUAL', wbpId).catch(() => {});
      showToast('Saldo WBP berhasil dinolkan di Cloud Firestore.', 'warning');
    } catch (err) {
      showToast('Gagal mereset saldo WBP.', 'error');
    }
  };

  const tutupBukuBulanan = async (
    adminPasswordConfirm: string,
    periodeNama: string,
    options: { resetMasuk: boolean; resetKeluar: boolean; resetSaldo: boolean }
  ): Promise<{ success: boolean; message: string }> => {
    if (adminPasswordConfirm !== uptSettings.adminPassword) {
      showToast('Konfirmasi kata sandi administrator salah!', 'error');
      return { success: false, message: 'Kata sandi tidak sesuai!' };
    }

    try {
      const repId = `rep-${Date.now()}`;
      const newReport: LaporanBulanan = {
        id: repId,
        periode: periodeNama,
        tahun: 2026,
        bulan: 10,
        status: 'Tutup Buku Diarsipkan',
        jumlahTransaksi: transactions.length,
        totalMasuk,
        totalKeluar,
        saldoAkhir: totalSaldo,
        tanggalTutupBuku: new Date().toISOString().replace('T', ' ').substring(0, 19),
        petugasTutupBuku: uptSettings.bendaharaNama || 'Bendahara Rutan',
      };

      await firestoreService.tutupBuku({
        periodeNama,
        report: newReport,
        options,
        allWbp: wbpListRef.current,
        allTrx: transactionsRef.current,
      });

      setMonthlyReports((prev) => [newReport, ...prev]);
      if (options.resetSaldo) {
        setWbpList((prev) => prev.map((w) => ({ ...w, saldoBerjalan: 0 })));
      }
      if (options.resetMasuk) {
        setTransactions((prev) => prev.filter((t) => t.jenisTransaksi !== 'Uang Masuk'));
      }
      if (options.resetKeluar) {
        setTransactions((prev) => prev.filter((t) => t.jenisTransaksi !== 'Uang Keluar'));
      }

      showToast(`Tutup buku ${periodeNama} berhasil disimpan ke Cloud Firestore!`, 'success');
      return { success: true, message: 'Tutup buku berhasil disimpan ke Cloud Firestore.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const deleteMonthlyReport = async (id: string) => {
    try {
      setMonthlyReports((prev) => prev.filter((r) => r.id !== id));
      await firestoreService.deleteMonthlyReport(id);
      apiService.deleteMonthlyReport(id).catch(() => {});
      showToast('Arsip laporan berhasil dihapus dari Cloud Firestore.', 'success');
    } catch (err) {
      showToast('Gagal menghapus laporan.', 'error');
    }
  };

  // --- SETTINGS & CONTENT ---
  const updateUptSettings = async (settings: Partial<UptSettings>) => {
    try {
      setUptSettings((prev) => ({
        ...prev,
        ...settings,
      }));
      await firestoreService.updateUptSettings(settings);
      apiService.updateSettings({ uptSettings: settings }).catch(() => {});
      clearFormDraft('upt_settings');
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutosaveState((prev) => ({
        ...prev,
        status: 'saved',
        statusText: `Tersimpan pada ${nowTime}`,
        lastSavedAt: nowTime,
        hasUnsavedChanges: false,
      }));
      showToast('Identitas UPT dan logo berhasil disimpan permanen ke Cloud Firestore!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan UPT ke Firestore.', 'error');
    }
  };

  const updatePortalContent = async (content: Partial<PublicPortalContent>) => {
    try {
      setUptSettings((prev) => ({
        ...prev,
        portalContent: {
          ...prev.portalContent,
          ...content,
        },
      }));
      await firestoreService.updatePortalContent(content);
      apiService.updateSettings({ portalContent: content }).catch(() => {});
      clearFormDraft('portal_content');
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutosaveState((prev) => ({
        ...prev,
        status: 'saved',
        statusText: `Tersimpan pada ${nowTime}`,
        lastSavedAt: nowTime,
        hasUnsavedChanges: false,
      }));
      showToast('Teks & pengumuman portal berhasil disimpan permanen ke Cloud Firestore!', 'success');
    } catch (err) {
      showToast('Gagal memperbarui kalimat portal.', 'error');
    }
  };

  const resetPortalContent = async () => {
    await updatePortalContent(DEFAULT_PUBLIC_PORTAL_CONTENT);
  };

  const changeAdminPassword = async (
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    if (oldPass !== uptSettings.adminPassword) {
      showToast('Kata sandi lama tidak sesuai!', 'error');
      return { success: false, message: 'Kata sandi lama salah.' };
    }

    try {
      setUptSettings((prev) => ({ ...prev, adminPassword: newPass }));
      await firestoreService.updateUptSettings({ adminPassword: newPass });
      apiService.changePassword(oldPass, newPass).catch(() => {});
      showToast('Kata sandi administrator berhasil diperbarui di Cloud Firestore!', 'success');
      return { success: true, message: 'Kata sandi berhasil diubah.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const addCategory = async (nama: string, jenis: 'Uang Masuk' | 'Uang Keluar') => {
    try {
      const created = await firestoreService.addCategory(nama, jenis);
      showToast(`Kategori "${created.nama}" berhasil ditambahkan ke Cloud Firestore.`, 'success');
    } catch (err) {
      showToast('Gagal menambahkan kategori.', 'error');
    }
  };

  const clearAllDummyData = async () => {
    try {
      for (const w of wbpList) {
        await firestoreService.deleteWbp(w.id, w.nama, w.saldoBerjalan);
      }
      for (const t of transactions) {
        await firestoreService.deleteTransaction(t);
      }
      setIsUsingDummyData(false);
      showToast('Seluruh data di Cloud Firestore telah dibersihkan.', 'warning');
    } catch (err) {
      showToast('Gagal membersihkan basis data.', 'error');
    }
  };

  const loadDummyData = async () => {
    try {
      await firestoreService.bulkImportWbp(INITIAL_WBP, 'UPDATE', 'Demo_Reset.xlsx');
      setIsUsingDummyData(true);
      showToast('Data percontohan telah dimuat ulang ke Cloud Firestore.', 'info');
    } catch (err) {
      showToast('Gagal memuat ulang data demo.', 'error');
    }
  };

  const syncWithGoogleSheets = async () => {
    if (!uptSettings.googleSheetsUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script Web App belum diatur di menu Pengaturan / Integrasi.',
      };
    }

    try {
      const payload = {
        action: 'SYNC_ALL',
        apiKey: 'SPARTA',
        wargaBinaan: wbpList.map((w) => [
          w.id,
          w.nomorRegistrasi,
          w.nama,
          w.blokHunian,
          w.status,
          w.saldoAwal,
          w.saldoBerjalan,
          w.tanggalMasuk,
          w.tanggalBebas || '',
          w.uptTujuan || '',
          w.noSkMutasi || '',
        ]),
        transaksi: transactions.map((t) => [
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
          t.waktuPencatatan,
        ]),
      };

      await fetch(uptSettings.googleSheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await updateUptSettings({
        syncStatus: 'Tersambung',
        lastSyncTime: nowTime,
      });

      return {
        success: true,
        message: 'Data berhasil disinkronkan ke Google Sheets Anda!',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Gagal menyinkronkan: ${errMsg}. Pastikan URL Web App benar dan diizinkan untuk 'Anyone'.`,
      };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPortal,
        setCurrentPortal,
        adminLoggedIn,
        firebaseUser,
        activeAdminTab,
        setActiveAdminTab,
        loginAdmin,
        loginWithGoogle,
        logoutAdmin,
        wbpList,
        transactions,
        monthlyReports,
        auditLogs,
        uptSettings,
        categories,
        isUsingDummyData,
        selectedWbpIdForInspection,
        setSelectedWbpIdForInspection,
        totalMasuk,
        totalKeluar,
        totalSaldo,
        transaksiBulanIniCount,
        pengeluaranBulanIni,
        addWbp,
        updateWbp,
        deleteWbp,
        bulkImportWbp,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        resetTotalTitipanMasuk,
        resetTotalPembelanjaan,
        resetTotalSaldoTitipan,
        resetSaldoIndividualWbp,
        tutupBukuBulanan,
        deleteMonthlyReport,
        updateUptSettings,
        updatePortalContent,
        resetPortalContent,
        changeAdminPassword,
        addCategory,
        clearAllDummyData,
        loadDummyData,
        syncWithGoogleSheets,
        // Autosave & Permanent Firestore Sync
        autosaveState,
        setFormDraft,
        clearFormDraft,
        triggerImmediateSave,
        isOnline,
        isSyncing,
        lastSyncTime,
        databaseVersion,
        hasSyncConflict,
        resolveSyncConflict,
        refreshDatabase,
        toastNotification,
        setToastNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

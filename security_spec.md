# Security Specification - SPARTA RUJENTO Firestore Security Rules

## 1. Data Invariants
1. Warga Binaan must possess valid non-empty identity fields (`nomorRegistrasi`, `nama`, `blokHunian`, `status`, `saldoBerjalan`, `tanggalMasuk`).
2. Transaksi must strictly link to an existing or valid `wbpId` and `namaWbp`, have positive `nominal`, and have a valid `jenisTransaksi` ('Uang Masuk' or 'Uang Keluar').
3. Public users (non-admins) have read-only access to portal settings, categories, public monthly report summaries, and specific query-constrained lookups for WBP without sensitive internal audit data.
4. Only verified authenticated Admins can perform write operations (create, update, delete) across all financial and management collections.
5. All document IDs must satisfy `isValidId()` matching `^[a-zA-Z0-9_\-]+$` with size <= 128 bytes.
6. Financial mutations must not contain shadow fields or oversized strings.
7. Admin accounts are checked via `/databases/$(database)/documents/admins/$(request.auth.uid)` or bootstrapped runtime email `armal931@guru.smp.belajar.id`.

## 2. The "Dirty Dozen" Attack Payloads (All MUST return PERMISSION_DENIED)
1. **Unauthenticated Write**: An unauthenticated client attempting to add a new WBP document to `/warga_binaan/{wbpId}`.
2. **Unauthenticated Delete**: An unauthenticated client attempting to delete `/transaksi_uang/{trxId}`.
3. **Shadow Field Injection**: An authenticated user injecting unexpected administrative flags like `{ isAdmin: true, shadowRole: 'god' }` into a WBP document.
4. **Id Poisoning Attack**: An attacker creating a document with a 2KB garbage string ID containing path traversal characters `../../`.
5. **Negative Nominal Money Fraud**: A transaction with `nominal: -50000000` to corrupt balance calculations.
6. **Oversized String Buffer Exhaustion**: An attacker submitting a 200KB text payload in `nama` or `keterangan` to exhaust read quotas.
7. **Email Spoofing without Verification**: A forged token claiming `email: armal931@guru.smp.belajar.id` but with `email_verified: false`.
8. **Public Write to Audit Logs**: An unauthenticated or standard user writing spoofed audit entries to `/audit_logs`.
9. **Tampering with UPT Configuration**: An unauthorized client modifying `googleSheetsUrl` or `adminPassword` in `/pengaturan_upt/main`.
10. **Tampering with Admin Privileges**: A non-admin user creating an entry inside `/admins/$(auth.uid)` to self-escalate privileges.
11. **Altering Immutable Fields**: Updating a transaction's historical `nomorTransaksi` or `wbpId` after initial creation.
12. **Blanket Query Scraping**: A client executing unbounded queries on `/audit_logs` without administrative authentication.

# PANDUAN LENGKAP INTEGRASI FIREBASE & DEPLOY KE VERCEL (vercel.app)
## SPARTA RUJENTO - Rutan Kelas IIB Jeneponto

Aplikasi **SPARTA RUJENTO** kini telah terintegrasi penuh dengan **Cloud Firestore** dan **Firebase Authentication** untuk penyimpanan data permanen online dan sinkronisasi real-time antarperangkat (Laptop, HP, Tablet), serta siap di-online-kan menggunakan **Vercel** (`https://nama-aplikasi.vercel.app`).

---

## BAGIAN 1: PENGATURAN FIREBASE CONSOLE

Jika Anda ingin menggunakan proyek Firebase Anda sendiri atau memverifikasi proyek yang telah dibuat:

### 1. Buat Proyek Firebase Baru
1. Buka [Firebase Console](https://console.firebase.google.com/) dan login dengan akun Google Anda.
2. Klik tombol **"Add project"** (Tambah proyek).
3. Beri nama proyek (misalnya: `sparta-rujento-app`), lalu klik **Continue**.
4. Google Analytics dapat diaktifkan atau dinonaktifkan (opsional), lalu klik **Create project**.

### 2. Aktifkan Cloud Firestore Database
1. Di bilah menu kiri Firebase Console, klik **Build** > **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi database (disarankan: `asia-southeast1` / `asia-southeast2` untuk Indonesia).
4. Pada pilihan aturan awal (Security Rules), pilih **Production mode** atau **Test mode**.
5. Klik **Enable** dan tunggu proses pembuatan database selesai.

### 3. Pasang Aturan Keamanan (Firestore Security Rules)
1. Buka tab **Rules** pada menu Firestore Database.
2. Salin seluruh isi berkas `firestore.rules` dari repositori ini.
3. Tempel ke editor aturan Firebase Console, lalu klik **Publish**.
4. Aturan ini memastikan data dapat dibaca oleh publik (Portal Umum / Cek Keluarga WBP) dan hanya dapat diubah oleh Administrator yang terautentikasi.

### 4. Aktifkan Firebase Authentication
1. Di bilah menu kiri, klik **Build** > **Authentication**.
2. Klik **Get started**.
3. Pada tab **Sign-in method**, aktifkan:
   - **Google**: Klik Google, aktifkan tombol *Enable*, pilih Email Dukungan Proyek, lalu klik *Save*.
   - **Email/Password**: Klik Email/Password, aktifkan tombol *Enable*, lalu klik *Save*.
4. Pada tab **Authorized domains**, pastikan menambahkan domain Vercel Anda nanti (misalnya: `sparta-rujento.vercel.app` dan `localhost`).

### 5. Dapatkan Kunci Konfigurasi Web App (Firebase Config)
1. Klik ikon roda gigi (Pengaturan Proyek / Project Settings) di pojok kiri atas.
2. Gulir ke bawah ke bagian **Your apps**, klik ikon Web (`</>`).
3. Daftarkan nama aplikasi web (misalnya: `SPARTA RUJENTO WEB`), lalu klik **Register app**.
4. Firebase akan menampilkan objek konfigurasi seperti:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "sparta-rujento.firebaseapp.com",
     projectId: "sparta-rujento",
     storageBucket: "sparta-rujento.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
5. Simpan nilai-nilai tersebut untuk dimasukkan ke variabel lingkungan Vercel.

---

## BAGIAN 2: DEPLOY APLIKASI KE VERCEL (vercel.app)

### Cara 1: Deploy Melalui GitHub (Sangat Disarankan & Otomatis)

1. **Push Proyek ke GitHub**:
   - Buat repositori baru di GitHub Anda (misalnya `sparta-rujento`).
   - Unggah seluruh kode proyek ke repositori tersebut:
     ```bash
     git add .
     git commit -m "Integrasi Firebase dan konfigurasi Vercel"
     git branch -M main
     git remote add origin https://github.com/USERNAME_ANDA/sparta-rujento.git
     git push -u origin main
     ```

2. **Hubungkan ke Vercel**:
   - Masuk ke dashboard [Vercel](https://vercel.com).
   - Klik **"Add New..."** > pilih **"Project"**.
   - Pilih repositori GitHub Anda tadi lalu klik **"Import"**.

3. **Pengaturan Build & Output**:
   - **Framework Preset**: Pilih **Vite** (otomatis terdeteksi).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Isi Environment Variables di Vercel (Opsional / Otomatis Fallback)**:
   Aplikasi telah dikonfigurasi dengan *Zero-Configuration Fallback* ke `firebase-applet-config.json`. Artinya, aplikasi tetap akan berjalan normal dan terhubung ke Cloud Firestore tanpa mengisi Environment Variables.

   Namun untuk praktik terbaik di Vercel, Anda dapat memasukkan nilai berikut di menu **Environment Variables**:
   - `VITE_FIREBASE_API_KEY`: `AIzaSyAuqOBC1DlkPnyRQR7Fpb-hchKqH4hybwA`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `genial-card-03kqt.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `genial-card-03kqt`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `genial-card-03kqt.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `577719413146`
   - `VITE_FIREBASE_APP_ID`: `1:577719413146:web:0d6e10af5c26e271a6b223`
   - `VITE_FIREBASE_DATABASE_ID`: `ai-studio-remixremixremixr-9d278c0e-ced2-4587-b71a-eae9ffbab2f7`
   - `VITE_API_KEY`: `SPARTA`
   - `API_KEY`: `SPARTA`

5. **Deploy**:
   - Klik tombol **"Deploy"**.
   - Tunggu sekitar 1 menit. Aplikasi langsung online tanpa error di URL seperti:
     `https://sparta-rujento.vercel.app`

---

### Cara 2: Deploy Menggunakan Vercel CLI (Lewat Terminal Komputer)

1. Install Vercel CLI secara global:
   ```bash
   npm install -g vercel
   ```
2. Login ke akun Vercel:
   ```bash
   vercel login
   ```
3. Deploy langsung ke production:
   ```bash
   vercel --prod
   ```

---

## BAGIAN 3: FITUR UTAMA SETELAH INTEGRASI FIREBASE

1. **Sinkronisasi Real-Time**:
   - Setiap transaksi baru, mutasi saldo WBP, atau perubahan teks portal langsung tersinkronkan ke semua perangkat yang membuka aplikasi tanpa perlu me-refresh halaman berkat listener `onSnapshot()`.
2. **Auto-Save 60 Detik**:
   - Perubahan form yang belum disimpan akan otomatis disimpan ke Cloud Firestore setiap 60 detik atau seketika saat tombol Simpan ditekan.
3. **Penyimpanan Offline & Re-sync**:
   - Jika koneksi terputus, aplikasi menandai status *Offline Mode* dan mempertahankan data. Begitu koneksi online kembali, antrean data otomatis terkirim.
4. **Login Admin Ganda**:
   - Admin dapat login menggunakan **Akun Google resmi (Firebase Auth)** atau menggunakan **Kredensial Petugas UPT**.
5. **Portal Transparansi Publik Aman**:
   - Pihak keluarga dapat memeriksa saldo dan status WBP secara aman tanpa perlu login, sementara data audit log dan pengaturan UPT terlindungi oleh Firebase Security Rules.

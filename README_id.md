<p align="center"><img src="./assets/banner.png" alt="BrowserTranslate — terjemahan browser yang mengutamakan privasi" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Baca halaman dan subtitel dengan model pilihan Anda.</strong><br>Sumber terbuka · Kunci API sendiri · Tanpa server perantara · Tanpa telemetri</p>
<p align="center">
  <a href="./README.md"><kbd>English</kbd></a>
  <a href="./README_zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./README_zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./README_ja.md"><kbd>日本語</kbd></a>
  <a href="./README_ko.md"><kbd>한국어</kbd></a>
  <a href="./README_es.md"><kbd>Español</kbd></a>
  <a href="./README_fr.md"><kbd>Français</kbd></a><br>
  <a href="./README_de.md"><kbd>Deutsch</kbd></a>
  <a href="./README_pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./README_it.md"><kbd>Italiano</kbd></a>
  <a href="./README_ru.md"><kbd>Русский</kbd></a>
  <a href="./README_tr.md"><kbd>Türkçe</kbd></a>
  <a href="./README_vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./README_id.md"><kbd><b>Bahasa Indonesia</b></kbd></a>
</p>
<p align="center"><a href="#installation">Instalasi</a> · <a href="#configuration">Konfigurasi</a> · <a href="./CHANGELOG.md">Perubahan</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Laporkan masalah</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Rilis terbaru"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Mengapa BrowserTranslate?

Gunakan penyedia pilihan Anda tanpa langganan wajib ke ekstensi ini atau server perantara yang dioperasikan proyek.

- **Model dan kunci Anda:** hubungkan endpoint yang kompatibel dengan OpenAI atau lingkungan lokal. Kompatibilitas bergantung pada endpoint dan model.
- **Koneksi langsung:** teks dikirim dari browser ke penyedia yang dipilih. Proyek tidak mengoperasikan server relay.
- **Tanpa telemetri:** ekstensi tidak mengumpulkan analitik, laporan kesalahan jarak jauh, atau log jarak jauh.
- **Prompt dasar dapat diedit:** lihat bawaan, buat templat sendiri, dan gunakan satu dasar untuk seluruh mode LLM. Aturan internal kamus dan format keluaran tetap dikelola ekstensi.

<a id="features"></a>
## Fitur

- **Mulai tanpa kunci API:** Microsoft dan Google aktif sejak awal; instalasi baru memakai Microsoft untuk ketiga mode. Keduanya menggunakan endpoint publik tidak resmi: baca [pemberitahuan layanan gratis](#free-engines).
- **Mesin terpisah per tugas:** kartu seleksi, halaman penuh, dan subtitel dapat menggunakan penyedia berbeda. Simpan beberapa konfigurasi tanpa mengisinya kembali saat beralih.
- **Terjemahan teks terpilih:** pilih teks lalu klik ikon mengambang, atau gunakan mode pintasan. Teks biasa tampil secara streaming dengan sumber di atasnya. Kartu menyediakan salin, terjemahkan lagi, serta pilihan penyedia dan bahasa sementara. Pilihan ini tidak mengubah pengaturan global; terjemahkan lagi melewati cache.
- **Kartu stabil dan dapat dipindah:** atur ukuran di Umum → Tampilan. Sumber dan terjemahan bergulir sendiri; sumber menggunakan paling banyak 30% area isi bersama. Saat menunggu, tampilannya ringkas. Sematkan agar tidak tertutup ketika menggulir atau mengeklik di luar, lalu seret pegangannya untuk memindahkan.
- **Halaman dwibahasa:** menyisipkan terjemahan di bawah sumber pada isi utama, umumnya mengecualikan navigasi, header, dan footer. Pemrosesan mengikuti area tampilan saat Anda menggulir. Gunakan Halaman saat ini → Terjemahan dwibahasa di popup atau **Alt+A** dalam mode pintasan.
- **Kamus untuk pilihan pendek:** model dapat memberi terjemahan, pelafalan, kelas kata, arti, dan contoh. Paragraf yang jelas, teks multibaris, dan pilihan mirip kode hanya diterjemahkan. Layanan biasa tidak menghasilkan entri kamus.
- **Teks campuran diperbolehkan:** bahasa sumber yang sama dengan tujuan tidak menghalangi permintaan. Penyesuaian regional bergantung pada model atau layanan.
- **Pengaturan dan cache lokal:** masa berlaku dapat diatur di Pengaturan → Data. Ekspor/impor konfigurasi dan prompt dalam JSON; cache tidak disertakan dan kunci API hanya ikut jika diminta secara eksplisit.
- **Antarmuka ringkas:** tema terang/gelap otomatis atau manual, dengan lima halaman: Umum, Terjemahan, Penyedia, Subtitel, Data. Antarmuka memakai font sistem; kode dan endpoint memakai font monospace.

<a id="subtitles"></a>
### Subtitel video

Menerjemahkan subtitel yang sudah tersedia di **YouTube**, **rekaman cloud Zoom**, **rekaman kursus Canvas**, dan pemutar kompatibel yang menyediakan subtitel melalui `<track>`/TextTrack. Dukungan bergantung pada pemutar dan akses ke trek; tidak semua pemutar tertanam telah diuji. **Tidak melakukan transkripsi audio.**

Klik ikon terjemahan pada pemutar lalu aktifkan subtitel terjemahan. Jika tidak ada bilah kontrol yang sesuai, tombol muncul di sudut video. Di YouTube, aktifkan subtitel asli (CC) terlebih dahulu agar trek dimuat; pemutar lain mungkin juga perlu mengaktifkan treknya. Trek buatan kreator dan subtitel otomatis yang didukung dapat digunakan; potongan ASR bergulir digabungkan menjadi kalimat sebelum diterjemahkan.

Sumber dan terjemahan ditampilkan di atas video dan dapat diseret melalui pegangan. Posisi diingat, termasuk pada layar penuh, dan menyesuaikan agar tidak menutupi kontrol yang terlihat. Terjemahan memprioritaskan teks di sekitar posisi pemutaran dan dijadwalkan ulang setelah berpindah waktu. Label pembicara yang dikenali dipertahankan apa adanya. Latensi bergantung pada video dan penyedia, tanpa jaminan waktu respons tetap.

Menu pemutar dan **Pengaturan → Subtitel** mengatur tampilan dwibahasa/hanya sumber/hanya terjemahan, urutan, opasitas latar, serta ukuran, warna, font, dan ketebalan tiap baris. Halaman pengaturan menyediakan pratinjau langsung, nilai angka presisi, palet kecil, input HEX, dan tombol atur ulang.

<a id="languages"></a>
### Bahasa

**56 tujuan terjemahan** terpisah dari **14 bahasa antarmuka** yang ditautkan di atas. Antarmuka dapat mengikuti bahasa browser. Popup, pengaturan, dan kartu dapat mencari nama asli, nama Inggris atau lokal, kode bahasa, dan sebutan varian Inggris. Nama RTL mempertahankan arah bacanya tanpa menggeser seluruh baris menu.

Bahasa Inggris dibedakan menjadi **Amerika Serikat, Britania Raya, dan Australia**; pengaturan umum `en` lama dipindahkan ke Inggris Amerika. Bahasa Tionghoa dibedakan menjadi **aksara sederhana dan tradisional**. LLM menerima instruksi ejaan dan kosakata regional. Jika layanan gratis tidak mendukung varian, layanan memakai Inggris umum secara diam-diam tanpa mengganti penyedia.

<a id="architecture"></a>
## Arsitektur

<p align="center"><img src="./assets/framework.png" alt="Arsitektur BrowserTranslate dan koneksi langsung ke penyedia" width="760"></p>

Permintaan LLM dan terjemahan mesin berjalan melalui **service worker latar belakang**. JavaScript situs tidak menerima kunci API Anda. Skrip konten menampilkan hasil dan mengintegrasikan halaman/pemutar; pengambilan subtitel khusus situs juga bisa berjalan dalam konteks konten atau halaman. Tidak ada relay milik proyek.

<a id="installation"></a>
## Instalasi

Untuk **browser desktop berbasis Chromium**, termasuk Chrome, Edge, Brave, dan Arc. Firefox belum didukung.

1. Unduh `.zip` terbaru dari [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Ekstrak ke folder yang akan tetap disimpan.
3. Buka `chrome://extensions` atau pengelola ekstensi, aktifkan **Mode developer**, pilih **Muat yang belum dipaketkan**, lalu tentukan folder tersebut.

### Pembaruan manual

Ekstensi yang belum dipaketkan tidak diperbarui otomatis. Ekstrak arsip baru di atas folder lama, tekan **Muat ulang** pada halaman ekstensi, lalu segarkan halaman web yang terbuka. Di Windows/macOS, instalasi terkelola untuk ekstensi yang dihosting sendiri biasanya memerlukan kebijakan perusahaan; memuat folder hasil ekstraksi adalah prosedur berbeda.

Header pengaturan menampilkan versi dan pemeriksaan manual. GitHub hanya dihubungi ketika tombol ditekan; jika versi lebih baru tersedia, arsip ditawarkan tanpa dipasang otomatis. Popup tidak mengulang nomor versi.

<a id="configuration"></a>
## Konfigurasi

Instalasi baru menggunakan Microsoft pada semua mode. Untuk memakai model sendiri:

1. Buka popup dan ikon pengaturan.
2. Di **Penyedia**, aktifkan layanan lalu isi endpoint, model, dan kunci API. Lingkungan lokal tidak memerlukan kunci. Baris aktif menampilkan status/latensi melalui pemeriksaan yang menghubungi penyedia.
3. Di **Terjemahan → Mesin terjemahan**, atur secara terpisah seleksi, seluruh halaman, dan subtitel.
4. Pilih bahasa tujuan dan teks pada halaman yang didukung. Untuk papan ketik, aktifkan mode pintasan di **Umum**: **Alt+T** untuk seleksi dan **Alt+A** untuk seluruh halaman. Keduanya hanya berlaku dalam mode tersebut.

Popup berisi bahasa tujuan, sakelar halaman saat ini, dan mesin. Mode pemicu serta pintasan hanya ada dalam pengaturan. Halaman yang tidak didukung menonaktifkan terjemahan; skrip konten yang belum tersedia memunculkan petunjuk untuk memuat ulang. Prompt dan penugasan berada di Terjemahan, kredensial di Penyedia, tampilan subtitel di Subtitel, serta cache/impor/ekspor di Data.

### Penyedia dan penalaran

Prasetel mencakup **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. Lingkungan lokal mencakup **LM Studio, Ollama, llama.cpp, vLLM**. Layanan kompatibel lain dapat memakai endpoint khusus.

Endpoint memisahkan wilayah dan paket, misalnya opencode Zen/Go; Qwen di Beijing, Singapura, Hong Kong, Virginia, serta Token Plan. Akun, kunci, dan katalog model belum tentu dapat dipertukarkan. Penyedia yang mendukung juga mengizinkan URL workspace khusus.

Jika didukung, ekstensi meminta penalaran dinonaktifkan secara bawaan dan menawarkan **Low / Medium / High / XHigh / Max**, dipetakan ke parameter penyedia. Untuk server khusus/lokal, pilih format parameter atau **Jangan kirim apa pun**. Jika tidak ada kontrol yang didukung dikirim, setelan server berlaku. Dukungan, latensi, dan biaya token penalaran bergantung pada endpoint/model, bukan hanya pengaturan antarmuka.

<a id="prompts"></a>
### Prompt dasar

Di **Terjemahan → Prompt dasar**, pustaka templat berada di samping editor, atau di atasnya pada jendela sempit. Bawaan terlihat tetapi hanya baca. **Baru** dapat memulai dari bawaan atau dari kosong. Panduan ada di dalam kartu, di bawah editor. Memilih templat hanya membukanya; prompt yang sedang dipakai ditandai terpisah.

- **Simpan dan terapkan** menyimpan draf sekaligus menggunakannya.
- **Simpan perubahan** memperbarui prompt yang sedang dipakai.
- **Terapkan prompt** memakai templat tersimpan; dinonaktifkan jika sudah dipakai.
- **Batal** membuang edit lokal.
- **Tindakan templat** memuat simpan tanpa menerapkan, duplikasi, penggantian draf dengan teks bawaan, dan penghapusan. Penggantian/penghapusan destruktif memerlukan konfirmasi; menghapus templat aktif mengembalikan bawaan.

Instruksi sendiri **menggantikan**, bukan menambahkan ke, prompt bawaan. Ekstensi tetap memasok bahasa, konvensi regional, perutean, dan format; protokol internal tidak dapat diedit. Instruksi bertentangan atau model yang kurang mampu dapat menghasilkan jawaban tidak sempurna. `{{...}}` dipertahankan sebagai teks, tanpa substitusi variabel.

Simpan hingga **20 templat khusus**, masing-masing **12.000 karakter** instruksi, secara lokal. Hanya berpengaruh pada LLM, bukan Microsoft/Google biasa. Perubahan memakai cache terpisah; ekspor mencakup templat dan pilihan aktif.

<a id="validation"></a>
### Validasi respons

Bagian teks yang jelas panjang tidak menerima instruksi kamus. Pada seleksi pendek, entri harus sesuai dengan seluruh pilihan, bukan hanya kata yang diambil dari dalamnya. Keluaran terstruktur yang mencurigakan ditahan untuk validasi; kartu menerima tipe hasil eksplisit, bukan menebak dari `{`.

Respons seleksi tidak valid mendapat paling banyak **satu permintaan koreksi teks biasa**. Batch halaman/subtitel yang tidak valid beralih ke **satu permintaan teks untuk setiap segmen yang belum tersimpan di cache**. Ini dapat memakai token tambahan; pengulangan jaringan dihitung terpisah. Kegagalan format berulang menampilkan pesan kesalahan, bukan JSON protokol mentah, dan tidak disimpan.

ID batch harus lengkap dan unik; hasil dikembalikan ke urutan masukan. Angka atau objek tidak dipaksa menjadi string terjemahan. Kunci cache berdasarkan protokol dan validasi saat membaca mengisolasi hasil LLM lama yang belum diperiksa. Struktur dalam sumber asli tetap dapat diterjemahkan sebagai teks.

**Validasi format tidak menjamin ketepatan makna atau mendeteksi semua bagian yang terlewat.** Label bahasa adalah petunjuk tampilan lokal dengan penandaan konservatif untuk tulisan campuran; tidak memblokir atau menentukan rute permintaan.

<a id="free-engines"></a>
### Layanan gratis

Microsoft dan Google menggunakan `edge.microsoft.com` dan `translate-pa.googleapis.com`.

- **Bukan API resmi:** endpoint melayani fitur terjemahan web/browser perusahaan, tanpa kontrak publik untuk ekstensi ini.
- **Tanpa afiliasi atau dukungan resmi:** proyek tidak berafiliasi, disponsori, atau disetujui Microsoft/Google. Nama dan merek milik pemegangnya serta hanya mengidentifikasi layanan.
- **Ketersediaan tidak dijamin:** endpoint dapat berubah atau berhenti tanpa pemberitahuan. Anda bisa beralih ke model sendiri, yang ketersediaannya juga bergantung pada penyedia.
- **Teks dikirim ke layanan:** syarat dan kebijakan privasi layanan berlaku. Untuk konten sensitif, pilih endpoint sendiri yang sesuai.
- **Tanpa jaminan:** disediakan apa adanya dan digunakan dengan risiko Anda. Untuk penggunaan komersial atau volume besar, pilih API resmi berlisensi.

Microsoft dipilih agar instalasi pertama langsung bermanfaat. Menetapkan suatu mode ke model Anda menghentikan penggunaan endpoint publik ini untuk mode tersebut.

<a id="privacy"></a>
## Privasi dan data lokal

Tanpa perantara dan telemetri **bukan berarti semua pemrosesan lokal**. Penyedia cloud menerima teks yang diminta diterjemahkan; lingkungan lokal dapat mempertahankan pemrosesan model di komputer. Pengambilan subtitel menghubungi situs video, pemeriksaan manual menghubungi GitHub. Layanan menerima metadata jaringan biasa seperti alamat IP.

Pengaturan, kunci API, dan cache disimpan di `chrome.storage.local`. **Ekstensi tidak mengenkripsi kunci API.** Ekspor mengecualikannya secara bawaan; menyertakan kunci menghasilkan berkas teks biasa yang harus dijaga. Cache tidak diekspor dan tidak ada riwayat terjemahan yang dapat ditelusuri.

<a id="development"></a>
## Pengembangan

```bash
pnpm install
pnpm dev          # Build pemantauan: .output/chrome-mv3-dev/
pnpm test         # Pengujian dalam mode pemantauan
pnpm test:run     # Satu kali pengujian
pnpm typecheck    # Pembuatan tipe WXT + TypeScript
pnpm lint
pnpm build        # Produksi: .output/chrome-mv3/
```

Muat folder keluaran sebagai ekstensi yang belum dipaketkan. Muat ulang ekstensi dan halaman setelah mengganti build. Lihat [CHANGELOG.md](./CHANGELOG.md), dan kirim masalah atau saran melalui [Issues](https://github.com/Lewen-Cai/browser-translate/issues). Hapus kunci API dan isi halaman pribadi dari laporan.

<a id="acknowledgements"></a>
## Ucapan terima kasih

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; proyek luar biasa yang banyak kami pelajari selama pengembangan.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logo penyedia. Merek tetap milik pemegangnya dan hanya digunakan untuk identifikasi.

<a id="license"></a>
## Lisensi

[GPL-3.0](./LICENSE). Karya turunan yang didistribusikan harus memenuhi kewajiban kode sumber dan lisensi. Aset pihak ketiga mempertahankan lisensinya masing-masing.

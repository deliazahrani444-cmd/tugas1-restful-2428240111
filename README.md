# Tugas 1 — RESTful API Murni dengan Express.js (SI5B)

| | |
|---|---|
| **Nama** | Delia Zahrani |
| **NIM** | NIM_ANDA |
| **Kelas** | SI5B |
| **Nomor Topik** | 31 — Puskesmas: Jadwal Vaksinasi |
| **Resource** | `/vaccinations` |
| **Link Vercel** | https://tugas1-restful-NIM.vercel.app |
| **Link GitHub** | https://github.com/USERNAME_GITHUB/tugas1-restful-NIM |

## Cara Menjalankan Lokal

```bash
git clone https://github.com/USERNAME_GITHUB/tugas1-restful-NIM.git
cd tugas1-restful-NIM
npm install
npm start        # atau: npm run dev (memakai nodemon)
```

Server berjalan di `http://localhost:3000`.

## Struktur Data (`*` = wajib)

| Field | Tipe |
|---|---|
| `id` | number (otomatis dari server) |
| `namaPasien`* | string |
| `nik`* | string |
| `jenisVaksin`* | string |
| `dosisKe`* | number (> 0) |
| `tanggal`* | string `YYYY-MM-DD` |

## Daftar Endpoint

| No | Method | Endpoint | Fungsi | Status sukses | Status gagal |
|---|---|---|---|---|---|
| 0 | GET | `/` | Info API (JSON) | 200 | — |
| 1 | GET | `/vaccinations` | Ambil semua data | 200 | — |
| 2 | GET | `/vaccinations/:id` | Ambil satu data | 200 | 404 |
| 3 | POST | `/vaccinations` | Tambah data baru | 201 | 400 |
| 4 | PUT | `/vaccinations/:id` | Ubah seluruh data | 200 | 400 / 404 |
| 5 | DELETE | `/vaccinations/:id` | Hapus data | 200 | 404 |
| 6 | GET | `/vaccinations?jenisVaksin=Hepatitis B` | Filter (query string) | 200 | — |

Route yang tidak terdaftar → `404` JSON `"Endpoint tidak ditemukan"`.

## Contoh Request Body (POST / PUT)

```json
{
  "namaPasien": "Rudi Santoso",
  "nik": "1671010101010001",
  "jenisVaksin": "Hepatitis B",
  "dosisKe": 2,
  "tanggal": "2026-10-03"
}
```

## Format Response

GET (data langsung):

```json
{ "id": 1, "namaPasien": "Rudi Santoso", "nik": "1671010101010001", "jenisVaksin": "Hepatitis B", "dosisKe": 2, "tanggal": "2026-10-03" }
```

POST / PUT / DELETE / error:

```json
{ "status": "success", "message": "Data berhasil ditambahkan", "data": { } }
```

```json
{ "status": "error", "message": "Data dengan id 99 tidak ditemukan", "data": null }
```

> Data disimpan di array memori. Di Vercel (serverless) data dapat kembali ke data awal setelah beberapa saat.

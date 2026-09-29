// ============================================================
// Tugas 1 - RESTful API Murni dengan Express.js (SI5B)
// Nama   : Delia Zahrani
// NIM    : NIM_ANDA   <-- ganti dengan NIM asli
// Topik  : 31 - Puskesmas: Jadwal Vaksinasi
// Resource: /vaccinations
// ============================================================

// impor express
const express = require("express");
const app = express();

// middleware agar body JSON (Content-Type: application/json) terbaca di req.body
app.use(express.json());

// ------------------------------------------------------------
// DATA AWAL (disimpan di array memori, tanpa database)
// Field wajib (*): namaPasien, nik, jenisVaksin, dosisKe, tanggal
// ------------------------------------------------------------
const vaccinations = [
  {
    id: 1,
    namaPasien: "Rudi Santoso",
    nik: "1671010101010001",
    jenisVaksin: "Hepatitis B",
    dosisKe: 2,
    tanggal: "2026-10-03",
  },
  {
    id: 2,
    namaPasien: "Siti Aminah",
    nik: "1671010202020002",
    jenisVaksin: "Influenza",
    dosisKe: 1,
    tanggal: "2026-10-05",
  },
  {
    id: 3,
    namaPasien: "Budi Hartono",
    nik: "1671010303030003",
    jenisVaksin: "Hepatitis B",
    dosisKe: 1,
    tanggal: "2026-10-07",
  },
  {
    id: 4,
    namaPasien: "Maya Lestari",
    nik: "1671010404040004",
    jenisVaksin: "Tetanus",
    dosisKe: 3,
    tanggal: "2026-10-09",
  },
];

// id berikutnya (dibuat otomatis oleh server, bertambah terus)
let nextId = 5;

// ------------------------------------------------------------
// FUNGSI BANTU
// ------------------------------------------------------------

// membuat response JSON berformat { status, message, data }
function kirim(res, kodeStatus, status, message, data) {
  return res.status(kodeStatus).json({ status, message, data });
}

// validasi field wajib POST/PUT; mengembalikan pesan error, atau null jika valid
function validasi(body) {
  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = body || {};

  // field bertipe string: tidak boleh kosong / hanya spasi
  const fieldString = { namaPasien, nik, jenisVaksin, tanggal };
  for (const [nama, nilai] of Object.entries(fieldString)) {
    if (nilai === undefined || nilai === null || String(nilai).trim() === "") {
      return `Field ${nama} wajib diisi`;
    }
    if (typeof nilai !== "string") {
      return `Field ${nama} harus berupa string`;
    }
  }

  // dosisKe: wajib diisi, bertipe number, dan lebih dari 0
  if (dosisKe === undefined || dosisKe === null || dosisKe === "") {
    return "Field dosisKe wajib diisi";
  }
  if (typeof dosisKe !== "number" || !Number.isFinite(dosisKe) || dosisKe < 1) {
    return "Field dosisKe harus berupa angka lebih dari 0";
  }

  // tanggal: format YYYY-MM-DD dan benar-benar tanggal yang valid
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal.trim())) {
    return "Field tanggal harus berformat YYYY-MM-DD";
  }
  const cek = new Date(tanggal.trim() + "T00:00:00Z");
  if (Number.isNaN(cek.getTime()) || cek.toISOString().slice(0, 10) !== tanggal.trim()) {
    return "Field tanggal bukan tanggal yang valid";
  }

  return null;
}

// ------------------------------------------------------------
// JALANKAN SERVER
// app.listen() hanya di lokal; di Vercel app di-export (serverless)
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;

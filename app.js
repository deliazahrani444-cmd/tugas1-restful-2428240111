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
// ROUTE 0: GET /  -> info API dalam JSON
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    nama: "Delia Zahrani",
    nim: "NIM_ANDA",
    kelas: "SI5B",
    topik: 31,
    namaTopik: "Puskesmas - Jadwal Vaksinasi",
    resource: "/vaccinations",
    endpoint: [
      "GET /",
      "GET /vaccinations",
      "GET /vaccinations/:id",
      "POST /vaccinations",
      "PUT /vaccinations/:id",
      "DELETE /vaccinations/:id",
      "GET /vaccinations?jenisVaksin=Hepatitis B",
    ],
  });
});

// ------------------------------------------------------------
// ROUTE 1 & 6: GET /vaccinations
// Ambil semua data, atau filter dengan query string
// Contoh: GET /vaccinations?jenisVaksin=Hepatitis B
// ------------------------------------------------------------
app.get("/vaccinations", (req, res) => {
  const { jenisVaksin } = req.query; // filter dari query string

  // tanpa filter -> kembalikan semua data (array langsung)
  if (jenisVaksin === undefined) {
    return res.status(200).json(vaccinations);
  }

  // dengan filter -> array hasil filter (boleh kosong []), tidak membedakan huruf besar/kecil
  const hasil = vaccinations.filter(
    (v) => v.jenisVaksin.toLowerCase() === String(jenisVaksin).trim().toLowerCase()
  );
  res.status(200).json(hasil);
});

// ------------------------------------------------------------
// ROUTE 2: GET /vaccinations/:id
// Ambil satu data berdasarkan id
// ------------------------------------------------------------
app.get("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id); // id dari route parameter
  const data = vaccinations.find((v) => v.id === id);

  // id tidak ada -> 404
  if (!data) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }

  // berhasil -> objek langsung (tanpa status/message)
  res.status(200).json(data);
});

// ------------------------------------------------------------
// ROUTE 3: POST /vaccinations
// Tambah data baru
// Body: { "namaPasien": "Rudi Santoso", "nik": "1671010101010001",
//         "jenisVaksin": "Hepatitis B", "dosisKe": 2, "tanggal": "2026-10-03" }
// ------------------------------------------------------------
app.post("/vaccinations", (req, res) => {
  // validasi semua field wajib -> gagal: 400
  const pesanError = validasi(req.body);
  if (pesanError) {
    return kirim(res, 400, "error", pesanError, null);
  }

  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = req.body;

  // id dibuat otomatis (nextId), tidak diambil dari body
  const baru = {
    id: nextId++,
    namaPasien: namaPasien.trim(),
    nik: nik.trim(),
    jenisVaksin: jenisVaksin.trim(),
    dosisKe,
    tanggal: tanggal.trim(),
  };
  vaccinations.push(baru);

  // berhasil -> 201 + data yang baru dibuat
  kirim(res, 201, "success", "Data berhasil ditambahkan", baru);
});

// ------------------------------------------------------------
// ROUTE 4: PUT /vaccinations/:id
// Ganti SELURUH data (penggantian penuh), semua field wajib dikirim
// Body: { "namaPasien": "Rudi Santoso", "nik": "1671010101010001",
//         "jenisVaksin": "Hepatitis B", "dosisKe": 3, "tanggal": "2026-11-03" }
// ------------------------------------------------------------
app.put("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = vaccinations.findIndex((v) => v.id === id);

  // id tidak ada -> 404
  if (index === -1) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }

  // field wajib kosong / tidak valid -> 400
  const pesanError = validasi(req.body);
  if (pesanError) {
    return kirim(res, 400, "error", pesanError, null);
  }

  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = req.body;

  // ganti penuh semua field (id tetap)
  vaccinations[index] = {
    id,
    namaPasien: namaPasien.trim(),
    nik: nik.trim(),
    jenisVaksin: jenisVaksin.trim(),
    dosisKe,
    tanggal: tanggal.trim(),
  };

  kirim(res, 200, "success", "Data berhasil diubah", vaccinations[index]);
});

// ------------------------------------------------------------
// ROUTE 5: DELETE /vaccinations/:id
// Hapus data berdasarkan id
// ------------------------------------------------------------
app.delete("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = vaccinations.findIndex((v) => v.id === id);

  // id tidak ada -> 404
  if (index === -1) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }

  vaccinations.splice(index, 1);

  // berhasil -> 200 + pesan, data: null
  kirim(res, 200, "success", `Data vaksinasi dengan id ${id} berhasil dihapus`, null);
});

// ------------------------------------------------------------
// ------------------------------------------------------------
// JALANKAN SERVER
// app.listen() hanya di lokal; di Vercel app di-export (serverless)
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;

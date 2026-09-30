const express = require("express");
const app = express();

app.use(express.json());

const vaccinations = [
  {
    id: 1,
    namaPasien: "Rudi Santoso",
    nik: "1671010101010001",
    jenisVaksin: "Hepatitis B",
    dosisKe: 2,
    tanggal: "2026-10-03",
  },
];

let nextId = 5;

function kirim(res, kodeStatus, status, message, data) {
  return res.status(kodeStatus).json({ status, message, data });
}

function validasi(body) {
  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = body || {};

  const fieldString = { namaPasien, nik, jenisVaksin, tanggal };
  for (const [nama, nilai] of Object.entries(fieldString)) {
    if (nilai === undefined || nilai === null || String(nilai).trim() === "") {
      return `Field ${nama} wajib diisi`;
    }
    if (typeof nilai !== "string") {
      return `Field ${nama} harus berupa string`;
    }
  }

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

app.get("/", (req, res) => {
  res.json({
    nama: "Delia Zahrani",
    nim: "24288240111",
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


app.get("/vaccinations", (req, res) => {
  const { jenisVaksin } = req.query; 
 
  if (jenisVaksin === undefined) {
    return res.status(200).json(vaccinations);
  }

  
  const hasil = vaccinations.filter(
    (v) => v.jenisVaksin.toLowerCase() === String(jenisVaksin).trim().toLowerCase()
  );
  res.status(200).json(hasil);
});


app.get("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id); // id dari route parameter
  const data = vaccinations.find((v) => v.id === id);

  
  if (!data) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }


  res.status(200).json(data);
});


app.post("/vaccinations", (req, res) => {
  const pesanError = validasi(req.body);
  if (pesanError) {
    return kirim(res, 400, "error", pesanError, null);
  }

  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = req.body;

  
  const baru = {
    id: nextId++,
    namaPasien: namaPasien.trim(),
    nik: nik.trim(),
    jenisVaksin: jenisVaksin.trim(),
    dosisKe,
    tanggal: tanggal.trim(),
  };
  vaccinations.push(baru);
  
  kirim(res, 201, "success", "Data berhasil ditambahkan", baru);
});

app.put("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = vaccinations.findIndex((v) => v.id === id);

  if (index === -1) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }

  const pesanError = validasi(req.body);
  if (pesanError) {
    return kirim(res, 400, "error", pesanError, null);
  }

  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal } = req.body;

  
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

app.delete("/vaccinations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = vaccinations.findIndex((v) => v.id === id);


  if (index === -1) {
    return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
  }

  vaccinations.splice(index, 1);

  // berhasil -> 200 + pesan, data: null
  kirim(res, 200, "success", `Data vaksinasi dengan id ${id} berhasil dihapus`, null);
});

app.use((req, res) => {
  kirim(res, 404, "error", "Endpoint tidak ditemukan", null);
});


app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return kirim(res, 400, "error", "Body request bukan JSON yang valid", null);
  }
  kirim(res, 500, "error", "Terjadi kesalahan pada server", null);
});


const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;

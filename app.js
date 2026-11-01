require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// ===================== SCHEMA =====================

// REFERENCING: koleksi terpisah, dipanggil lewat ObjectId
const puskesmasSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    alamat: { type: String, trim: true },
    kecamatan: { type: String, trim: true },
  },
  { timestamps: true }
);
const Puskesmas = mongoose.model("Puskesmas", puskesmasSchema);

// EMBEDDING: sub-dokumen efek samping di dalam dokumen vaksinasi
const efekSampingSchema = new mongoose.Schema(
  {
    tanggal: { type: Date, default: Date.now },
    gejala: { type: String, required: true, trim: true },
    tingkat: { type: String, enum: ["ringan", "sedang", "berat"], default: "ringan" },
  },
  { timestamps: true }
);

const vaccinationSchema = new mongoose.Schema(
  {
    namaPasien: { type: String, required: true, trim: true },
    nik: { type: String, required: true, trim: true },
    jenisVaksin: { type: String, required: true, trim: true },
    dosisKe: { type: Number, required: true, min: 1 },
    tanggal: { type: String, required: true }, // format YYYY-MM-DD
    puskesmas: { type: mongoose.Schema.Types.ObjectId, ref: "Puskesmas" }, // REFERENCING
    efekSamping: [efekSampingSchema], // EMBEDDING
  },
  { timestamps: true }
);
// satu pasien tidak boleh punya dosis yang sama untuk vaksin yang sama
vaccinationSchema.index({ nik: 1, jenisVaksin: 1, dosisKe: 1 }, { unique: true });
const Vaccination = mongoose.model("Vaccination", vaccinationSchema);

// ===================== HELPER =====================

function kirim(res, kodeStatus, status, message, data) {
  return res.status(kodeStatus).json({ status, message, data });
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function validasi(body) {
  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal, puskesmas } = body || {};

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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal.trim())) {
    return "Field tanggal harus berformat YYYY-MM-DD";
  }
  const cek = new Date(tanggal.trim() + "T00:00:00Z");
  if (Number.isNaN(cek.getTime()) || cek.toISOString().slice(0, 10) !== tanggal.trim()) {
    return "Field tanggal bukan tanggal yang valid";
  }

  if (puskesmas !== undefined && !mongoose.isValidObjectId(puskesmas)) {
    return "Field puskesmas harus berupa ID puskesmas yang valid";
  }

  return null;
}

// middleware: pastikan :id berformat ObjectId
function cekId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return kirim(res, 400, "error", "ID tidak valid", null);
  }
  next();
}

// kembalikan pesan error kalau puskesmas dirujuk tapi tidak ada di database
async function cekPuskesmasAda(id) {
  if (id === undefined) return null;
  const ada = await Puskesmas.exists({ _id: id });
  return ada ? null : "Puskesmas dengan id tersebut tidak ditemukan";
}

function ambilField(body) {
  const { namaPasien, nik, jenisVaksin, dosisKe, tanggal, puskesmas } = body;
  const hasil = {
    namaPasien: namaPasien.trim(),
    nik: nik.trim(),
    jenisVaksin: jenisVaksin.trim(),
    dosisKe,
    tanggal: tanggal.trim(),
  };
  if (puskesmas !== undefined) hasil.puskesmas = puskesmas;
  return hasil;
}

// ===================== ROUTE =====================

app.get("/", (req, res) => {
  res.json({
    nama: "Delia Zahrani",
    nim: "24288240111",
    kelas: "SI5B",
    topik: 31,
    namaTopik: "Puskesmas - Jadwal Vaksinasi (MongoDB)",
    resource: "/vaccinations",
    endpoint: [
      "GET /",
      "GET /vaccinations?jenisVaksin=Hepatitis B&namaPasien=rudi&dosisKe=2&sort=-tanggal&fields=namaPasien,jenisVaksin&page=1&limit=5",
      "GET /vaccinations/:id",
      "POST /vaccinations",
      "POST /vaccinations/:id/efek-samping",
      "PUT /vaccinations/:id",
      "DELETE /vaccinations/:id",
      "GET /puskesmas",
      "POST /puskesmas",
    ],
  });
});

// ---------- Puskesmas (untuk referencing) ----------
app.get("/puskesmas", async (req, res, next) => {
  try {
    kirim(res, 200, "success", "Daftar puskesmas", await Puskesmas.find());
  } catch (err) { next(err); }
});

app.post("/puskesmas", async (req, res, next) => {
  try {
    const { nama, alamat, kecamatan } = req.body || {};
    if (typeof nama !== "string" || nama.trim() === "") {
      return kirim(res, 400, "error", "Field nama wajib diisi", null);
    }
    const baru = await Puskesmas.create({ nama, alamat, kecamatan });
    kirim(res, 201, "success", "Puskesmas berhasil ditambahkan", baru);
  } catch (err) { next(err); }
});

// ---------- GET semua: filtering, sorting, projection, pagination ----------
app.get("/vaccinations", async (req, res, next) => {
  try {
    const { jenisVaksin, namaPasien, nik, dosisKe, puskesmas, tanggalDari, tanggalSampai, sort, fields } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    // FILTERING
    const filter = {};
    if (jenisVaksin) {
      filter.jenisVaksin = { $regex: `^${escapeRegex(String(jenisVaksin).trim())}$`, $options: "i" };
    }
    if (namaPasien) filter.namaPasien = { $regex: escapeRegex(String(namaPasien)), $options: "i" };
    if (nik) filter.nik = String(nik);
    if (dosisKe) filter.dosisKe = Number(dosisKe);
    if (puskesmas) {
      if (!mongoose.isValidObjectId(puskesmas)) return kirim(res, 400, "error", "ID puskesmas tidak valid", null);
      filter.puskesmas = puskesmas;
    }
    if (tanggalDari || tanggalSampai) {
      filter.tanggal = {};
      if (tanggalDari) filter.tanggal.$gte = String(tanggalDari);
      if (tanggalSampai) filter.tanggal.$lte = String(tanggalSampai);
    }

    // SORTING   contoh: ?sort=-tanggal,namaPasien
    const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";

    // PROJECTION   contoh: ?fields=namaPasien,jenisVaksin
    const select = fields ? String(fields).split(",").join(" ") : "";

    const [data, total] = await Promise.all([
      Vaccination.find(filter)
        .select(select)
        .sort(sortBy)
        .skip((page - 1) * limit) // PAGINATION
        .limit(limit)
        .populate("puskesmas", "nama alamat kecamatan"), // ambil data referensi
      Vaccination.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (err) { next(err); }
});

app.get("/vaccinations/:id", cekId, async (req, res, next) => {
  try {
    const data = await Vaccination.findById(req.params.id).populate("puskesmas");
    if (!data) {
      return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
    }
    res.status(200).json(data);
  } catch (err) { next(err); }
});

app.post("/vaccinations", async (req, res, next) => {
  try {
    const pesanError = validasi(req.body);
    if (pesanError) return kirim(res, 400, "error", pesanError, null);

    const errPkm = await cekPuskesmasAda(req.body.puskesmas);
    if (errPkm) return kirim(res, 400, "error", errPkm, null);

    const baru = await Vaccination.create(ambilField(req.body));
    kirim(res, 201, "success", "Data berhasil ditambahkan", baru);
  } catch (err) { next(err); }
});

// EMBEDDING: tambah catatan efek samping ke dalam dokumen vaksinasi
app.post("/vaccinations/:id/efek-samping", cekId, async (req, res, next) => {
  try {
    const { gejala, tingkat, tanggal } = req.body || {};
    if (typeof gejala !== "string" || gejala.trim() === "") {
      return kirim(res, 400, "error", "Field gejala wajib diisi dan berupa string", null);
    }
    const data = await Vaccination.findById(req.params.id);
    if (!data) {
      return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
    }
    data.efekSamping.push({ gejala, tingkat, tanggal });
    await data.save();
    kirim(res, 201, "success", "Efek samping berhasil ditambahkan", data);
  } catch (err) { next(err); }
});

app.put("/vaccinations/:id", cekId, async (req, res, next) => {
  try {
    const pesanError = validasi(req.body);
    if (pesanError) return kirim(res, 400, "error", pesanError, null);

    const errPkm = await cekPuskesmasAda(req.body.puskesmas);
    if (errPkm) return kirim(res, 400, "error", errPkm, null);

    const hasil = await Vaccination.findByIdAndUpdate(req.params.id, ambilField(req.body), {
      new: true,
      runValidators: true,
    });
    if (!hasil) {
      return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
    }
    kirim(res, 200, "success", "Data berhasil diubah", hasil);
  } catch (err) { next(err); }
});

app.delete("/vaccinations/:id", cekId, async (req, res, next) => {
  try {
    const hasil = await Vaccination.findByIdAndDelete(req.params.id);
    if (!hasil) {
      return kirim(res, 404, "error", `Data dengan id ${req.params.id} tidak ditemukan`, null);
    }
    kirim(res, 200, "success", `Data vaksinasi dengan id ${req.params.id} berhasil dihapus`, null);
  } catch (err) { next(err); }
});

app.use((req, res) => {
  kirim(res, 404, "error", "Endpoint tidak ditemukan", null);
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return kirim(res, 400, "error", "Body request bukan JSON yang valid", null);
  }
  if (err.code === 11000) {
    return kirim(res, 409, "error", "Data vaksinasi (nik, jenisVaksin, dosisKe) sudah ada", null);
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return kirim(res, 400, "error", err.message, null);
  }
  // contoh: ?fields=nama,-jenisVaksin (campur include dan exclude)
  if (/projection/i.test(err.message || "")) {
    return kirim(res, 400, "error", "Parameter fields tidak valid", null);
  }
  console.error(err);
  kirim(res, 500, "error", "Terjadi kesalahan pada server", null);
});

// ===================== START =====================

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB terhubung");
    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
    }
  } catch (err) {
    console.error("Gagal konek MongoDB:", err.message);
    process.exit(1);
  }
}
start();

module.exports = app;
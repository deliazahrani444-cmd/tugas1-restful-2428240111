const mongoose = require("mongoose");
const Vaccination = require("../models/vaccinationModel");
const Puskesmas = require("../models/puskesmasModel");
const { kirim } = require("../utils/response");

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

const tidakDitemukan = (res, id) =>
  kirim(res, 404, "error", `Data dengan id ${id} tidak ditemukan`, null);

exports.getAllVaccinations = async (req, res, next) => {
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
      if (!mongoose.isValidObjectId(puskesmas)) {
        return kirim(res, 400, "error", "ID puskesmas tidak valid", null);
      }
      filter.puskesmas = puskesmas;
    }
    if (tanggalDari || tanggalSampai) {
      filter.tanggal = {};
      if (tanggalDari) filter.tanggal.$gte = String(tanggalDari);
      if (tanggalSampai) filter.tanggal.$lte = String(tanggalSampai);
    }

    // SORTING
    const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";

    // PROJECTION
    const select = fields ? String(fields).split(",").join(" ") : "";

    const [data, total] = await Promise.all([
      Vaccination.find(filter)
        .select(select)
        .sort(sortBy)
        .skip((page - 1) * limit) // PAGINATION
        .limit(limit)
        .populate("puskesmas", "nama alamat kecamatan"),
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
  } catch (err) {
    next(err);
  }
};

exports.getVaccinationById = async (req, res, next) => {
  try {
    const data = await Vaccination.findById(req.params.id).populate("puskesmas");
    if (!data) return tidakDitemukan(res, req.params.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.createVaccination = async (req, res, next) => {
  try {
    const pesanError = validasi(req.body);
    if (pesanError) return kirim(res, 400, "error", pesanError, null);

    const errPkm = await cekPuskesmasAda(req.body.puskesmas);
    if (errPkm) return kirim(res, 400, "error", errPkm, null);

    const baru = await Vaccination.create(ambilField(req.body));
    kirim(res, 201, "success", "Data berhasil ditambahkan", baru);
  } catch (err) {
    next(err);
  }
};

// EMBEDDING: tambah catatan efek samping ke dalam dokumen vaksinasi
exports.addEfekSamping = async (req, res, next) => {
  try {
    const { gejala, tingkat, tanggal } = req.body || {};
    if (typeof gejala !== "string" || gejala.trim() === "") {
      return kirim(res, 400, "error", "Field gejala wajib diisi dan berupa string", null);
    }
    const data = await Vaccination.findById(req.params.id);
    if (!data) return tidakDitemukan(res, req.params.id);

    data.efekSamping.push({ gejala, tingkat, tanggal });
    await data.save();
    kirim(res, 201, "success", "Efek samping berhasil ditambahkan", data);
  } catch (err) {
    next(err);
  }
};

exports.updateVaccination = async (req, res, next) => {
  try {
    const pesanError = validasi(req.body);
    if (pesanError) return kirim(res, 400, "error", pesanError, null);

    const errPkm = await cekPuskesmasAda(req.body.puskesmas);
    if (errPkm) return kirim(res, 400, "error", errPkm, null);

    const hasil = await Vaccination.findByIdAndUpdate(req.params.id, ambilField(req.body), {
      new: true,
      runValidators: true,
    });
    if (!hasil) return tidakDitemukan(res, req.params.id);
    kirim(res, 200, "success", "Data berhasil diubah", hasil);
  } catch (err) {
    next(err);
  }
};

exports.deleteVaccination = async (req, res, next) => {
  try {
    const hasil = await Vaccination.findByIdAndDelete(req.params.id);
    if (!hasil) return tidakDitemukan(res, req.params.id);
    kirim(res, 200, "success", `Data vaksinasi dengan id ${req.params.id} berhasil dihapus`, null);
  } catch (err) {
    next(err);
  }
};


const Puskesmas = require("../models/puskesmasModel");
const { kirim } = require("../utils/response");

exports.getAllPuskesmas = async (req, res, next) => {
  try {
    kirim(res, 200, "success", "Daftar puskesmas", await Puskesmas.find());
  } catch (err) {
    next(err);
  }
};

exports.createPuskesmas = async (req, res, next) => {
  try {
    const { nama, alamat, kecamatan } = req.body || {};
    if (typeof nama !== "string" || nama.trim() === "") {
      return kirim(res, 400, "error", "Field nama wajib diisi", null);
    }
    const baru = await Puskesmas.create({ nama, alamat, kecamatan });
    kirim(res, 201, "success", "Puskesmas berhasil ditambahkan", baru);
  } catch (err) {
    next(err);
  }
};


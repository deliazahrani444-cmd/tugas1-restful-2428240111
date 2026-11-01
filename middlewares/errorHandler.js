const { kirim } = require("../utils/response");

const notFound = (req, res) => {
  kirim(res, 404, "error", "Endpoint tidak ditemukan", null);
};

const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return kirim(res, 400, "error", "Body request bukan JSON yang valid", null);
  }
  if (err.code === 11000) {
    return kirim(res, 409, "error", "Data vaksinasi (nik, jenisVaksin, dosisKe) sudah ada", null);
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return kirim(res, 400, "error", err.message, null);
  }
  if (/projection/i.test(err.message || "")) {
    return kirim(res, 400, "error", "Parameter fields tidak valid", null);
  }
  console.error(err);
  kirim(res, 500, "error", "Terjadi kesalahan pada server", null);
};

module.exports = { notFound, errorHandler };


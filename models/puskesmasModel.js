const mongoose = require("mongoose");

const puskesmasSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    alamat: { type: String, trim: true },
    kecamatan: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Puskesmas", puskesmasSchema);

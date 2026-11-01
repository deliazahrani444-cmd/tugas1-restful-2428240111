const mongoose = require("mongoose");

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

    // REFERENCING: menunjuk ke koleksi Puskesmas
    puskesmas: { type: mongoose.Schema.Types.ObjectId, ref: "Puskesmas" },

    // EMBEDDING
    efekSamping: [efekSampingSchema],
  },
  { timestamps: true }
);

// satu pasien tidak boleh punya dosis yang sama untuk vaksin yang sama
vaccinationSchema.index({ nik: 1, jenisVaksin: 1, dosisKe: 1 }, { unique: true });

module.exports = mongoose.model("Vaccination", vaccinationSchema);
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const logger = require("./middlewares/logger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const vaccinationRoutes = require("./routes/vaccinationRoutes");
const puskesmasRoutes = require("./routes/puskesmasRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.status(200).json({
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

app.use("/vaccinations", vaccinationRoutes);
app.use("/puskesmas", puskesmasRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  }
});

module.exports = app;
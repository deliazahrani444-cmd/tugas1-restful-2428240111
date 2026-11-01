const mongoose = require("mongoose");
const { kirim } = require("../utils/response");

module.exports = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return kirim(res, 400, "error", "ID tidak valid", null);
  }
  next();
};


function kirim(res, kodeStatus, status, message, data) {
  return res.status(kodeStatus).json({ status, message, data });
}

module.exports = { kirim };

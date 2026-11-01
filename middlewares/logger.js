module.exports = (req, res, next) => {
  const mulai = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - mulai} ms)`);
  });
  next();
};


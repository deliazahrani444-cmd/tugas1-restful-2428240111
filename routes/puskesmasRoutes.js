const router = require("express").Router();
const ctrl = require("../controllers/puskesmasController");

router.get("/", ctrl.getAllPuskesmas);
router.post("/", ctrl.createPuskesmas);

module.exports = router;


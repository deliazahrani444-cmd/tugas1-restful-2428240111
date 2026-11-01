const router = require("express").Router();
const ctrl = require("../controllers/vaccinationController");
const validateId = require("../middlewares/validateId");

router.get("/", ctrl.getAllVaccinations);
router.get("/:id", validateId, ctrl.getVaccinationById);
router.post("/", ctrl.createVaccination);
router.post("/:id/efek-samping", validateId, ctrl.addEfekSamping);
router.put("/:id", validateId, ctrl.updateVaccination);
router.delete("/:id", validateId, ctrl.deleteVaccination);

module.exports = router;


const express = require('express');
const router = express.Router();
const { getSolicitudes, createSolicitud, updateSolicitud } = require('../controllers/solicitudes.controller');
const verifyToken = require('../middlewares/verifyToken');

// Todas las rutas requieren token (admin o docente)
router.use(verifyToken);

router.get('/', getSolicitudes);
router.post('/', createSolicitud);
router.put('/:id', updateSolicitud);

module.exports = router;

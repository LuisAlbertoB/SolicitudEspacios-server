const express = require('express');
const router = express.Router();
const { getSolicitudesInmobiliario, createSolicitudInmobiliario, updateSolicitudInmobiliario } = require('../controllers/solicitudesInmobiliario.controller');
const verifyToken = require('../middlewares/verifyToken');

// Todas las rutas requieren token (admin o docente)
router.use(verifyToken);

router.get('/', getSolicitudesInmobiliario);
router.post('/', createSolicitudInmobiliario);
router.put('/:id', updateSolicitudInmobiliario);

module.exports = router;

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getPeriodos, getActivePeriodRoute, createPeriodo, updatePeriodo } = require('../controllers/periodos.controller');

// Solo administradores o rutas compartidas dependiendo tu politica
// Dejamos verifyToken por defecto.
router.use(verifyToken);

// GET /api/periodos/active - Debe ir antes de /:id para no interferir
router.get('/active', getActivePeriodRoute);

router.get('/', getPeriodos);
router.post('/', createPeriodo);
router.put('/:id', updatePeriodo);

module.exports = router;

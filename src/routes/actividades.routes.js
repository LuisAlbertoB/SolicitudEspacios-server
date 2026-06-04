const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getActividades } = require('../controllers/actividades.controller');

router.use(verifyToken);

router.get('/', getActividades);

module.exports = router;

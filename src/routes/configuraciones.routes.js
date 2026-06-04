const express = require('express');
const router = express.Router();
const { getConfiguraciones } = require('../controllers/configuraciones.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

router.use(verifyToken, verifyAdmin);

router.get('/', getConfiguraciones);

module.exports = router;

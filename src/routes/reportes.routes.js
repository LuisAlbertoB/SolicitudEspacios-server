const express = require('express');
const router = express.Router();
const { getReportes } = require('../controllers/reportes.controller');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/', getReportes);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getMobiliario } = require('../controllers/mobiliario.controller');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/', getMobiliario);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAulas } = require('../controllers/aulas.controller');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/', getAulas);

module.exports = router;

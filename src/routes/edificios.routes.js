const express = require('express');
const router = express.Router();
const { getEdificios } = require('../controllers/edificios.controller');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/', getEdificios);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUsuarios, createUsuario, updateEstadoUsuario, deleteUsuario } = require('../controllers/usuarios.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// Todas las rutas de usuarios requieren token + rol admin
router.use(verifyToken, verifyAdmin);

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id/estado', updateEstadoUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;

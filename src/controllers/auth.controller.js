const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const login = async (req, res) => {
  const { matricula, contrasena } = req.body;

  if (!matricula || !contrasena) {
    return res.status(400).json({ message: 'Matrícula y contraseña son requeridos.' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { matricula } });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ message: 'Cuenta inactiva. Contacte al administrador.' });
    }

    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        matricula: usuario.matricula,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: '40m' }
    );

    return res.status(200).json({
      message: 'Login exitoso.',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        matricula: usuario.matricula,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { login };

const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

// GET /api/usuarios – Solo admin
const getUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip,
        take: limit,
        select: {
          id_usuario: true,
          nombre_completo: true,
          matricula: true,
          rol: true,
          estado: true,
          createdAt: true,
          updatedAt: true,
          creador: {
            select: { id_usuario: true, nombre_completo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.usuario.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: usuarios,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error en getUsuarios:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/usuarios – Solo admin
const createUsuario = async (req, res) => {
  const { nombre_completo, matricula, contrasena, rol } = req.body;

  if (!nombre_completo || !matricula || !contrasena || !rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos: nombre_completo, matricula, contrasena, rol.' });
  }

  if (!['admin', 'docente'].includes(rol)) {
    return res.status(400).json({ message: 'El rol debe ser "admin" o "docente".' });
  }

  try {
    const existente = await prisma.usuario.findUnique({ where: { matricula } });
    if (existente) {
      return res.status(409).json({ message: `La matrícula ${matricula} ya está registrada.` });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre_completo,
        matricula,
        contrasena: hashedPassword,
        rol,
        estado: 'activo',
        id_user_creator: req.user.id_usuario,
      },
      select: {
        id_usuario: true,
        nombre_completo: true,
        matricula: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: 'Usuario creado exitosamente.', usuario: nuevoUsuario });
  } catch (error) {
    console.error('Error en createUsuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// PUT /api/usuarios/:id/estado – Solo admin
const updateEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['activo', 'inactivo'].includes(estado)) {
    return res.status(400).json({ message: 'El estado debe ser "activo" o "inactivo".' });
  }

  try {
    const usuarioId = Number(id);
    if (isNaN(usuarioId)) return res.status(400).json({ message: 'ID de usuario inválido.' });

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario: usuarioId } });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Evitar alterar el estado del Admin Master
    if (usuario.matricula === '000000') {
      return res.status(403).json({ message: 'No se puede modificar el estado del Administrador Principal.' });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: usuarioId },
      data: { estado },
      select: {
        id_usuario: true,
        nombre_completo: true,
        matricula: true,
        estado: true
      }
    });

    return res.status(200).json({ message: 'Estado actualizado correctamente.', usuario: usuarioActualizado });
  } catch (error) {
    console.error('Error en updateEstadoUsuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// DELETE /api/usuarios/:id – Solo admin
const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioId = Number(id);
    if (isNaN(usuarioId)) return res.status(400).json({ message: 'ID de usuario inválido.' });

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario: usuarioId } });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Evitar eliminar al admin master
    if (usuario.matricula === '000000') {
      return res.status(403).json({ message: 'No se puede eliminar al Administrador Principal.' });
    }

    await prisma.usuario.delete({
      where: { id_usuario: usuarioId }
    });

    return res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getUsuarios, createUsuario, updateEstadoUsuario, deleteUsuario };

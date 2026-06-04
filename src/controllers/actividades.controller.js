const prisma = require('../prismaClient');

// GET /api/actividades
// Obtener el catálogo de actividades únicas existentes para el Dropdown
const getActividades = async (req, res) => {
  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { titulo_actividad: 'asc' },
      select: {
        id_actividad: true,
        titulo_actividad: true,
        subtitulo_actividad: true,
        descripcion: true
      }
    });

    return res.status(200).json(actividades);
  } catch (error) {
    console.error('Error en getActividades:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getActividades };

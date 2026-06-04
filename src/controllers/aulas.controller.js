const prisma = require('../prismaClient');

// GET /api/aulas
const getAulas = async (req, res) => {
  try {
    const aulas = await prisma.aula.findMany({
      include: {
        edificio: {
          select: { id_edificio: true, nombre_clave: true },
        },
      },
      orderBy: { nombre_clave: 'asc' },
    });
    return res.status(200).json(aulas);
  } catch (error) {
    console.error('Error en getAulas:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getAulas };

const prisma = require('../prismaClient');

// GET /api/edificios
const getEdificios = async (req, res) => {
  try {
    const edificios = await prisma.edificio.findMany({
      include: { aulas: true },
      orderBy: { nombre_clave: 'asc' },
    });
    return res.status(200).json(edificios);
  } catch (error) {
    console.error('Error en getEdificios:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getEdificios };

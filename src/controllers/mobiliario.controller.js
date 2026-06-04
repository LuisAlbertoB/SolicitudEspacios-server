const prisma = require('../prismaClient');

// GET /api/mobiliario
const getMobiliario = async (req, res) => {
  try {
    const catalogo = await prisma.catalogoInmobiliario.findMany({
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
    return res.status(200).json(catalogo);
  } catch (error) {
    console.error('Error en getMobiliario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getMobiliario };

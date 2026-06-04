const prisma = require('../prismaClient');

// GET /api/configuraciones – Solo admin
const getConfiguraciones = async (req, res) => {
  try {
    const configuraciones = await prisma.configuracionSistema.findMany({
      orderBy: { clave: 'asc' },
    });
    return res.status(200).json(configuraciones);
  } catch (error) {
    console.error('Error en getConfiguraciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getConfiguraciones };

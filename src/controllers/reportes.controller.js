const prisma = require('../prismaClient');

// GET /api/reportes
const getReportes = async (req, res) => {
  try {
    const reportes = await prisma.reporte.findMany({
      include: {
        reportante: {
          select: { id_usuario: true, nombre_completo: true, matricula: true },
        },
        aula: {
          select: { id_aula: true, nombre_clave: true },
        },
        mobiliario: {
          select: { id_inmobiliario: true, nombre: true, categoria: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(reportes);
  } catch (error) {
    console.error('Error en getReportes:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getReportes };

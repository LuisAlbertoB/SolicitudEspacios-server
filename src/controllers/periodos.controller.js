const prisma = require('../prismaClient');

/**
 * Función interna compartida por otros controladores para obtener el ID del periodo activo
 * evitando redundancia de consultas en la base de datos para operaciones transaccionales.
 * 
 * @returns {Promise<number>} ID del periodo escolar activo
 * @throws {Error} Si no se encuentra un periodo activo configurado
 */
const getActivePeriod = async () => {
  const periodo = await prisma.periodo.findFirst({
    where: { estado: 'activo' },
    select: { id_periodo: true },
  });

  if (!periodo) {
    throw new Error('No hay un periodo escolar activo configurado en el sistema.');
  }

  return periodo.id_periodo;
};

// ─── CONTROLADOR HTTP PARA PERIODOS ──────────────────────────────────────────

// GET /api/periodos
// Obtener todos los periodos históricos
const getPeriodos = async (req, res) => {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: { fecha_inicio: 'desc' },
    });
    return res.status(200).json(periodos);
  } catch (error) {
    console.error('Error en getPeriodos:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// GET /api/periodos/active
// Endpoint para que el cliente consulte qué periodo está en curso actual
const getActivePeriodRoute = async (req, res) => {
  try {
    const periodo = await prisma.periodo.findFirst({
      where: { estado: 'activo' },
    });
    if (!periodo) {
      return res.status(404).json({ message: 'No hay periodo escolar activo.' });
    }
    return res.status(200).json(periodo);
  } catch (error) {
    console.error('Error en getActivePeriodRoute:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/periodos
const createPeriodo = async (req, res) => {
  const { nombre_clave, fecha_inicio, fecha_final, estado } = req.body;

  if (!nombre_clave || !fecha_inicio || !fecha_final) {
    return res.status(400).json({ message: 'Faltan campos obligatorios.' });
  }

  try {
    // Si se está creando un periodo como 'activo', debemos asegurar que los demás pasen a 'inactivo'
    const isActivo = estado === 'activo';

    const nuevoPeriodo = await prisma.$transaction(async (tx) => {
      if (isActivo) {
        await tx.periodo.updateMany({
          where: { estado: 'activo' },
          data: { estado: 'inactivo' },
        });
      }

      return await tx.periodo.create({
        data: {
          nombre_clave,
          fecha_inicio: new Date(fecha_inicio),
          fecha_final: new Date(fecha_final),
          estado: isActivo ? 'activo' : 'inactivo',
        },
      });
    });

    return res.status(201).json({ message: 'Periodo creado.', periodo: nuevoPeriodo });
  } catch (error) {
    console.error('Error en createPeriodo:', error);
    return res.status(500).json({ message: 'Error al crear el periodo escolar.' });
  }
};

// PUT /api/periodos/:id
const updatePeriodo = async (req, res) => {
  const { id } = req.params;
  const { nombre_clave, fecha_inicio, fecha_final, estado } = req.body;

  try {
    const idPeriodo = Number(id);
    const dataToUpdate = {};
    if (nombre_clave) dataToUpdate.nombre_clave = nombre_clave;
    if (fecha_inicio) dataToUpdate.fecha_inicio = new Date(fecha_inicio);
    if (fecha_final) dataToUpdate.fecha_final = new Date(fecha_final);

    if (estado !== undefined) {
      if (!['activo', 'inactivo'].includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido.' });
      }
      dataToUpdate.estado = estado;
    }

    const periodoActualizado = await prisma.$transaction(async (tx) => {
      if (estado === 'activo') {
        // Desactivar a todos los que puedan estar activos
        await tx.periodo.updateMany({
          where: { estado: 'activo' },
          data: { estado: 'inactivo' },
        });
      }

      return await tx.periodo.update({
        where: { id_periodo: idPeriodo },
        data: dataToUpdate,
      });
    });

    return res.status(200).json({ message: 'Periodo actualizado.', periodo: periodoActualizado });
  } catch (error) {
    console.error('Error en updatePeriodo:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getActivePeriod, // Helper interno para transacciones
  getPeriodos,
  getActivePeriodRoute,
  createPeriodo,
  updatePeriodo
};

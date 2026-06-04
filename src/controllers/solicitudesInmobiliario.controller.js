const prisma = require('../prismaClient');
const { getActivePeriod } = require('./periodos.controller');

// GET /api/solicitudes-inmobiliario
const getSolicitudesInmobiliario = async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.periodo) {
      whereClause.id_periodo = Number(req.query.periodo);
    }

    const solicitudes = await prisma.solicitudInmobiliario.findMany({
      where: whereClause,
      include: {
        periodo: true,
        solicitante: {
          select: { id_usuario: true, nombre_completo: true, matricula: true },
        },
        inmobiliario: {
          select: { id_inmobiliario: true, nombre: true, categoria: true, modelo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error('Error en getSolicitudesInmobiliario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/solicitudes-inmobiliario
// Crea una SolicitudInmobiliario + registro en tabla pivote (sin id_solicitud aún)
const createSolicitudInmobiliario = async (req, res) => {
  const { id_inmobiliario_solicitado, cantidad_solicitada, fecha_inicio, fecha_fin } = req.body;

  // Validaciones
  if (!id_inmobiliario_solicitado || !cantidad_solicitada || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      message: 'Campos requeridos: id_inmobiliario_solicitado, cantidad_solicitada, fecha_inicio, fecha_fin.',
    });
  }

  if (cantidad_solicitada < 1) {
    return res.status(400).json({ message: 'La cantidad solicitada debe ser al menos 1.' });
  }

  try {
    // Verificar que el inmobiliario exista
    const inmobiliario = await prisma.catalogoInmobiliario.findUnique({
      where: { id_inmobiliario: Number(id_inmobiliario_solicitado) },
    });
    if (!inmobiliario) {
      return res.status(404).json({ message: 'El inmobiliario solicitado no existe en el catálogo.' });
    }

    // Verificar stock disponible
    if (inmobiliario.stock_disponible < cantidad_solicitada) {
      return res.status(400).json({
        message: `Stock insuficiente. Disponible: ${inmobiliario.stock_disponible}, solicitado: ${cantidad_solicitada}.`,
      });
    }

    const id_periodo = await getActivePeriod();

    // Crear la SolicitudInmobiliario
    const solicitudInmobiliario = await prisma.solicitudInmobiliario.create({
      data: {
        id_inmobiliario_solicitado: Number(id_inmobiliario_solicitado),
        cantidad_solicitada: Number(cantidad_solicitada),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        id_user_solicitante: req.user.id_usuario,
        id_periodo,
      },
      include: {
        inmobiliario: {
          select: { id_inmobiliario: true, nombre: true, categoria: true },
        },
      },
    });

    // Crear registro en tabla pivote (sin id_solicitud por ahora, se usa un placeholder temporal)
    // NOTA: No creamos el registro pivote aquí porque aún no existe la solicitud.
    // El registro pivote se crea al momento de crear la Solicitud (en solicitudes.controller.js).

    return res.status(201).json({
      message: 'Solicitud de inmobiliario creada exitosamente.',
      solicitudInmobiliario,
    });
  } catch (error) {
    console.error('Error en createSolicitudInmobiliario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// PUT /api/solicitudes-inmobiliario/:id
const updateSolicitudInmobiliario = async (req, res) => {
  const { id } = req.params;
  const { cantidad_solicitada, estado, fecha_inicio, fecha_fin } = req.body;

  try {
    const solicitudId = Number(id);
    if (isNaN(solicitudId)) {
      return res.status(400).json({ message: 'ID de solicitud inválido.' });
    }

    const existente = await prisma.solicitudInmobiliario.findUnique({
      where: { id_solicitud_inmobiliario: solicitudId },
    });
    if (!existente) {
      return res.status(404).json({ message: 'Solicitud de inmobiliario no encontrada.' });
    }

    // Solo el solicitante o un admin pueden actualizar
    if (existente.id_user_solicitante !== req.user.id_usuario && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta solicitud.' });
    }

    // Construir objeto de actualización con solo los campos enviados
    const dataToUpdate = {};
    if (cantidad_solicitada !== undefined) dataToUpdate.cantidad_solicitada = Number(cantidad_solicitada);
    if (estado !== undefined) {
      if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ message: 'Estado debe ser: pendiente, aprobada o rechazada.' });
      }
      dataToUpdate.estado = estado;
    }
    if (fecha_inicio !== undefined) dataToUpdate.fecha_inicio = new Date(fecha_inicio);
    if (fecha_fin !== undefined) dataToUpdate.fecha_fin = new Date(fecha_fin);

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    const actualizada = await prisma.solicitudInmobiliario.update({
      where: { id_solicitud_inmobiliario: solicitudId },
      data: dataToUpdate,
      include: {
        inmobiliario: {
          select: { id_inmobiliario: true, nombre: true, categoria: true },
        },
      },
    });

    return res.status(200).json({
      message: 'Solicitud de inmobiliario actualizada correctamente.',
      solicitudInmobiliario: actualizada,
    });
  } catch (error) {
    console.error('Error en updateSolicitudInmobiliario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getSolicitudesInmobiliario, createSolicitudInmobiliario, updateSolicitudInmobiliario };

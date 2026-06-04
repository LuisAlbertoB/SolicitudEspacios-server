const prisma = require('../prismaClient');
const { getActivePeriod } = require('./periodos.controller');

// GET /api/solicitudes
const getSolicitudes = async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.periodo) {
      whereClause.id_periodo = Number(req.query.periodo);
    }

    const solicitudes = await prisma.solicitud.findMany({
      where: whereClause,
      include: {
        actividad: true,
        periodo: true,
        solicitante: {
          select: { id_usuario: true, nombre_completo: true, matricula: true },
        },
        aula: {
          include: {
            edificio: { select: { id_edificio: true, nombre_clave: true } },
          },
        },
        solicitudesInmobiliarioVinculadas: {
          include: {
            solicitudInmobiliario: {
              include: {
                inmobiliario: { select: { id_inmobiliario: true, nombre: true, categoria: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error('Error en getSolicitudes:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/solicitudes
// Crea la Solicitud y vincula las SolicitudesInmobiliario ya existentes mediante la tabla pivote
const createSolicitud = async (req, res) => {
  const {
    tipo_solicitud,
    fecha_inicio,
    fecha_final,
    motivo,
    id_aula,
    solicitudes_inmobiliario_ids,
    id_actividad, // Recibido si es Normal
    titulo_actividad, // Recibido si es Especial
    subtitulo_actividad,
    descripcion_actividad
  } = req.body;

  // Validaciones
  if (!fecha_inicio || !fecha_final || !motivo || !id_aula) {
    return res.status(400).json({
      message: 'Campos requeridos: fecha_inicio, fecha_final, motivo, id_aula.',
    });
  }

  try {
    const id_periodo = await getActivePeriod();

    const aula = await prisma.aula.findUnique({
      where: { id_aula: Number(id_aula) },
    });
    if (!aula) {
      return res.status(404).json({ message: 'El aula especificada no existe.' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 0. Determinar ID de Actividad
      let final_id_actividad = null;
      if (tipo_solicitud === 'normal') {
        if (!id_actividad) throw new Error('Se requiere seleccionar una actividad oficial para solicitudes normales.');
        final_id_actividad = Number(id_actividad);
      } else {
        if (!titulo_actividad) throw new Error('Se requiere un título para la nueva actividad especial.');
        const actividad = await tx.actividad.create({
          data: {
            titulo_actividad,
            subtitulo_actividad: subtitulo_actividad || null,
            descripcion: descripcion_actividad || null,
          }
        });
        final_id_actividad = actividad.id_actividad;
      }

      // 1. Crear la Solicitud
      const solicitud = await tx.solicitud.create({
        data: {
          tipo_solicitud: tipo_solicitud || 'normal',
          fecha_inicio: new Date(fecha_inicio),
          fecha_final: new Date(fecha_final),
          motivo,
          id_user_solicitante: req.user.id_usuario,
          id_aula: Number(id_aula),
          id_periodo,
          id_actividad: final_id_actividad,
        },
      });

      // 2. Si hay solicitudes de inmobiliario, crear los registros en la tabla pivote
      let registrosPivote = [];
      if (solicitudes_inmobiliario_ids && solicitudes_inmobiliario_ids.length > 0) {
        // Verificar que todas las solicitudes de inmobiliario existan
        const solicitudesInmob = await tx.solicitudInmobiliario.findMany({
          where: {
            id_solicitud_inmobiliario: { in: solicitudes_inmobiliario_ids.map(Number) },
          },
        });

        if (solicitudesInmob.length !== solicitudes_inmobiliario_ids.length) {
          throw new Error('Una o más solicitudes de inmobiliario no fueron encontradas.');
        }

        // Crear registros en tabla pivote
        for (const idSolInmob of solicitudes_inmobiliario_ids) {
          const pivote = await tx.solicitudHasSolicitudInmobiliario.create({
            data: {
              id_solicitud: solicitud.id_solicitud,
              id_solicitud_inmobiliario: Number(idSolInmob),
            },
          });
          registrosPivote.push(pivote);
        }
      }

      // 3. Recuperar la solicitud completa con relaciones
      const solicitudCompleta = await tx.solicitud.findUnique({
        where: { id_solicitud: solicitud.id_solicitud },
        include: {
          actividad: true,
          periodo: true,
          solicitante: {
            select: { id_usuario: true, nombre_completo: true, matricula: true },
          },
          aula: {
            include: {
              edificio: { select: { id_edificio: true, nombre_clave: true } },
            },
          },
          solicitudesInmobiliarioVinculadas: {
            include: {
              solicitudInmobiliario: {
                include: {
                  inmobiliario: { select: { id_inmobiliario: true, nombre: true, categoria: true } },
                },
              },
            },
          },
        },
      });

      return solicitudCompleta;
    });

    return res.status(201).json({
      message: 'Solicitud creada exitosamente.',
      solicitud: resultado,
    });
  } catch (error) {
    console.error('Error en createSolicitud:', error);
    if (error.message.includes('no fueron encontradas')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// PUT /api/solicitudes/:id
const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { tipo_solicitud, fecha_inicio, fecha_final, motivo, id_aula, estado } = req.body;

  try {
    const solicitudId = Number(id);
    if (isNaN(solicitudId)) {
      return res.status(400).json({ message: 'ID de solicitud inválido.' });
    }

    const existente = await prisma.solicitud.findUnique({
      where: { id_solicitud: solicitudId },
    });
    if (!existente) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    // Solo el solicitante o un admin pueden actualizar
    if (existente.id_user_solicitante !== req.user.id_usuario && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta solicitud.' });
    }

    // Construir objeto de actualización dinámico
    const dataToUpdate = {};
    if (tipo_solicitud !== undefined) {
      if (!['normal', 'especial'].includes(tipo_solicitud)) {
        return res.status(400).json({ message: 'tipo_solicitud debe ser: normal o especial.' });
      }
      dataToUpdate.tipo_solicitud = tipo_solicitud;
    }
    if (fecha_inicio !== undefined) dataToUpdate.fecha_inicio = new Date(fecha_inicio);
    if (fecha_final !== undefined) dataToUpdate.fecha_final = new Date(fecha_final);
    if (motivo !== undefined) dataToUpdate.motivo = motivo;
    if (id_aula !== undefined) dataToUpdate.id_aula = Number(id_aula);
    if (estado !== undefined) {
      if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ message: 'Estado debe ser: pendiente, aprobada o rechazada.' });
      }
      dataToUpdate.estado = estado;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    const actualizada = await prisma.solicitud.update({
      where: { id_solicitud: solicitudId },
      data: dataToUpdate,
      include: {
        actividad: true,
        periodo: true,
        solicitante: {
          select: { id_usuario: true, nombre_completo: true, matricula: true },
        },
        aula: {
          include: {
            edificio: { select: { id_edificio: true, nombre_clave: true } },
          },
        },
        solicitudesInmobiliarioVinculadas: {
          include: {
            solicitudInmobiliario: {
              include: {
                inmobiliario: { select: { id_inmobiliario: true, nombre: true, categoria: true } },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Solicitud actualizada correctamente.',
      solicitud: actualizada,
    });
  } catch (error) {
    console.error('Error en updateSolicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getSolicitudes, createSolicitud, updateSolicitud };

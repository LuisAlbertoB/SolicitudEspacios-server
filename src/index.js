require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ── Rutas ──────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const edificiosRoutes = require('./routes/edificios.routes');
const aulasRoutes = require('./routes/aulas.routes');
const mobiliarioRoutes = require('./routes/mobiliario.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const solicitudesInmobiliarioRoutes = require('./routes/solicitudesInmobiliario.routes');
const reportesRoutes = require('./routes/reportes.routes');
const periodosRoutes = require('./routes/periodos.routes');
const actividadesRoutes = require('./routes/actividades.routes');
const configuracionesRoutes = require('./routes/configuraciones.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Montaje de rutas ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/edificios', edificiosRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/mobiliario', mobiliarioRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/solicitudes-inmobiliario', solicitudesInmobiliarioRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/periodos', periodosRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/configuraciones', configuracionesRoutes);

// ── Ruta de health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor corriendo correctamente.' });
});

// ── Ruta 404 ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.originalUrl} no encontrada.` });
});

// ── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seeders...');

  // ─── Purgar Tablas Relevantes (Relación Actividades) ──────────────────────
  console.log('🧹 Limpiando solicitudes y actividades obsoletas...');
  await prisma.solicitudHasSolicitudInmobiliario.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.actividad.deleteMany();

  // ─── Actividades Catálogo ────────────────────────────────────────────────
  const actividadesBase = [
    { titulo_actividad: 'Clase', subtitulo_actividad: 'Asignatura Curricular', descripcion: 'Impartición regular de clase del plan de estudios.' },
    { titulo_actividad: 'Examen', subtitulo_actividad: 'Evaluación Ordinaria', descripcion: 'Aplicación de examen a los estudiantes.' },
    { titulo_actividad: 'Examen Extraordinario', subtitulo_actividad: 'Evaluación Extraordinaria', descripcion: 'Aplicación de examen extraordinario.' },
    { titulo_actividad: 'Conferencia', subtitulo_actividad: 'Ponencia Especial', descripcion: 'Conferencia o charla con ponente invitado.' },
    { titulo_actividad: 'Taller', subtitulo_actividad: 'Práctica', descripcion: 'Taller o actividad práctica guiada.' },
  ];

  for (const act of actividadesBase) {
    await prisma.actividad.create({ data: act });
  }
  console.log('✅ Catálogo de Actividades base creado.');

  // ─── Periodos (Reemplaza a Configuraciones de Sistema) ───────────────────
  const periodoActual = await prisma.periodo.upsert({
    where: { id_periodo: 1 },
    update: {},
    create: {
      nombre_clave: 'Cuatrimestre 2026-A',
      fecha_inicio: new Date('2026-01-12T00:00:00.000Z'),
      fecha_final: new Date('2026-05-31T23:59:59.000Z'),
      estado: 'activo'
    },
  });

  await prisma.periodo.upsert({
    where: { id_periodo: 2 },
    update: {},
    create: {
      nombre_clave: 'Cuatrimestre 2026-B',
      fecha_inicio: new Date('2026-06-15T00:00:00.000Z'),
      fecha_final: new Date('2026-10-31T23:59:59.000Z'),
      estado: 'inactivo'
    },
  });
  console.log('✅ Periodos de prueba creados.');

  // ─── Admin Master ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin1', 10);
  const adminMaster = await prisma.usuario.upsert({
    where: { matricula: '000000' },
    update: {},
    create: {
      nombre_completo: 'Administrador Master',
      matricula: '000000',
      contrasena: hashedPassword,
      rol: 'admin',
      estado: 'activo',
    },
  });
  console.log(`✅ Admin master creado: matricula=${adminMaster.matricula}`);

  // ─── Docente de Prueba ────────────────────────────────────────────────────
  const hashedDocente = await bcrypt.hash('docente1', 10);
  const docenteTest = await prisma.usuario.upsert({
    where: { matricula: '111111' },
    update: {},
    create: {
      nombre_completo: 'Docente de Prueba',
      matricula: '111111',
      contrasena: hashedDocente,
      rol: 'docente',
      estado: 'activo',
    },
  });
  console.log(`✅ Docente de prueba creado: matricula=${docenteTest.matricula}`);

  // ─── Edificios ────────────────────────────────────────────────────────────
  const edificios = await Promise.all([
    prisma.edificio.upsert({
      where: { id_edificio: 1 },
      update: {},
      create: { nombre_clave: 'Edificio A', estado: 'activo' },
    }),
    prisma.edificio.upsert({
      where: { id_edificio: 2 },
      update: {},
      create: { nombre_clave: 'Edificio B', estado: 'activo' },
    }),
    prisma.edificio.upsert({
      where: { id_edificio: 3 },
      update: {},
      create: { nombre_clave: 'Edificio C', estado: 'activo' },
    }),
  ]);
  console.log(`✅ ${edificios.length} Edificios creados.`);

  // ─── Aulas ────────────────────────────────────────────────────────────────
  const aulasData = [
    { id_aula: 1, nombre_clave: 'A-101', id_edificio: 1 },
    { id_aula: 2, nombre_clave: 'A-102', id_edificio: 1 },
    { id_aula: 3, nombre_clave: 'A-103', id_edificio: 1 },
    { id_aula: 4, nombre_clave: 'B-101', id_edificio: 2 },
    { id_aula: 5, nombre_clave: 'B-102', id_edificio: 2 },
    { id_aula: 6, nombre_clave: 'B-103', id_edificio: 2 },
    { id_aula: 7, nombre_clave: 'C-101', id_edificio: 3 },
    { id_aula: 8, nombre_clave: 'C-102', id_edificio: 3 },
    { id_aula: 9, nombre_clave: 'C-103', id_edificio: 3 },
  ];

  for (const aula of aulasData) {
    await prisma.aula.upsert({
      where: { id_aula: aula.id_aula },
      update: {},
      create: { nombre_clave: aula.nombre_clave, id_edificio: aula.id_edificio, estado: 'activo' },
    });
  }
  console.log(`✅ ${aulasData.length} Aulas creadas.`);

  // ─── Catálogo Inmobiliario ─────────────────────────────────────────────────
  const inmobiliarioData = [
    { id_inmobiliario: 1, categoria: 'Mobiliario', nombre: 'Silla', modelo: 'Estándar', stock_total: 100, stock_disponible: 100 },
    { id_inmobiliario: 2, categoria: 'Mobiliario', nombre: 'Mesa', modelo: 'Rectangular', stock_total: 30, stock_disponible: 30 },
    { id_inmobiliario: 3, categoria: 'Mobiliario', nombre: 'Butaca', modelo: 'Universitaria', stock_total: 200, stock_disponible: 200 },
    { id_inmobiliario: 4, categoria: 'Tecnología', nombre: 'Proyector', modelo: 'Epson X41+', stock_total: 15, stock_disponible: 15 },
    { id_inmobiliario: 5, categoria: 'Tecnología', nombre: 'Laptop', modelo: 'Dell Inspiron', stock_total: 10, stock_disponible: 10 },
    { id_inmobiliario: 6, categoria: 'Tecnología', nombre: 'Pantalla de Proyección', modelo: 'Manual 2m', stock_total: 10, stock_disponible: 10 },
    { id_inmobiliario: 7, categoria: 'Tecnología', nombre: 'Extensión Eléctrica', modelo: '5 Contactos', stock_total: 20, stock_disponible: 20 },
    { id_inmobiliario: 8, categoria: 'Audio', nombre: 'Micrófono Inalámbrico', modelo: 'Shure PGX', stock_total: 8, stock_disponible: 8 },
    { id_inmobiliario: 9, categoria: 'Audio', nombre: 'Bocina Portátil', modelo: 'JBL Eon', stock_total: 5, stock_disponible: 5 },
    { id_inmobiliario: 10, categoria: 'Mobiliario', nombre: 'Pizarrón Blanco', modelo: '120x80cm', stock_total: 12, stock_disponible: 12 },
  ];

  for (const item of inmobiliarioData) {
    await prisma.catalogoInmobiliario.upsert({
      where: { id_inmobiliario: item.id_inmobiliario },
      update: {},
      create: {
        categoria: item.categoria,
        nombre: item.nombre,
        modelo: item.modelo,
        stock_disponible: item.stock_disponible,
      },
    });
  }
  console.log(`✅ ${inmobiliarioData.length} items de Catálogo Inmobiliario creados.`);

  console.log('\n🎉 Seeders completados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeders:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MongoAdapter = require('@bot-whatsapp/database/mongo');
const axios = require('axios');

// Manejo global de errores
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

/**
 * Declaramos las conexiones de Mongo
 */
const MONGO_DB_URI = 'mongodb+srv://jrrdl1506mx:1234@cluster0.5mhti9d.mongodb.net/Calendar';
const MONGO_DB_NAME = 'Calendar';

// Mapa para almacenar sesiones de usuarios
const sesiones = new Map();

const flowAgendarCita = addKeyword(['1', 'Sí'])
    .addAnswer('¿Nombre de la persona para quién sería la cita?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from; // ID único del usuario (número de WhatsApp)
        if (!sesiones.has(idUsuario)) {
            sesiones.set(idUsuario, {}); // Inicializar sesión si no existe
        }

        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombre = ctx.body.trim();
        console.log(`Datos del usuario (${idUsuario}): ${datosUsuario.nombre}`);

        if (!datosUsuario.nombre) {
            return fallBack('Por favor, ingresa un nombre válido.');
        }
    })
    .addAnswer('Número telefónico del paciente', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.telefono = ctx.body.trim();
        console.log(`Número telefónico (${idUsuario}): ${datosUsuario.telefono}`);

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(datosUsuario.telefono)) {
            return fallBack('Por favor, ingresa un número de teléfono válido.');
        }
    })
    .addAction(async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);

        console.log(`Datos del usuario (${idUsuario}) registrados:`);
        console.log(`Nombre: ${datosUsuario.nombre}`);
        console.log(`Número telefónico: ${datosUsuario.telefono}`);

        try {
            const response = await axios.post('http://localhost:5000/DentalArce/paciente', {
                nombre: datosUsuario.nombre,
                telefonoWhatsapp: datosUsuario.telefono,
            });

            console.log('Respuesta del servidor:', response.data);
            await flowDynamic('¡Gracias! Hemos registrado toda tu información. 😊');
        } catch (error) {
            console.error('Error al registrar los datos del paciente:', error);
            await flowDynamic('❌ Hubo un error al registrar los datos del paciente. Por favor, inténtalo más tarde.');
        }

        // Eliminar la sesión del usuario después de completar el flujo
        sesiones.delete(idUsuario);
    });

const flowNoAgendar = addKeyword(['2', 'No'])
    .addAnswer('😞 Entendemos que no deseas agendar una cita en este momento.')
    .addAnswer('Si cambias de opinión, no dudes en contactarnos nuevamente. ¡Estaremos aquí para ayudarte! 😊')
    .addAnswer(['Ingrese "inicio" para regresar al menú principal.']);

const flowServicios = addKeyword('ser')
    .addAnswer('🦷 Ofrecemos los siguientes servicios en Dental Clinic Boutique By Dr. Arce:')
    .addAnswer([
        '1. Odontología general',
        '2. Rehabilitación y estética dental',
        '3. Especialidades como Ortodoncia, Endodoncia, Periodoncia, y más.',
        '\nIngrese "inicio" para regresar al menú principal.',
    ]);

const flowContacto = addKeyword('con')
    .addAnswer('📍 Estamos ubicados en Torre Médica San Telmo, Piso 6, Consultorio 617 y 618, Aguascalientes, México.')
    .addAnswer([
        'Prol. Gral. Ignacio Zaragoza #1004 Col. Calicantos II, Cp. 20116.',
        'Google Maps: https://maps.app.goo.gl/PRsf7HVZvcjy9J2r9',
        '\nIngrese "inicio" para regresar al menú principal.',
    ]);

const flowDocs = addKeyword('doc')
    .addAnswer([
        '¡Le invitamos a que acuda a una consulta valoración con Dr. Arce, para',
        'realizar una revisión oportuna de su situación actual y ayudar a dar solución ',
        'a su padecimiento',
        '✨! \n\n',
        'En Dental Clinic Boutique, la primera consulta es una valoración que incluye: \n\n',
        '* Apertura de Expediente Clínico Digital',
        '* Fotografías de Estudio',
        '* Escaneo Dental',
        '* Radiografías digitales',
        '* Plan de Tratamiento personalizado',
        '* Alternativas de Tratamientos',
        '* Costo del tratamiento elegido',
        '* Plan de pagos\n',
        '📆 Duración: 1 hora 30 minutos',
        '💰 Costo: $700.00 MXN\n',
        '¿Le gustaría reservar una consulta?',
        '1️⃣ Sí',
        '2️⃣ No\n',
        'Seleccione el número correspondiente.',
    ], null, null, [flowAgendarCita, flowNoAgendar]);

const flowPruebaCalendar = addKeyword(['calendarios', 'prueba calendario'])
    .addAnswer('📅 Obteniendo la lista de calendarios, por favor espera...', null, async (ctx, { flowDynamic }) => {
        try {
            const response = await axios.get('http://localhost:5000/DentalArce/calendars');
            const calendars = response.data.slice(0, 3).map(calendar => calendar.id);
            console.log('Calendarios obtenidos:', calendars);
            await flowDynamic(`📋 Aquí tienes los primeros 3 calendarios disponibles:\n${calendars.join('\n')}`);
        } catch (error) {
            console.error('Error al obtener los calendarios:', error);
            await flowDynamic('❌ Hubo un error al obtener los calendarios. Inténtalo más tarde.');
        }
    });

const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'inicio'])
    .addAnswer('🙌 ¡Hola, bienvenido a Dental Clinic Boutique! 😊')
    .addAnswer([
        'Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites:',
        '1️⃣ Escribe "ser" para ver nuestros Servicios disponibles 🦷.',
        '2️⃣ Escribe "doc" para Agendar una consulta. 📅',
        '3️⃣ Escribe "con" para conocer nuestra Ubicación y contacto. 📍',
        '4️⃣ Escribe "calendarios" para probar la lista de calendarios. 📅',
    ], null, null, [flowPruebaCalendar, flowServicios, flowDocs, flowContacto]);

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    });
    const adapterFlow = createFlow([flowPrincipal, flowDocs, flowPruebaCalendar]);
    const adapterProvider = createProvider(BaileysProvider);
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
    QRPortalWeb();
};

main();
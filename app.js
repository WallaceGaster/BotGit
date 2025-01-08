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

const flowAgendarCitaMayor = addKeyword(['1', 'Sí'])
    .addAnswer('Nos puede compartir su información para abrir su expediente clínico y bloquear espacio en agenda \n¿Apellido parterno del paciente?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        if (!sesiones.has(idUsuario)) {
            sesiones.set(idUsuario, {});
        }

        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.apellidoPaterno = ctx.body.trim();
        console.log(`Nombre registrado (${idUsuario}): ${datosUsuario.apellidoPaterno}`);

        if (!datosUsuario.apellidoPaterno) {
            return fallBack('Por favor, ingresa un nombre válido.');
        }
    })
    .addAnswer('Apellido Materno del paciente:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.apellidoMaterno = ctx.body.trim();
        console.log(`Apellido Materno (${idUsuario}): ${datosUsuario.apellidoMaterno}`);

        if (!datosUsuario.apellidoMaterno) {
            return fallBack('Por favor, ingresa un Apellido Paterno válido.');
        }
    })
    .addAnswer('Nombre del paciente:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombre = ctx.body.trim();
        console.log(`Nombre (${idUsuario}): ${datosUsuario.nombre}`);

        if (!datosUsuario.nombre) {
            return fallBack('Por favor, ingresa un Apellido Materno válido.');
        }
    })
    .addAnswer('¿Fue referido por alguno de nuestros pacientes? Si es así, por favor indica su nombre. Si no, simplemente escribe "no" ', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombreReferido = ctx.body.trim();
        console.log(`Nombre referido (${idUsuario}): ${datosUsuario.nombreReferido}`);

        if (!datosUsuario.nombreReferido) {
            return fallBack('Por favor, ingresa un nombre valido.');
        }
    })
    .addAnswer('¿Cuál es su fecha de nacimiento? (Formato: YYYY-MM-DD)', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.fechaNac = ctx.body.trim();
        console.log(`Fecha de Nacimiento (${idUsuario}): ${datosUsuario.fechaNac}`);

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(datosUsuario.fechaNac)) {
            return fallBack('Por favor, ingresa una fecha válida en el formato YYYY-MM-DD.');
        }
    })
    .addAnswer('Por favor, indícanos tu correo electrónico:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.correoElectronico = ctx.body.trim();
        console.log(`Correo Electrónico (${idUsuario}): ${datosUsuario.correoElectronico}`);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(datosUsuario.correoElectronico)) {
            return fallBack('Por favor, ingresa un correo electrónico válido.');
        }
    })
    .addAnswer('¿Como le gusta que le digan?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.apodo = ctx.body.trim();
        console.log(`Apodo (${idUsuario}): ${datosUsuario.apodo}`);

        if (!datosUsuario.apodo) {
            return fallBack('Por favor, ingresa un nombre valido.');
        }
    })
    .addAnswer('¿Tienes alguna condición médica, alergia, enfermedad o estás tomando algún medicamento que el doctor deba conocer? Si no es el caso, por favor escribe "Ninguna".', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.condicion = ctx.body.trim();
        console.log(`Condicion (${idUsuario}): ${datosUsuario.condicion}`);

        if (!datosUsuario.condicion) {
            return fallBack('Por favor, ingresa una condicion valida.');
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
    .addAnswer('¿Cuál es tu motivo de visita?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.motivoVisita = ctx.body.trim();
        console.log(`Motivo de Consulta (${idUsuario}): ${datosUsuario.motivoVisita}`);

        if (!datosUsuario.motivoVisita) {
            return fallBack('Por favor, ingresa un motivo válido.');
        }
    })
    .addAction(async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);

        console.log(`Datos finales del usuario (${idUsuario}):`, datosUsuario);

        try {
            const response = await axios.post('http://localhost:5000/DentalArce/paciente', {
                nombre: datosUsuario.nombre,
                telefonoWhatsapp: datosUsuario.telefono,
                nombreReferido: datosUsuario.nombreReferido,
                horario: datosUsuario.horario || 'Pendiente',
                ApellidoMaterno: datosUsuario.apellidoMaterno,
                ApellidoPaterno: datosUsuario.apellidoPaterno,
                fechaNac: datosUsuario.fechaNac,
                correoElectronico: datosUsuario.correoElectronico,
                apodo: datosUsuario.apodo,
                condicion: datosUsuario.condicion,
                motivoVisita: datosUsuario.motivoVisita,
                nombreTutor: datosUsuario.nombreTutor || null,
            });

            console.log('Respuesta del servidor:', response.data);
            await flowDynamic('¡Gracias! Hemos registrado toda tu información. Te contactaremos pronto para confirmar la cita. 😊');
        } catch (error) {
            console.error('Error al registrar los datos del paciente:', error);
            await flowDynamic('❌ Hubo un error al registrar los datos del paciente. Por favor, inténtalo más tarde.');
        }

        // Eliminar sesión
        sesiones.delete(idUsuario);
    });

const flowAgendarCitaMenor = addKeyword(['2', 'Sí'])
    .addAnswer('Nos puede compartir su información para abrir su expediente clínico y bloquear espacio en agenda \n¿Apellido parterno del menor?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        if (!sesiones.has(idUsuario)) {
            sesiones.set(idUsuario, {});
        }

        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.apellidoPaterno = ctx.body.trim();
        console.log(`Nombre registrado (${idUsuario}): ${datosUsuario.apellidoPaterno}`);

        if (!datosUsuario.apellidoPaterno) {
            return fallBack('Por favor, ingresa un nombre válido.');
        }
    })
    .addAnswer('Apellido Materno del menor:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario); 
        datosUsuario.apellidoMaterno = ctx.body.trim();
        console.log(`Apellido Materno (${idUsuario}): ${datosUsuario.apellidoMaterno}`);

        if (!datosUsuario.apellidoMaterno) {
            return fallBack('Por favor, ingresa un Apellido Paterno válido.');
        }
    })
    .addAnswer('Nombre del menor:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombre = ctx.body.trim();
        console.log(`Apellido Materno (${idUsuario}): ${datosUsuario.nombre}`);

        if (!datosUsuario.nombre) {
            return fallBack('Por favor, ingresa un nombre válido.');
        }
    })
    .addAnswer('Nombre del tutor:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombreTutor = ctx.body.trim();
        console.log(`Apellido Materno (${idUsuario}): ${datosUsuario.nombreTutor}`);

        if (!datosUsuario.nombreTutor) {
            return fallBack('Por favor, ingresa un nombre válido.');
        }
    })
    .addAnswer('¿Fue referido por alguno de nuestros pacientes? Si es así, por favor indica su nombre. Si no, simplemente escribe "no" ', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.nombreReferido = ctx.body.trim();
        console.log(`Nombre referido (${idUsuario}): ${datosUsuario.nombreReferido}`);

        if (!datosUsuario.nombreReferido) {
            return fallBack('Por favor, ingresa un nombre valido.');
        }
    })
    .addAnswer('¿Cuál es su fecha de nacimiento del menor? (Formato: YYYY-MM-DD)', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.fechaNac = ctx.body.trim();
        console.log(`Fecha de Nacimiento (${idUsuario}): ${datosUsuario.fechaNac}`);

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(datosUsuario.fechaNac)) {
            return fallBack('Por favor, ingresa una fecha válida en el formato YYYY-MM-DD.');
        }
    })
    .addAnswer('Correo electrónico de madre, padre o tutor:', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.correoElectronico = ctx.body.trim();
        console.log(`Correo Electrónico (${idUsuario}): ${datosUsuario.correoElectronico}`);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(datosUsuario.correoElectronico)) {
            return fallBack('Por favor, ingresa un correo electrónico válido.');
        }
    })
    .addAnswer('¿Como le gusta que le digan al menor?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.apodo = ctx.body.trim();
        console.log(`Apodo (${idUsuario}): ${datosUsuario.apodo}`);

        if (!datosUsuario.apodo) {
            return fallBack('Por favor, ingresa un nombre valido.');
        }
    })
    .addAnswer('¿Tienes alguna condición médica, alergia, enfermedad o estás tomando algún medicamento que el doctor deba conocer? Si no es el caso, por favor escribe "Ninguna".', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.condicion = ctx.body.trim();
        console.log(`Condicion (${idUsuario}): ${datosUsuario.condicion}`);

        if (!datosUsuario.condicion) {
            return fallBack('Por favor, ingresa una condicion valida.');
        }
    })
    .addAnswer('Número telefónico para confirmar asistencia', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.telefono = ctx.body.trim();
        console.log(`Número telefónico (${idUsuario}): ${datosUsuario.telefono}`);

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(datosUsuario.telefono)) {
            return fallBack('Por favor, ingresa un número de teléfono válido.');
        }
    })
    .addAnswer('¿Cuál es tu motivo de su visita?', { capture: true }, async (ctx, { fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.motivoVisita = ctx.body.trim();
        console.log(`Motivo de Consulta (${idUsuario}): ${datosUsuario.motivoVisita}`);

        if (!datosUsuario.motivoVisita) {
            return fallBack('Por favor, ingresa un motivo válido.');
        }
    })
    .addAction(async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);

        console.log(`Datos finales del usuario (${idUsuario}):`, datosUsuario);

        try {
            const response = await axios.post('http://localhost:5000/DentalArce/paciente', {
                nombre: datosUsuario.nombre,
                telefonoWhatsapp: datosUsuario.telefono,
                nombreReferido: datosUsuario.nombreReferido,
                horario: datosUsuario.horario || 'Pendiente',
                ApellidoMaterno: datosUsuario.apellidoMaterno,
                ApellidoPaterno: datosUsuario.apellidoPaterno,
                fechaNac: datosUsuario.fechaNac,
                correoElectronico: datosUsuario.correoElectronico,
                apodo: datosUsuario.apodo,
                condicion: datosUsuario.condicion,
                motivoVisita: datosUsuario.motivoVisita,
                nombreTutor: datosUsuario.nombreTutor || null,
            });

            console.log('Respuesta del servidor:', response.data);
            await flowDynamic('¡Gracias! Hemos registrado toda tu información. Te contactaremos pronto para confirmar la cita. 😊');
        } catch (error) {
            console.error('Error al registrar los datos del paciente:', error);
            await flowDynamic('❌ Hubo un error al registrar los datos del paciente. Por favor, inténtalo más tarde.');
        }

        // Eliminar sesión
        sesiones.delete(idUsuario);
    });

const flowNoAgendar = addKeyword(['3', 'No'])
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
        '💰 Costo: $700.00 MXN\n\n',
        '➡️ Nuestra atención a pacientes es a partir de los 15 años de edad. \n',
        'Le gustaría reservar una consulta para:',
        '1️⃣ Paciente mayor de edad (18 años o más)',
        '2️⃣ Paciente menos de edad (entre 15 y 17 años)',
        '2️⃣ No deseo una cita por el momento\n',
        'Seleccione el número correspondiente.',
    ], null, null, [flowAgendarCitaMayor, flowAgendarCitaMenor, flowNoAgendar]);

const flowPruebaCalendar = addKeyword(['calendarios', 'prueba calendario'])
    .addAnswer('📅 Obteniendo la lista de citas disponibles, por favor espera...', null, async (ctx, { flowDynamic }) => {
        try {
            // Realiza la petición para obtener los slots disponibles
            const response = await axios.get('http://localhost:5000/DentalArce/getAvailableSlots/ce85ebbb918c7c7dfd7bad2eec6c142012d24c2b17e803e21b9d6cc98bb8472b');
            const slots = response.data;

            if (slots.length === 0) {
                await flowDynamic('❌ No hay citas disponibles en este momento.');
                return;
            }

            // Construye un mensaje con las opciones de citas
            let slotsMessage = '📋 Aquí tienes las citas disponibles:\n';
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                slotsMessage += `${i + 1}. ${slot.day} ${slot.date} de ${slot.start} a ${slot.end}\n`;
            }
            slotsMessage += '\nPor favor, elige una opción ingresando el número correspondiente:';

            // Envía el mensaje con las opciones al usuario
            await flowDynamic(slotsMessage);

            // Espera la respuesta del usuario
            addKeyword([]).addAnswer('', null, async (ctx, { flowDynamic }) => {
                const userChoice = parseInt(ctx.body.trim(), 10);

                // Validación de la opción elegida
                if (isNaN(userChoice) || userChoice < 1 || userChoice > slots.length) {
                    await flowDynamic('❌ Opción no válida. Por favor, intenta de nuevo.');
                    return;
                }

                // Recupera la cita seleccionada por el usuario
                const selectedSlot = slots[userChoice - 1];
                await flowDynamic(`✔️ Has seleccionado la cita:
${selectedSlot.day} ${selectedSlot.date} de ${selectedSlot.start} a ${selectedSlot.end}`);
            });
        } catch (error) {
            console.error('Error al obtener las citas disponibles:', error);
            await flowDynamic('❌ Hubo un error al obtener las citas. Inténtalo más tarde.');
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
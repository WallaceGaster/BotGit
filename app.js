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
    .addAnswer('¿Cuál es el género del paciente, masculino o femenino?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.genero = ctx.body.trim();
        console.log(`Género (${idUsuario}): ${datosUsuario.genero}`);

        if (datosUsuario.genero !== 'masculino' && datosUsuario.genero !== 'femenino') {
            return fallBack('Por favor, ingresa "masculino" o "femenino".');
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
                telefonoPaciente: datosUsuario.telefono,
                nombreReferido: datosUsuario.nombreReferido,
                apeM: datosUsuario.apellidoMaterno,
                apeP: datosUsuario.apellidoPaterno,
                fechaNac: datosUsuario.fechaNac,
                correoElectronico: datosUsuario.correoElectronico,
                apodo: datosUsuario.apodo,
                condicion: datosUsuario.condicion,
                motivoVisita: datosUsuario.motivoVisita,
                genero: datosUsuario.genero,
                nombreTutor: datosUsuario.nombreTutor || null,
                altura: datosUsuario.altura || null,
                peso: datosUsuario.peso || null,
                direccion: datosUsuario.direccion || null,
                alergias: datosUsuario.alergias || null,
                medicamentos: datosUsuario.medicamentos || null,
                idDoctor: datosUsuario.idDoctor || null,
                telefonoWhatsapp: idUsuario,
            });

            console.log('Respuesta del servidor:', response.data);
            await flowDynamic('¡Gracias! Hemos registrado toda tu información. Te contactaremos pronto para confirmar la cita. 😊');
        } catch (error) {
            console.error('Error al registrar los datos del paciente:', error);
            await flowDynamic('❌ Hubo un error al registrar los datos del paciente. Por favor, inténtalo más tarde.');
        }

        // Eliminar sesión
        // sesiones.delete(idUsuario);
    })
    .addAnswer('📅 Obteniendo la lista de citas disponibles, por favor espera...', null, async (ctx, { flowDynamic }) => {
        try {
            // Realiza la petición para obtener los slots disponibles
            console.log('Iniciando solicitud para obtener citas disponibles.');
            const response = await axios.get('http://localhost:5000/DentalArce/getAvailableSlots/ce85ebbb918c7c7dfd7bad2eec6c142012d24c2b17e803e21b9d6cc98bb8472b');
            const slots = response.data;
            console.log('Citas recuperadas:', slots);

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
            slotsMessage += '';

            // Envía el mensaje con las opciones al usuario
            await flowDynamic(slotsMessage);

            // Almacena los slots disponibles en la sesión
            const idUsuario = ctx.from;
            if (!sesiones.has(idUsuario)) {
                sesiones.set(idUsuario, {});
            }
            const datosUsuario = sesiones.get(idUsuario);
            datosUsuario.slots = slots; // Guarda los slots disponibles
        } catch (error) {
            console.error('Error al obtener las citas disponibles:', error);
            await flowDynamic('❌ Hubo un error al obtener las citas. Inténtalo más tarde.');
        }
    })
    .addAnswer('Por favor, elige un número correspondiente a tu cita preferida.', { capture: true }, async (ctx, { fallBack, flowDynamic }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        const slots = datosUsuario?.slots;

        if (!slots || slots.length === 0) {
            await flowDynamic('❌ No hay citas disponibles o se perdió la información. Intenta nuevamente.');
            return;
        }

        const userInput = ctx.body.trim();
        const userChoice = parseInt(userInput, 10);

        if (isNaN(userChoice) || userChoice < 1 || userChoice > slots.length) {
            return fallBack('❌ Opción inválida. Por favor, elige un número válido de la lista.');
        }

        // Recupera el slot seleccionado
        const selectedSlot = slots[userChoice - 1];
        datosUsuario.horario = `${selectedSlot.day} ${selectedSlot.date} de ${selectedSlot.start} a ${selectedSlot.end}`;
        console.log(`Usuario (${idUsuario}) seleccionó la cita:`, datosUsuario.horario);

        // Extrae la fecha y hora de start y end
        const date = selectedSlot.date; // Formato: 2025-01-09
        const startTime = selectedSlot.start; // Formato: 16:00
        const endTime = selectedSlot.end; // Formato: 16:45

        // Convierte a formato "YYYY-MM-DDTHH:MM:SS"
        const startDateTime = `${date}T${startTime}:00`;
        const endDateTime = `${date}T${endTime}:00`;

        // Realiza la solicitud para reservar la cita
        // Realiza la solicitud para reservar la cita
        try {
            const response = await axios.post('http://localhost:5000/DentalArce/crearCitaCV/ce85ebbb918c7c7dfd7bad2eec6c142012d24c2b17e803e21b9d6cc98bb8472b/ee75200b88065c8f339787783c521b9f5bcc11242f09ac9dd1512d23a98fb485', {
                "summary": datosUsuario.nombre || 'Paciente desconocido', // Aquí se envía el nombre del paciente
                "description": datosUsuario.motivoVisita || 'Motivo no especificado', // Aquí se envía el motivo de la visita
                "startDateTime": startDateTime,
                "endDateTime": endDateTime,
            });
            console.log('Respuesta del servidor para reserva:', response.data);
            await flowDynamic(`✅ Tu cita ha sido reservada exitosamente para el ${datosUsuario.horario}.`);
        } catch (error) {
            console.error('Error al reservar la cita:', error);
            await flowDynamic('❌ Hubo un error al reservar la cita. Por favor, inténtalo más tarde.');
        }


        // Limpia los datos de los slots para evitar inconsistencias
        sesiones.delete(idUsuario);
        delete datosUsuario.slots;
    })


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
    .addAnswer('¿Cuál es el género del menor, masculino o femenino?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        datosUsuario.genero = ctx.body.trim();
        console.log(`Género (${idUsuario}): ${datosUsuario.genero}`);

        if (datosUsuario.genero !== 'masculino' && datosUsuario.genero !== 'femenino') {
            return fallBack('Por favor, ingresa "masculino" o "femenino".');
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
                telefonoPaciente: datosUsuario.telefono,
                nombreReferido: datosUsuario.nombreReferido,
                apeM: datosUsuario.apellidoMaterno,
                apeP: datosUsuario.apellidoPaterno,
                fechaNac: datosUsuario.fechaNac,
                correoElectronico: datosUsuario.correoElectronico,
                apodo: datosUsuario.apodo,
                condicion: datosUsuario.condicion,
                motivoVisita: datosUsuario.motivoVisita,
                genero: datosUsuario.genero,
                nombreTutor: datosUsuario.nombreTutor || null,
                altura: datosUsuario.altura || null,
                peso: datosUsuario.peso || null,
                direccion: datosUsuario.direccion || null,
                alergias: datosUsuario.alergias || null,
                medicamentos: datosUsuario.medicamentos || null,
                idDoctor: datosUsuario.idDoctor || null,
                telefonoWhatsapp: idUsuario,
            });

            console.log('Respuesta del servidor:', response.data);
            await flowDynamic('¡Gracias! Hemos registrado toda tu información. Te contactaremos pronto para confirmar la cita. 😊');
        } catch (error) {
            console.error('Error al registrar los datos del paciente:', error);
            await flowDynamic('❌ Hubo un error al registrar los datos del paciente. Por favor, inténtalo más tarde.');
        }

        // Eliminar sesión
        // sesiones.delete(idUsuario);
    })
    .addAnswer('📅 Obteniendo la lista de citas disponibles, por favor espera...', null, async (ctx, { flowDynamic }) => {
        try {
            // Realiza la petición para obtener los slots disponibles
            console.log('Iniciando solicitud para obtener citas disponibles.');
            const response = await axios.get('http://localhost:5000/DentalArce/getAvailableSlots/ce85ebbb918c7c7dfd7bad2eec6c142012d24c2b17e803e21b9d6cc98bb8472b');
            const slots = response.data;
            console.log('Citas recuperadas:', slots);

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
            slotsMessage += '';

            // Envía el mensaje con las opciones al usuario
            await flowDynamic(slotsMessage);

            // Almacena los slots disponibles en la sesión
            const idUsuario = ctx.from;
            if (!sesiones.has(idUsuario)) {
                sesiones.set(idUsuario, {});
            }
            const datosUsuario = sesiones.get(idUsuario);
            datosUsuario.slots = slots; // Guarda los slots disponibles
        } catch (error) {
            console.error('Error al obtener las citas disponibles:', error);
            await flowDynamic('❌ Hubo un error al obtener las citas. Inténtalo más tarde.');
        }
    })
    .addAnswer('Por favor, elige un número correspondiente a tu cita preferida.', { capture: true }, async (ctx, { fallBack, flowDynamic }) => {
        const idUsuario = ctx.from;
        const datosUsuario = sesiones.get(idUsuario);
        const slots = datosUsuario?.slots;

        if (!slots || slots.length === 0) {
            await flowDynamic('❌ No hay citas disponibles o se perdió la información. Intenta nuevamente.');
            return;
        }

        const userInput = ctx.body.trim();
        const userChoice = parseInt(userInput, 10);

        if (isNaN(userChoice) || userChoice < 1 || userChoice > slots.length) {
            return fallBack('❌ Opción inválida. Por favor, elige un número válido de la lista.');
        }

        // Recupera el slot seleccionado
        const selectedSlot = slots[userChoice - 1];
        datosUsuario.horario = `${selectedSlot.day} ${selectedSlot.date} de ${selectedSlot.start} a ${selectedSlot.end}`;
        console.log(`Usuario (${idUsuario}) seleccionó la cita:`, datosUsuario.horario);

        // Extrae la fecha y hora de start y end
        const date = selectedSlot.date; // Formato: 2025-01-09
        const startTime = selectedSlot.start; // Formato: 16:00
        const endTime = selectedSlot.end; // Formato: 16:45

        // Convierte a formato "YYYY-MM-DDTHH:MM:SS"
        const startDateTime = `${date}T${startTime}:00`;
        const endDateTime = `${date}T${endTime}:00`;

        // Realiza la solicitud para reservar la cita
        try {
            const response = await axios.post('http://localhost:5000/DentalArce/crearCitaCV/ce85ebbb918c7c7dfd7bad2eec6c142012d24c2b17e803e21b9d6cc98bb8472b/ee75200b88065c8f339787783c521b9f5bcc11242f09ac9dd1512d23a98fb485', {
                "summary": datosUsuario.nombre || 'Paciente desconocido', // Aquí se envía el nombre del paciente
                "description": datosUsuario.motivoVisita || 'Motivo no especificado', // Aquí se envía el motivo de la visita
                "startDateTime": startDateTime,
                "endDateTime": endDateTime,
            });
            console.log('Respuesta del servidor para reserva:', response.data);
            await flowDynamic(`✅ Tu cita ha sido reservada exitosamente para el ${datosUsuario.horario}.`);
        } catch (error) {
            console.error('Error al reservar la cita:', error);
            await flowDynamic('❌ Hubo un error al reservar la cita. Por favor, inténtalo más tarde.');
        }

        // Limpia los datos de los slots para evitar inconsistencias
        sesiones.delete(idUsuario);
        delete datosUsuario.slots;
    })

const flowMensaje = addKeyword('mensaje')
    .addAnswer('Espera un momento. . .', null, async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const telefonoUsuario = ctx.from; // Este campo contiene el número de WhatsApp del usuario.

        // Verifica si el usuario está registrado
        try {
            const response = await axios.get(`http://localhost:5000/DentalArce/buscarPacientePorTelefono/${telefonoUsuario}`);
            const paciente = response.data;

            if (paciente && paciente.nombre) {
                console.log(`Información recuperada del usuario (${idUsuario}):`, paciente);

                // Almacena la información del usuario en la sesión
                if (!sesiones.has(idUsuario)) {
                    sesiones.set(idUsuario, {});
                }
                const datosUsuario = sesiones.get(idUsuario);
                datosUsuario.idPaciente = paciente._id; // Asegúrate de que `_id` es el identificador del paciente
                datosUsuario.nombre = paciente.nombre;

                await flowDynamic(`Estamos a tu servicio, ${paciente.nombre}.`);
            } else {
                // Mensaje si el usuario no está registrado
                await flowDynamic([
                    'No encontré tu información en nuestro sistema.',
                    '¿Te gustaría registrarte para agendar una cita? 😊'
                ]);
            }
        } catch (error) {
            console.error('Error al verificar el número de teléfono:', error);
            await flowDynamic('Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites: \n 1️⃣ Escribe "ser" para ver nuestros Servicios disponibles 🦷. \n 2️⃣ Escribe "doc" para Agendar una consulta. 📅 \n 3️⃣ Escribe "con" para conocer nuestra Ubicación y contacto. 📍');
        }
    })
    .addAnswer('Por favor, escribe tu mensaje:', { capture: true }, async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;

        // Recupera los datos del usuario desde la sesión
        const datosUsuario = sesiones.get(idUsuario);

        if (!datosUsuario || !datosUsuario.idPaciente) {
            console.error('No se encontró información del usuario en la sesión.');
            return await flowDynamic('Parece que no tenemos tus datos registrados. Por favor, vuelve a intentarlo o contáctanos directamente.');
        }

        const mensajeUsuario = ctx.body.trim(); // Captura el mensaje del usuario
        console.log(`Mensaje del usuario (${idUsuario}): ${mensajeUsuario}`); // Imprime el mensaje en la consola

        try {
            const response = await axios.post('http://localhost:5000/DentalArce/addMensaje', {
                idPaciente: datosUsuario.idPaciente,
                nombrePaciente: datosUsuario.nombre,
                telefono: idUsuario,
                mensaje: mensajeUsuario,
                estado: 'noleido',
                fecha: new Date().toISOString(), // Fecha actual
            });
            console.log('Respuesta del servidor para el mensaje:', response.data);
            await flowDynamic('✅ Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.');
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            await flowDynamic('❌ Hubo un error al enviar tu mensaje. Por favor, inténtalo más tarde.');
        }
    });


const flowMensajeUrgente = addKeyword('urgente')
    .addAnswer('Espera un momento. . .', null, async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const telefonoUsuario = ctx.from; // Este campo contiene el número de WhatsApp del usuario.

        // Verifica si el usuario está registrado
        try {
            const response = await axios.get(`http://localhost:5000/DentalArce/buscarPacientePorTelefono/${telefonoUsuario}`);
            const paciente = response.data;

            if (paciente && paciente.nombre) {
                console.log(`Información recuperada del usuario (${idUsuario}):`, paciente);

                // Almacena la información del usuario en la sesión
                if (!sesiones.has(idUsuario)) {
                    sesiones.set(idUsuario, {});
                }
                const datosUsuario = sesiones.get(idUsuario);
                datosUsuario.idPaciente = paciente._id; // Asegúrate de que `_id` es el identificador del paciente
                datosUsuario.nombre = paciente.nombre;

                await flowDynamic(`Estamos a tu servicio, ${paciente.nombre}.`);
            } else {
                // Mensaje si el usuario no está registrado
                await flowDynamic([
                    'No encontré tu información en nuestro sistema.',
                    '¿Te gustaría registrarte para agendar una cita? 😊'
                ]);
            }
        } catch (error) {
            console.error('Error al verificar el número de teléfono:', error);
            await flowDynamic('Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites: \n 1️⃣ Escribe "ser" para ver nuestros Servicios disponibles 🦷. \n 2️⃣ Escribe "doc" para Agendar una consulta. 📅 \n 3️⃣ Escribe "con" para conocer nuestra Ubicación y contacto. 📍');
        }
    })
    .addAnswer('Por favor, escribe tu mensaje urgente:', { capture: true }, async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;

        // Recupera los datos del usuario desde la sesión
        const datosUsuario = sesiones.get(idUsuario);

        if (!datosUsuario || !datosUsuario.idPaciente) {
            console.error('No se encontró información del usuario en la sesión.');
            return await flowDynamic('Parece que no tenemos tus datos registrados. Por favor, vuelve a intentarlo o contáctanos directamente.');
        }

        const mensajeUsuario = ctx.body.trim(); // Captura el mensaje del usuario
        console.log(`Mensaje del usuario (${idUsuario}): ${mensajeUsuario}`); // Imprime el mensaje en la consola

        try {
            const response = await axios.post('http://localhost:5000/DentalArce/addMensaje', {
                idPaciente: datosUsuario.idPaciente,
                nombrePaciente: datosUsuario.nombre,
                telefono: idUsuario,
                mensaje: mensajeUsuario,
                estado: 'urgente',
                fecha: new Date().toISOString(), // Fecha actual
            });
            console.log('Respuesta del servidor para el mensaje:', response.data);
            await flowDynamic('✅ Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.');
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            await flowDynamic('❌ Hubo un error al enviar tu mensaje. Por favor, inténtalo más tarde.');
        }
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
    ], null, null, [flowAgendarCitaMayor, flowAgendarCitaMenor, flowNoAgendar, flowMensajeUrgente]);

const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'inicio'])
    .addAnswer('🙌 ¡Hola, bienvenido a Dental Clinic Boutique! 😊', null, async (ctx, { flowDynamic }) => {
        const idUsuario = ctx.from;
        const telefonoUsuario = ctx.from; // Este campo contiene el número de WhatsApp del usuario.

        // Verifica si el usuario está registrado
        try {
            const response = await axios.get(`http://localhost:5000/DentalArce/buscarPacientePorTelefono/${telefonoUsuario}`);
            const paciente = response.data;

            if (paciente && paciente.nombre) {
                // Mensaje si el usuario ya está registrado
                await flowDynamic([
                    `¡Hola, ${paciente.nombre}! 👋\n\n` +
                    `Nos alegra verte de nuevo. Parece que ya estás registrado en nuestro sistema. 😊\n\n` +
                    `Aquí tienes algunas opciones para que podamos ayudarte mejor:\n\n` +
                    `⚡ *Escribe "Urgente"* si necesitas atención inmediata para algo que no puede esperar.\n` +
                    `📅 *Escribe "Mensaje"* si necesitas información o quieres agendar una cita.\n` +
                    `🦷 *Escribe "ser"* para descubrir nuestros servicios disponibles.\n` +
                    `📍 *Escribe "con"* para conocer nuestra ubicación y formas de contacto.\n\n` +
                    `Estamos aquí para ayudarte. ¡Escribe la opción que necesites! 😊`
                ]);
            } else {
                // Mensaje si el usuario no está registrado
                await flowDynamic([
                    'No encontré tu información en nuestro sistema.',
                    '¿Te gustaría registrarte para agendar una cita? 😊'
                ]);
            }
        } catch (error) {
            console.error('Error al verificar el número de teléfono:', error);
            await flowDynamic('Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites: \n' +
                '1️⃣ Escribe "ser" para ver nuestros Servicios disponibles 🦷.\n' +
                '2️⃣ Escribe "doc" para Agendar una consulta. 📅\n' +
                '3️⃣ Escribe "con" para conocer nuestra Ubicación y contacto. 📍',);
        }
    })
    .addAnswer([
        'Esperamos tu respuesta',
    ], null, null, [flowServicios, flowDocs, flowContacto, flowMensaje, flowMensajeUrgente]);


const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    });
    const adapterFlow = createFlow([flowPrincipal, flowDocs]);
    const adapterProvider = createProvider(BaileysProvider);
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
    QRPortalWeb();
};

main(); 
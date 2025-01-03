const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

// Variables globales para almacenar los datos
let nombre, turno, nombreRefe, horario, nomCompleto, fechNac, correoEle, apodo, condicion, motvisita, telefonowhatsapp;

// Flujo para agendar una consulta
const flowAgendarCita = addKeyword(['1', 'Sí'])
    .addAnswer('📅 Para agendar una consulta de valoración, por favor proporcione los siguientes detalles:',null, async (ctx) => {
        console.log(ctx)

        const numeroDeWhatsapp = ctx.from
        telefonowhatsapp = numeroDeWhatsapp
        const mensajeRecibido = ctx.body 
        console.log(`numero recuperado: ${telefonowhatsapp}`);
    })
    .addAnswer('¿Nombre de la persona para quién sería la cita?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        nombre = ctx.body;
        console.log(`datos del usuario: ${nombre}`);
        if (!nombre.trim()) {
            return fallBack();  // Si el nombre está vacío, vuelve a preguntar
        }
    })
    .addAnswer('¿Es referido de algun paciente de nosotros?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        nombreRefe = ctx.body;
        console.log(`Nombre referido: ${nombreRefe}`);
        if (!nombreRefe.trim()) {
            return fallBack();  // Si no hay respuesta, vuelve a preguntar
        }
    })
    .addAnswer('¿En qué turno prefieres, mañana o tarde?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        turno = ctx.body.toLowerCase();
        console.log(`Turno elegido: ${turno}`);
        if (turno !== 'mañana' && turno !== 'tarde') {
            return fallBack();  // Verifica si la respuesta es "mañana" o "tarde"
        }
    })
    .addAnswer(
        '¿Qué horario prefieres? \n\n Lunes-Viernes \n 10:00am \n 11:30am \n 1:00pm \n 4:00pm  \n 5:30pm \n 7:00pm ',
        { capture: true },
        async (ctx, { flowDynamic, fallBack }) => {
            horario = ctx.body;
            console.log(`Horario del usuario: ${horario}`);
            const horariosValidos = ['10:00am', '11:30am', '1:00pm', '4:00pm', '5:30pm', '7:00pm'];
            if (!horariosValidos.includes(horario.trim())) {
                return fallBack();  // Si el horario no es válido, vuelve a preguntar
            }
        }
    )
    .addAnswer('🦷 Nos puede compartir su información para abrir su expediente clínico y bloquear espacio en agenda\n\n Nombre completo como en su identificación oficial :', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        nomCompleto = ctx.body;
        console.log(`Nombre completo: ${nomCompleto}`);
        if (!nomCompleto.trim()) {
            return fallBack();  // Si el nombre completo está vacío, vuelve a preguntar
        }
    })
    .addAnswer('Fecha de nacimiento en formato MM/DD/YYYY?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        fechNac = ctx.body;
        console.log(`Fecha de nacimiento: ${fechNac}`);
        const fechaRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!fechaRegex.test(fechNac)) {
            return fallBack();  // Si el formato de fecha no es correcto, vuelve a preguntar
        }
    })
    .addAnswer('Correo Electrónico', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        correoEle = ctx.body;
        console.log(`Correo del usuario: ${correoEle}`);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correoEle)) {
            return fallBack();  // Si el correo no es válido, vuelve a preguntar
        }
    })
    .addAnswer('¿Cómo prefiere que le llamen?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        apodo = ctx.body;
        console.log(`Apodo: ${apodo}`);
        if (!apodo.trim()) {
            return fallBack();  // Si el apodo está vacío, vuelve a preguntar
        }
    })
    .addAnswer('Condición, alergia, enfermedad o medicamentos que esté tomando, que el Doctor deba de conocer', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        condicion = ctx.body;
        console.log(`Condición: ${condicion}`);
        if (!condicion.trim()) {
            return fallBack();  // Si la condición está vacía, vuelve a preguntar
        }
    })
    .addAnswer('¿Motivo de su visita?', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        motvisita = ctx.body;
        console.log(`Motivo de la visita: ${motvisita}`);
        if (!motvisita.trim()) {
            return fallBack();  // Si no se ingresa un motivo, vuelve a preguntar
        }
        await flowDynamic('*Quedamos atentos a sus datos para bloquear espacio en agenda, de no ' +
            'recibir la información el espacio proporcionado queda liberado.* ');
        await flowDynamic('¡Su próxima cita ha quedado agendada! :) Será un placer saludarle pronto');
        await flowDynamic('Dos días previos se enviará mensaje de confirmación para asistencia a su cita 🤗.');
    })
    .addAction(async () => {
        // Resumen de datos
        console.log('---------------------------Datos del usuario registrados:---------------');
        console.log(`Nombre: ${nombre}`);
        console.log(`Nombre de la persona referida: ${nombreRefe}`);
        console.log(`Turno: ${turno}`);
        console.log(`Horario: ${horario}`);
        console.log(`Nombre completo: ${nomCompleto}`);
        console.log(`Fecha de nacimiento: ${fechNac}`);
        console.log(`Correo electrónico: ${correoEle}`);
        console.log(`Apodo: ${apodo}`);
        console.log(`Condición médica: ${condicion}`);
        console.log(`Motivo de la visita: ${motvisita}`);
        console.log(`numero recuperado: ${telefonowhatsapp}`);
    });


const flowNoAgendar = addKeyword(['2', 'No']) 
    .addAnswer('😞 Entendemos que no deseas agendar una cita en este momento.')
    .addAnswer('Si cambias de opinión, no dudes en contactarnos nuevamente. ¡Estaremos aquí para ayudarte! 😊')
    .addAnswer(['Ingrese "inicio" para regresar al menú principal.',
    ]);



// Flujo para servicios
const flowServicios = addKeyword('ser')
    .addAnswer('🦷 Ofrecemos los siguientes servicios en Dental Clinic Boutique By Dr. Arce:')
    .addAnswer([
        '1. Odontología general',
        '2. Rehabilitación y estética dental',
        '3. Especialidades como Ortodoncia, Endodoncia, Periodoncia, y más.',
        '\nIngrese "inicio" para regresar al menú principal.',
    ]);

// Flujo para contacto y ubicación
const flowContacto = addKeyword('con')
    .addAnswer('📍 Estamos ubicados en Torre Médica San Telmo, Piso 6, Consultorio 617 y 618, Aguascalientes, México.')
    .addAnswer([
        'Prol. Gral. Ignacio Zaragoza #1004 Col. Calicantos II, Cp. 20116.',
        'Google Maps: https://maps.app.goo.gl/PRsf7HVZvcjy9J2r9',
        '\nIngrese "inicio" para regresar al menú principal.',
    ]);

// Flujo de documentación, que ahora solo se ejecutará al seleccionar '2' explícitamente.
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

// Flujo principal de bienvenida
const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'inicio'])
    .addAnswer('🙌 ¡Hola, bienvenido a Dental Clinic Boutique! 😊')
    .addAnswer([
        'Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites:',
        '1️⃣ Escribe "*ser*" para ver nuestros *Servicios disponibles* 🦷.',
        '2️⃣ Escribe "*doc*" para *Agendar una consulta*. 📅',
        '3️⃣ Escribe "*con*" para conocer nuestra *Ubicación y contacto*. 📍',
    ], null, null, [flowServicios, flowDocs, flowContacto]);

// Configuración del bot
const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowDocs]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    // Iniciar portal QR para escaneo
    QRPortalWeb();
};

main();
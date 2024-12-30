const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

// Variables globales para almacenar los datos
let nombre, edad, turno, nombreRefe, horario, nomCompleto, fechNac, correoEle, apodo, condicion, numTelefonico, motvisita;

// Flujo para agendar una consulta
const flowAgendarCita = addKeyword('1')
    .addAnswer('📅 Para agendar una consulta de valoración, por favor proporcione los siguientes detalles:')
    .addAnswer('¿Nombre de la persona para quién sería la cita?', { capture: true }, async (ctx, { flowDynamic }) => {
        nombre = ctx.body;
        console.log(`Nombre del usuario: ${nombre}`);
        await flowDynamic('Gracias por tu nombre.');
    })
    .addAnswer('¿Es referido de algun paciente de nosotros?', { capture: true }, async (ctx, { flowDynamic }) => {
        edad = ctx.body;
        console.log(`Edad del usuario: ${nombreRefe}`);
        await flowDynamic('Gracias por tu edad.');
    })
    .addAnswer('¿En qué turno prefieres, mañana o tarde?', { capture: true }, async (ctx, { flowDynamic }) => {
        turno = ctx.body;
        console.log(`Turno del usuario: ${turno}`);
        await flowDynamic('Gracias por compartir el turno que prefieres.');
    })
    .addAnswer('¿Qué horario quieres en formato MM/DD/YYYY?', { capture: true }, async (ctx, { flowDynamic }) => {
        horario = ctx.body;
        console.log(`Horario del usuario: ${horario}`);
        await flowDynamic('Gracias por compartir el horario que prefieres.');
    })
    .addAnswer('🦷 Nos puede compartir su información para abrir su expediente clínico y bloquear espacio en agenda\n\n Nombre completo como en su identificación oficial :', { capture: true }, async (ctx, { flowDynamic }) => {
        nomCompleto = ctx.body;
        console.log(`Nombre completo: ${nomCompleto}`);
        await flowDynamic('Gracias por compartir el nombre.');
    })
    .addAnswer('Fecha de nacimiento en formato MM/DD/YYYY?', { capture: true }, async (ctx, { flowDynamic }) => {
        fechNac = ctx.body;
        console.log(`FechaNac del usuario: ${fechNac}`);
        await flowDynamic('Gracias por compartir su fecha de nacimiento.');
    })
    .addAnswer('Correo Electrónico', { capture: true }, async (ctx, { flowDynamic }) => {
        correoEle = ctx.body;
        console.log(`Correo del usuario: ${correoEle}`);
        await flowDynamic('Gracias por compartir su correo electrónico.');
    })
    .addAnswer('¿Cómo prefiere que le llamen?', { capture: true }, async (ctx, { flowDynamic }) => {
        apodo = ctx.body;
        console.log(`Apodo: ${apodo}`);
        await flowDynamic('Gracias por compartir su preferencia.');
    })
    .addAnswer('Condición, alergia, enfermedad o medicamentos que esté tomando, que el Doctor deba de conocer', { capture: true }, async (ctx, { flowDynamic }) => {
        condicion = ctx.body;
        console.log(`Condición: ${condicion}`);
        await flowDynamic('Gracias por compartir su condición.');
    })
    .addAnswer('Número telefónico para confirmar asistencia', { capture: true }, async (ctx, { flowDynamic }) => {
        numTelefonico = ctx.body;
        console.log(`Número telefónico: ${numTelefonico}`);
        await flowDynamic('Gracias por compartir su número.');
    })
    .addAnswer('¿Motivo de su visita?', { capture: true }, async (ctx, { flowDynamic }) => {
        motvisita = ctx.body;
        console.log(`Motivo de la visita: ${motvisita}`);
        await flowDynamic('Gracias por compartir su motivo.');
        await flowDynamic('*Quedamos atentos a sus datos para bloquear espacio en agenda, de no ' +
            'recibir la información el espacio proporcionado queda liberado.* ');
        await flowDynamic('¡Su próxima cita ha quedado agendada! :) Será un placer saludarle pronto');
        await flowDynamic('Dos días previos se enviará mensaje de confirmación para asistencia a su cita 🤗.');
    })
    .addAction(async () => {
        // Resumen de datos
        console.log('Datos del usuario registrados:');
        console.log(`Nombre: ${nombre}`);
        console.log(`Nombre de la persona referida: ${nombreRefe}`);
        console.log(`Turno: ${turno}`);
        console.log(`Horario: ${horario}`);
        console.log(`Nombre completo: ${nomCompleto}`);
        console.log(`Fecha de nacimiento: ${fechNac}`);
        console.log(`Correo electrónico: ${correoEle}`);
        console.log(`Apodo: ${apodo}`);
        console.log(`Condición médica: ${condicion}`);
        console.log(`Número telefónico: ${numTelefonico}`);
        console.log(`Motivo de la visita: ${motvisita}`);
    });

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
    ], null, null, [flowAgendarCita]);

// Flujo principal de bienvenida
const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
    .addAnswer('🙌 ¡Hola, bienvenido a Dental Clinic Boutique! 😊')
    .addAnswer([
        'Estoy aquí para ayudarte. Por favor, escribe la palabra clave según lo que necesites:',
        '1️⃣ Escribe *ser* para ver nuestros *Servicios disponibles* 🦷.',
        '2️⃣ Escribe *doc* para *Agendar una consulta*. 📅',
        '3️⃣ Escribe *con* para conocer nuestra *Ubicación y contacto*. 📍',
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
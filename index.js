const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Variables globales para saber el estado y guardar la imagen del QR
let qrImageUrl = '';
let botStatus = 'Iniciando...';

// Esta es la ruta secreta que tu panel PHP consultará
app.get('/api/qr', (req, res) => {
    // Para que tu cPanel pueda leerlo sin bloqueos de seguridad (CORS)
    res.header("Access-Control-Allow-Origin", "*");
    res.json({ status: botStatus, qr: qrImageUrl });
});

app.listen(port, () => console.log(`API del QR activa en puerto ${port}`));

// Configuración del Bot
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

// Cuando WhatsApp pide escanear, generamos una imagen real en Base64
client.on('qr', async (qr) => {
    botStatus = 'Esperando_QR';
    qrImageUrl = await qrcode.toDataURL(qr); // Magia: Convierte el código a imagen PNG
    console.log('NUEVO QR GENERADO Y LISTO PARA ENVIAR AL PANEL');
});

// Cuando escaneas exitosamente
client.on('ready', () => {
    botStatus = 'Conectado';
    qrImageUrl = ''; // Borramos el QR porque ya no se necesita
    console.log('✅ ¡Bot conectado exitosamente! Listo para vender.');
});

// Cuando se desconecta o cierra sesión
client.on('disconnected', (reason) => {
    botStatus = 'Desconectado';
    client.initialize(); // Intentar reconectar o pedir QR de nuevo
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    if (texto === '!catalogo' || texto === 'catalogo' || texto === 'catálogo') {
        msg.reply('⏳ Consultando el catálogo más actualizado, un momento por favor...');
        
        try {
            // AQUÍ CONECTA CON TU CPANEL
            const urlAPI = 'https://tecnoloko.com/api_bot.php?accion=catalogo&token=tecnoloko_bot_2026_secreto';
            const response = await axios.get(urlAPI);

            if (response.data.status === 'success') {
                let mensajeCatalogo = '*🎬 CATÁLOGO DE SERVICIOS TECNOLOKO 🍿*\n\n';
                const productos = response.data.data;

                productos.forEach(prod => {
                    mensajeCatalogo += `✅ *${prod.nombre}*\n`;
                    mensajeCatalogo += `🔹 1 Mes: S/ ${prod.precio_base}\n`;
                    if (prod.tarifas_dinamicas && prod.tarifas_dinamicas.length > 0) {
                        prod.tarifas_dinamicas.forEach(tarifa => {
                            mensajeCatalogo += `🔹 ${tarifa.nombre_duracion}: S/ ${tarifa.precio}\n`;
                        });
                    }
                    mensajeCatalogo += `\n`;
                });
                mensajeCatalogo += `👉 Para adquirir un servicio, responde a este mensaje.`;
                msg.reply(mensajeCatalogo);
            } else {
                msg.reply('❌ Lo siento, no pude leer el catálogo en este momento.');
            }
        } catch (error) {
            msg.reply('❌ Nuestro sistema se está actualizando. Vuelve a intentar en unos minutos.');
        }
    } 
    else if (texto === 'hola' || texto === 'buenas' || texto === 'info') {
        msg.reply('¡Hola! 👋 Soy el asistente virtual de *Tecnoloko*.\n\nEscribe la palabra *!catalogo* para ver todos nuestros precios y combos actualizados.');
    }
});

client.initialize();

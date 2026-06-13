const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// Esto es para que Render.com no apague el bot
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('El Bot de Tecnoloko está en línea y funcionando.'));
app.listen(port, () => console.log(`Servidor web activo en el puerto ${port}`));

// Configuración del Bot de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Truco obligatorio para servidores en la nube
    }
});

client.on('qr', (qr) => {
    console.log('=========================================');
    console.log('ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP');
    console.log('=========================================');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ ¡Bot conectado exitosamente! Listo para vender.');
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    // Palabras mágicas para mostrar el catálogo
    if (texto === '!catalogo' || texto === 'catalogo' || texto === 'catálogo') {
        msg.reply('⏳ Consultando el catálogo más actualizado, un momento por favor...');
        
        try {
            // AQUÍ CONECTA CON TU CPANEL (Cambia tecnoloko.com si es necesario)
            const urlAPI = 'https://tecnoloko.com/api_bot.php?accion=catalogo&token=tecnoloko_bot_2026_secreto';
            const response = await axios.get(urlAPI);

            if (response.data.status === 'success') {
                let mensajeCatalogo = '*🎬 CATÁLOGO DE SERVICIOS TECNOLOKO 🍿*\n\n';
                const productos = response.data.data;

                productos.forEach(prod => {
                    mensajeCatalogo += `✅ *${prod.nombre}*\n`;
                    mensajeCatalogo += `🔹 1 Mes: S/ ${prod.precio_base}\n`;
                    
                    // Sumamos los combos (3 meses, 6 meses, etc) si los tiene
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
            console.error(error);
            msg.reply('❌ Nuestro sistema se está actualizando. Vuelve a intentar en unos minutos.');
        }
    } 
    // Mensaje de saludo básico
    else if (texto === 'hola' || texto === 'buenas' || texto === 'info') {
        msg.reply('¡Hola! 👋 Soy el asistente virtual de *Tecnoloko*.\n\nEscribe la palabra *!catalogo* para ver todos nuestros precios y combos actualizados.');
    }
});

client.initialize();

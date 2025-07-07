// Файл: demo/server.js (Финальная исправленная версия)

const express = require('express');
const browserify = require('browserify');
const path = require('path');
const stream = require('stream');
const slightUI = require('../index.js');

const app = express();
const PORT = 3000;

function escapePath(p) { return p.replace(/\\/g, '\\\\'); }

app.get('/bundle.js', (req, res) => {
    console.log('[Server] Запрос на /bundle.js. Начинаю сборку...');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    try {
        const coreFiles = slightUI.builderAPI.getCoreFilePaths();
        const hybridData = slightUI.builderAPI.getHybridComponentData();
        const entryPointContent = `
            const { createReactive, createEffect } = require('${escapePath(coreFiles.reactive)}');
            const { createUI } = require('${escapePath(coreFiles.api)}');
            const hybridComponentData = ${JSON.stringify(hybridData, null, 2)};
            const UI = createUI(hybridComponentData, { createReactive, createEffect });
            const appCode = require('${escapePath(path.join(__dirname, 'app.js'))}');
            appCode(UI);
        `;
        const b = browserify();
        const readable = new stream.Readable();
        readable._read = () => {};
        readable.push(entryPointContent);
        readable.push(null);
        b.add(readable, { basedir: path.resolve(__dirname, '..') });
        const bundleStream = b.bundle();
        bundleStream.on('error', (err) => {
            console.error("[Server] Ошибка сборки Browserify:", err.message);
            const errorMessage = `console.error(\`[SlightUI Build Error] ${JSON.stringify(err.message)}\`);`;
            if (!res.headersSent) res.status(500).send(errorMessage);
        });
        bundleStream.pipe(res);
    } catch (error) {
        console.error("[Server] Критическая ошибка:", error);
        if (!res.headersSent) res.status(500).send("console.error('Критическая ошибка на сервере сборки.');");
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SlightStack Modular</title>
            <style>
                html {
                    box-sizing: border-box;
                }
                *, *:before, *:after {
                    box-sizing: inherit;
                }
                body { 
                    display: flex; /* <-- НОВЫЕ СТИЛИ */
                    align-items: flex-start; /* Центрируем по вертикали (сверху) */
                    justify-content: center; /* Центрируем по горизонтали */
                    min-height: 100vh; /* Минимальная высота, чтобы центрирование работало */
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    background-color: #f4f4f9;
                    padding-top: 40px; /* Отступ сверху, чтобы не прилипало */
                }
            </style>
        </head>
        <body>
            <div id="app"></div>
            <script src="/bundle.js"></script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightStack Modular Demo запущено на http://localhost:${PORT}`);
    console.log('   Остановите сервер через Ctrl+C.');
});
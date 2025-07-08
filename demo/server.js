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

        // [ИЗМЕНЕНИЕ] Добавляем хелпер для безопасной генерации путей.
        // Он сразу выдаст ошибку, если ключ не найден, и скажет, какой именно.
        function requireCoreFile(key) {
            const filePath = coreFiles[key];
            if (!filePath) {
                // Эта ошибка будет видна на сервере и поможет при отладке.
                throw new Error(`[SlightUI Build] Ошибка: не найден путь для ключа ядра '${key}'. Проверьте getCoreFilePaths в index.js.`);
            }
            return escapePath(filePath);
        }

        // [ИЗМЕНЕНИЕ] Переписываем точку входа, используя новые, модульные файлы.
        const entryPointContent = `
            // Reactivity
            const { createEffect } = require('${requireCoreFile('reactivityEffect')}');
            const { createReactive } = require('${requireCoreFile('reactivityReactive')}');

            // API и сборка приложения
            const { createUI } = require('${requireCoreFile('api')}');
            
            // Собираем зависимости для createUI
            const reactiveFns = { createReactive, createEffect };
            const hybridComponentData = ${JSON.stringify(hybridData, null, 2)};

            const UI = createUI(hybridComponentData, reactiveFns);
            
            // Запускаем пользовательское приложение
            const appCode = require('${requireCoreFile('appCode')}'); // Используем новый ключ для app.js
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
        console.error("[Server] Критическая ошибка:", error.message);
        if (!res.headersSent) res.status(500).send(`console.error('Критическая ошибка на сервере сборки: ${JSON.stringify(error.message)}');`);
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
                html { box-sizing: border-box; }
                *, *:before, *:after { box-sizing: inherit; }
                body { 
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    background-color: #f4f4f9;
                    padding-top: 40px;
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
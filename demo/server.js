// Файл: demo/server.js
// Задача: Запускать локальный dev-сервер и на лету собирать
// клиентский JS-бандл с помощью Browserify, используя модульное ядро.

const express = require('express');
const browserify = require('browserify');
const path = require('path');
const stream = require('stream');
const slightUI = require('../index.js'); // Наш обновленный API пакета

const app = express();
const PORT = 3000;

// Утилита для корректной работы путей в Windows
function escapePath(p) {
    return p.replace(/\\/g, '\\\\');
}

// Эндпоинт, который будет отдавать наш JS-бандл
app.get('/bundle.js', (req, res) => {
    console.log('[Server] Запрос на /bundle.js. Начинаю сборку...');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');

    try {
        // Получаем все необходимые данные и пути через наш API
        const coreFiles = slightUI.builderAPI.getCoreFilePaths();
        const hybridData = slightUI.builderAPI.getHybridComponentData();

        // Создаем виртуальный "входной файл" для Browserify
        // Мы будем собирать его содержимое по частям.
        const entryPointContent = `
            // --- 1. Импорт всех модулей ядра ---
            const { createReactive, createEffect } = require('${escapePath(coreFiles.reactive)}');
            const { createUI } = require('${escapePath(coreFiles.api)}');
            
            // --- 2. Внедрение данных о компонентах ---
            // Эти данные были собраны на стороне сервера и теперь доступны на клиенте.
            const hybridComponentData = ${JSON.stringify(hybridData, null, 2)};
            
            // --- 3. Создание глобального объекта UI ---
            // Передаем в createUI все необходимое: данные и функции реактивности.
            const UI = createUI(hybridComponentData, { createReactive, createEffect });
            
            // --- 4. Загрузка и запуск кода приложения ---
            // Код приложения теперь полностью отделен от ядра.
            const appCode = require('${escapePath(path.join(__dirname, 'app.js'))}');
            appCode(UI); // Передаем UI в качестве зависимости
        `;

        // Создаем Browserify инстанс
        const b = browserify();

        // Превращаем нашу строку с кодом в читаемый поток (stream),
        // который Browserify может обработать как файл.
        const readable = new stream.Readable();
        readable._read = () => {};
        readable.push(entryPointContent);
        readable.push(null); // Сигнал окончания потока

        // Добавляем наш виртуальный файл в Browserify.
        // `basedir` нужен, чтобы require() внутри него работал корректно.
        b.add(readable, { basedir: path.resolve(__dirname, '..') });

        // Запускаем сборку и отправляем результат клиенту (res)
        const bundleStream = b.bundle();
        
        bundleStream.on('error', (err) => {
            console.error("[Server] Ошибка сборки Browserify:", err.message);
            // Отправляем ошибку в консоль браузера для удобной отладки
            const errorMessage = `console.error(\`[SlightUI Build Error] ${JSON.stringify(err.message)}\`);`;
            if (!res.headersSent) {
                res.status(500).send(errorMessage);
            }
        });

        bundleStream.pipe(res); // Это и есть магия: результат сборки идет прямо в HTTP-ответ

    } catch (error) {
        console.error("[Server] Критическая ошибка:", error);
        if (!res.headersSent) {
            res.status(500).send("console.error('Критическая ошибка на сервере сборки.');");
        }
    }
});

// Эндпоинт для главной страницы
app.get('/', (req, res) => {
    // Отдаем простейшую HTML-обертку. Вся магия будет в bundle.js
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SlightStack Modular</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #f4f4f9; }
                #app { height: 100vh; width: 100vw; }
            </style>
        </head>
        <body>
            <div id="app"></div>
            <script src="/bundle.js"></script>
        </body>
        </html>
    `);
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`\n✅ SlightStack Modular Demo запущено на http://localhost:${PORT}`);
    console.log('   Остановите сервер через Ctrl+C.');
});
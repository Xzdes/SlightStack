// Файл: server.js (Финальная, правильная архитектура)

const express = require('express');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

const app = express();
const PORT = 3000;

// МАРШРУТ: Собираем ВСЕ приложение на лету
app.get('/bundle.js', (req, res) => {
    console.log('Запрос на /bundle.js, полная автоматическая сборка...');
    res.setHeader('Content-Type', 'application/javascript');
    
    // --- 1. Создаем "виртуальный" главный файл для сборки ---
    let entryPointCode = `
        // Подключаем ядро фреймворка
        const { render } = require('./core/renderer.js');
        const { createReactive } = require('./core/reactive.js'); 
        
        // Создаем объект, который будет нашим публичным API SlightUI
        const autoExports = {};

        // Добавляем в него ключевые функции
        autoExports.UI = {
            create: function(options) {
                // UI.create теперь просто вызывает render, передавая ему уже готовый реактивный state
                render(options.view, options.state, options.target);
            }
        };
        autoExports.createReactive = createReactive;
    `;

    // --- 2. Автоматически сканируем папки и добавляем require для всех компонентов ---
    function appendRequires(dirPath) {
        const absolutePath = path.join(__dirname, dirPath);
        const files = fs.readdirSync(absolutePath);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const componentName = path.basename(file, '.js');
                const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
                entryPointCode += `autoExports.${capitalizedName} = require('./${dirPath}/${file}');\n`;
            }
        });
    }

    appendRequires('components');
    appendRequires('helpers');
    
    // --- 3. Читаем код нашего приложения app.js как текст ---
    const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
    
    // --- 4. Добавляем код app.js в конец, оборачивая его в функцию ---
    // Это позволяет передать наш собранный объект `autoExports` внутрь `app.js`
    entryPointCode += `
        (function(SlightUI) {
            ${appCode}
        })(autoExports);
    `;

    // --- 5. Собираем весь сгенерированный код с помощью Browserify ---
    const b = browserify();
    
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(entryPointCode);
    readable.push(null);
    
    b.add(readable, { basedir: __dirname }); // `basedir` важен, чтобы `require` находил файлы
    
    b.bundle()
     .on('error', (err) => { 
         console.error("Ошибка сборки:", err.message);
         const safeErrorMessage = JSON.stringify(err.message);
         res.status(500).send(`console.error("Ошибка сборки SlightUI:", ${safeErrorMessage});`);
     })
     .pipe(res);
});

// Отдаем HTML-страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`\n✅ SlightUI DevServer (Финальная Архитектура) запущен на http://localhost:${PORT}`);
});
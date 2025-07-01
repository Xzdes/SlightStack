// Файл: server.js (Версия с исправлением UI.create)

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
    
    let entryPointCode = `
        const { render } = require('./core/renderer.js');
        const autoExports = {};

        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Сразу добавляем объект UI, чтобы он был доступен
        autoExports.UI = {
            create: function(options) {
                if (!options || !options.target) throw new Error('SlightUI.create: "target" обязателен.');
                if (typeof options.view !== 'function') throw new Error('SlightUI.create: "view" должна быть функцией.');
                render(options.view, options.state || {}, options.target);
            }
        };
    `;

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
    
    const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
    
    entryPointCode += `
        // Вставляем код app.js и передаем ему собранный объект
        (function(SlightUI) {
            ${appCode}
        })(autoExports);
    `;

    const b = browserify();
    
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(entryPointCode);
    readable.push(null);
    
    b.add(readable, { basedir: __dirname });
    
    b.bundle()
     .on('error', (err) => { 
         console.error("Ошибка сборки:", err.message);
         const safeErrorMessage = JSON.stringify(err.message);
         res.status(500).send(`console.error("Ошибка сборки SlightUI:", ${safeErrorMessage});`);
     })
     .pipe(res);
});

// Отдаем HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightUI DevServer (v.Auto) запущен на http://localhost:${PORT}`);
});
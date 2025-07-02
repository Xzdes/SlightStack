// Файл: server.js
// Финальная версия. Собирает обычные и гибридные компоненты в один бандл.

const express = require('express');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

const app = express();
const PORT = 3000;

// МАРШРУТ, КОТОРЫЙ СОБИРАЕТ И ОТДАЕТ НАШЕ ПРИЛОЖЕНИЕ
app.get('/bundle.js', (req, res) => {
    console.log('Запрос на /bundle.js, запускаю сборку...');
    res.setHeader('Content-Type', 'application/javascript');
    
    // --- 1. Собираем код по частям в массив, чтобы избежать сложных строк ---
    const codeParts = [];

    // Добавляем ядро фреймворка
    codeParts.push(`
        const { render } = require('./core/renderer.js');
        const { createReactive, createEffect } = require('./core/reactive.js'); 
        
        const UI = {};
        UI.create = (options) => render(options.view, options.state, options.target);
        UI.createReactive = createReactive;
    `);

    // --- 2. Функция для сканирования папок и добавления обычных компонентов ---
    function appendBuilders(dirPath) {
        const absolutePath = path.join(__dirname, dirPath);
        if (!fs.existsSync(absolutePath)) return;

        const files = fs.readdirSync(absolutePath);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const builderName = path.basename(file, '.js');
                // Добавляем строку `require` для каждого компонента
                codeParts.push(`UI.${builderName} = require('./${dirPath}/${file}');`);
            }
        });
    }

    appendBuilders('components');
    appendBuilders('helpers');
    
    // --- 3. Читаем и "запекаем" данные гибридных компонентов ---
    const hybridComponentsData = {};
    const hybridPath = path.join(__dirname, 'hybrid-components');
    if (fs.existsSync(hybridPath)) {
        const componentDirs = fs.readdirSync(hybridPath);
        componentDirs.forEach(dirName => {
            try {
                const htmlPath = path.join(hybridPath, dirName, 'component.html');
                const cssPath = path.join(hybridPath, dirName, 'component.css');
                // Проверяем, что оба файла существуют
                if (fs.existsSync(htmlPath) && fs.existsSync(cssPath)) {
                    hybridComponentsData[dirName] = {
                        html: fs.readFileSync(htmlPath, 'utf-8'),
                        css: fs.readFileSync(cssPath, 'utf-8')
                    };
                }
            } catch (e) {
                console.error(`Ошибка при чтении гибридного компонента ${dirName}:`, e.message);
            }
        });
    }
    codeParts.push(`const hybridData = ${JSON.stringify(hybridComponentsData)};`);

    // --- 4. Добавляем строитель гибридных компонентов, который будет работать в браузере ---
    codeParts.push(`
        UI.hybrid = function(componentName) {
            const data = hybridData[componentName];
            const vNode = {
                type: 'HybridComponent',
                props: { componentName: componentName, replacements: {}, listeners: {} }
            };

            if (!data) {
                console.error('Гибридный компонент "' + componentName + '" не найден.');
                vNode.props.innerHTML = '<div style="border:2px solid red; padding:10px; color:red;">Компонент <strong>' + componentName + '</strong> не найден</div>';
            } else {
                vNode.props.innerHTML = data.html;
                vNode.props.inlineStyle = data.css;
            }

            // Возвращаем полноценный объект-строитель в любом случае
            return {
                vNode: vNode,
                replace: function(p, v) { this.vNode.props.replacements[p] = v; return this; },
                on: function(s, e, h) { 
                    if (!this.vNode.props.listeners[s]) this.vNode.props.listeners[s] = {};
                    this.vNode.props.listeners[s][e] = h; return this; 
                },
                onMount: function(h) { this.vNode.props.onMount = h; return this; },
                toJSON: function() { return this.vNode; }
            };
        };
    `);
    
    // --- 5. Добавляем код нашего приложения ---
    const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
    codeParts.push(`(function(UI) { ${appCode} })(UI);`);

    // --- 6. Собираем всё в один бандл ---
    const finalCode = codeParts.join('\n');
    
    const b = browserify();
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(finalCode);
    readable.push(null);
    b.add(readable, { basedir: __dirname });
    
    const bundleStream = b.bundle();

    bundleStream.on('error', (err) => { 
        console.error("Ошибка сборки:", err.message);
        // Используем простую конкатенацию строк, чтобы избежать проблем с синтаксисом
        const safeErrorMessage = JSON.stringify('Ошибка сборки: ' + err.message);
        const script = 'console.error(' + safeErrorMessage + ');';
        res.status(500).send(script);
    });

    bundleStream.pipe(res);
});

// Отдаем HTML-страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Fluent DevServer запущен на http://localhost:${PORT}`);
});
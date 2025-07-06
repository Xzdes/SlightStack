// Файл: server.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)

const express = require('express');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const stream = require('stream');

const app = express();
const PORT = 3000;

app.get('/bundle.js', (req, res) => {
    console.log('[Server] Запрос на /bundle.js, запускаю сборку...');
    res.setHeader('Content-Type', 'application/javascript');
    
    try {
        const codeParts = [];

        // --- 1. Инициализация ядра SlightUI ---
        codeParts.push(`
            const { render } = require('./core/renderer.js');
            const { createReactive, createEffect } = require('./core/reactive.js'); 
            
            const UI = {};
            UI.create = (options) => {
                if (!options.target || !options.view) {
                    throw new Error("SlightUI.create требует 'target' и 'view' в опциях.");
                }
                render(options.view, options.target);
            };
            UI.createReactive = createReactive;
        `);

        // --- 2. Динамическое подключение компонентов-строителей ---
        const { buildUIObject } = require('./core/ui-builder.js');
        const uiComponentMap = buildUIObject(); // Получаем карту { button: { module, path }, ... }
        
        // ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем готовый путь из карты
        for (const builderName in uiComponentMap) {
            const componentData = uiComponentMap[builderName];
            // Теперь путь абсолютно корректный
            codeParts.push(`UI.${builderName} = require('${componentData.path}');`);
        }
        
        // --- 3. Подключение гибридных компонентов (без изменений) ---
        const hybridComponentsData = {};
        const hybridPath = path.join(__dirname, 'hybrid-components');
        if (fs.existsSync(hybridPath)) {
            fs.readdirSync(hybridPath).forEach(dirName => {
                const htmlPath = path.join(hybridPath, dirName, 'component.html');
                const cssPath = path.join(hybridPath, dirName, 'component.css');
                if (fs.existsSync(htmlPath)) {
                    hybridComponentsData[dirName] = {
                        html: fs.readFileSync(htmlPath, 'utf-8'),
                        css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''
                    };
                }
            });
        }
        codeParts.push(`const hybridData = ${JSON.stringify(hybridComponentsData)};`);

// Файл: server.js (ТОЛЬКО ФРАГМЕНТ UI.hybrid)
// ... остальной код сервера без изменений ...

        codeParts.push(`
            UI.hybrid = function(componentName) {
                const data = hybridData[componentName];
                const vNode = {
                    type: 'HybridComponent',
                    props: { 
                        componentName: componentName, 
                        replacements: {}, 
                        listeners: {},
                        ref: null,
                        onMount: null,
                        onUnmount: null,
                    }
                };

                if (!data) {
                    console.error('[SlightUI] Гибридный компонент "' + componentName + '" не найден.');
                    vNode.props.innerHTML = '<div style="border:2px solid red; padding:10px; color:red;">Компонент <strong>' + componentName + '</strong> не найден</div>';
                } else {
                    vNode.props.innerHTML = data.html;
                    vNode.props.inlineStyle = data.css;
                }

                return {
                    vNode: vNode,
                    // ИСПРАВЛЕНИЕ: Теперь метод replace принимает плейсхолдер (например, 'TEXT')
                    // и сам оборачивает его в {{...}} для поиска и замены.
                    replace: function(placeholder, value) { 
                        this.vNode.props.replacements['{{' + placeholder + '}}'] = value; 
                        return this; 
                    },
                    on: function(selector, event, handler) { 
                        if (!this.vNode.props.listeners[selector]) this.vNode.props.listeners[selector] = {};
                        this.vNode.props.listeners[selector][event] = handler; return this; 
                    },
                    ref: function(refObj) { this.vNode.props.ref = refObj; return this; },
                    onMount: function(h) { this.vNode.props.onMount = h; return this; },
                    onUnmount: function(h) { this.vNode.props.onUnmount = h; return this; },
                    toJSON: function() { return this.vNode; }
                };
            };
        `);
// ... остальной код сервера без изменений ...
        
        // --- 4. Добавляем код приложения (без изменений) ---
        const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
        codeParts.push(`(function(UI) { \n${appCode}\n })(UI);`);

        // --- 5. Сборка (без изменений) ---
        const finalCode = codeParts.join('\n\n');
        
        const b = browserify();
        const readable = new stream.Readable();
        readable._read = () => {};
        readable.push(finalCode);
        readable.push(null);
        
        b.add(readable, { basedir: __dirname });
        
        const bundleStream = b.bundle();

        bundleStream.on('error', (err) => { 
            console.error("[Server] Ошибка сборки Browserify:", err.message);
            const errorMessage = `console.error('[SlightUI Build Error]', \`${err.message.replace(/`/g, "'")}\\n\\n${err.stack.replace(/`/g, "'")}\`);`;
            // Важно: проверяем, не был ли уже отправлен ответ
            if (!res.headersSent) {
                res.status(500).send(errorMessage);
            }
        });

        bundleStream.pipe(res);

    } catch (error) {
        console.error("[Server] Критическая ошибка при подготовке к сборке:", error);
        if (!res.headersSent) {
            res.status(500).send("console.error('Критическая ошибка на сервере сборки. Смотрите консоль сервера.');");
        }
    }
});

// Отдаем главный HTML файл
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Fluent DevServer запущен на http://localhost:${PORT}`);
    console.log('   Обновите страницу в браузере, чтобы запустить пересборку.');
});
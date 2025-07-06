// Файл: server.js (Финальная версия с поддержкой расширений)

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
        // Этот блок остается прежним.
        codeParts.push(`
            const { render } = require('./core/renderer.js');
            const { createReactive } = require('./core/reactive.js'); 
            const UI = {};
            UI.create = (options) => {
                if (!options.target || !options.view) {
                    throw new Error("SlightUI.create требует 'target' и 'view' в опциях.");
                }
                render(options.view, options.target);
            };
            UI.createReactive = createReactive;
        `);

        // --- 2. Код для расширений (виртуальный файл extensions.js) ---
        // Мы добавляем этот код как строку, чтобы он был доступен в бандле.
        const extensionsCode = `
            function applyExtensions(builderInstance, builderName) {
                // Расширение 1: Двустороннее связывание для input
                if (builderName === 'input') {
                    builderInstance.model = function(stateObject, propertyName) {
                        if (stateObject[propertyName] === undefined) {
                            console.warn('[SlightUI.model] Свойство "' + propertyName + '" не найдено в объекте состояния.');
                        }
                        const propType = this.vNode.props.type === 'checkbox' ? 'checked' : 'value';
                        this.vNode.props[propType] = stateObject[propertyName];
                        
                        this.onInput(e => {
                            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                            stateObject[propertyName] = value;
                        });
                        return this;
                    };
                }
                // Здесь можно будет добавлять другие расширения в будущем...
            }
        `;
        codeParts.push(extensionsCode);


        // --- 3. Динамическое подключение компонентов и их "патчинг" ---
        const { buildUIObject } = require('./core/ui-builder.js');
        const uiComponentMap = buildUIObject();
        
        for (const builderName in uiComponentMap) {
            const componentData = uiComponentMap[builderName];
            codeParts.push(`const ${builderName}Builder = require('${componentData.path}');`);

            // Создаем обертку, которая вызывает applyExtensions
            codeParts.push(`
                UI.${builderName} = (...args) => {
                    const builder = ${builderName}Builder(...args);
                    applyExtensions(builder, '${builderName}');
                    return builder;
                };
            `);
        }
        
        // --- 4. Добавляем новый синтаксис для вызова компонентов с props ---
        codeParts.push(`
            UI.component = (comp, props, ...children) => {
                // --- ИЗМЕНЕНИЕ: Оборачиваем VNode в объект-строитель ---
                const vNode = { type: comp, props: props || {}, children };
                return {
                    vNode: vNode,
                    // Добавляем ключевые методы, чтобы UI.for и другие могли с ним работать
                    key: function(k) { this.vNode.props.key = k; return this; },
                    ref: function(r) { this.vNode.props.ref = r; return this; },
                    toJSON: function() { return this.vNode; }
                };
            };
        `);

        // --- 5. Подключение гибридных компонентов (без существенных изменений) ---
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
        codeParts.push(`
            const hybridBuilder = function(componentName) {
                const data = hybridData[componentName];
                const vNode = { type: 'HybridComponent', props: { componentName: componentName, replacements: {}, listeners: {}, ref: null, onMount: null, onUnmount: null } };
                if (!data) {
                    console.error('[SlightUI] Гибридный компонент "' + componentName + '" не найден.');
                    vNode.props.innerHTML = '<div style="border:2px solid red; padding:10px;">...</div>';
                } else {
                    vNode.props.innerHTML = data.html;
                    vNode.props.inlineStyle = data.css;
                }
                return {
                    vNode: vNode,
                    replace: function(p, v) { this.vNode.props.replacements['{{' + p + '}}'] = v; return this; },
                    on: function(s, e, h) { if (!this.vNode.props.listeners[s]) this.vNode.props.listeners[s] = {}; this.vNode.props.listeners[s][e] = h; return this; },
                    ref: function(r) { this.vNode.props.ref = r; return this; },
                    onMount: function(h) { this.vNode.props.onMount = h; return this; },
                    onUnmount: function(h) { this.vNode.props.onUnmount = h; return this; },
                    toJSON: function() { return this.vNode; }
                };
            };
            UI.hybrid = (...args) => {
                const builder = hybridBuilder(...args);
                applyExtensions(builder, 'hybrid');
                return builder;
            }
        `);
        
        // --- 6. Добавляем код приложения ---
        const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
        codeParts.push(`(function(UI) { \n${appCode}\n })(UI);`);

        // --- 7. Сборка через Browserify ---
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Fluent DevServer запущен на http://localhost:${PORT}`);
    console.log('   Обновите страницу в браузере, чтобы запустить пересборку.');
});
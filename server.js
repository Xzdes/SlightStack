// Файл: server.js (ИСПРАВЛЕННАЯ ВЕРСИЯ v4 - Финальный)

const express = require('express');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

const app = express();
const PORT = 3000;

app.get('/bundle.js', (req, res) => {
    console.log('[Server] Запрос на /bundle.js, запускаю сборку...');
    res.setHeader('Content-Type', 'application/javascript');
    
    try {
        const entryPointContent = [];

        // --- 1. Собираем весь код для входного файла ---

        // Шаг 1.1: Инициализация ядра. Пути здесь правильные, т.к. они внутри core/
        entryPointContent.push(`
            const { render } = require('./renderer.js');
            const { createReactive } = require('./reactive.js');
            const { createBuilderFactory } = require('./ui-builder-runtime.js');
            const UI = {};
            UI.create = (options) => {
                if (!options.target || !options.view) throw new Error("SlightUI.create требует 'target' и 'view'.");
                render(options.view, options.target);
            };
            UI.createReactive = createReactive;
        `);

        // Шаг 1.2: Код расширений
        entryPointContent.push(`
            function applyExtensions(builderInstance, builderName) {
                if (builderName === 'input') {
                    builderInstance.model = function(stateObject, propertyName) {
                        const propType = this.vNode.props.type === 'checkbox' ? 'checked' : 'value';
                        this.vNode.props[propType] = stateObject[propertyName];
                        this.onInput(e => {
                            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                            stateObject[propertyName] = value;
                        });
                        return this;
                    };
                }
            }
        `);

        // Шаг 1.3: Динамическая сборка UI объекта
        const { buildUIObject } = require('./core/ui-builder.js');
        const uiMap = buildUIObject();

        for (const builderName in uiMap) {
            const componentData = uiMap[builderName];
            // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Делаем путь относительным от папки core/ ***
            const relativePath = path.join('..', componentData.path).replace(/\\/g, '/');
            
            entryPointContent.push(`
                (function() {
                    const config = require('${relativePath}');
                    
                    if (typeof config === 'function') {
                        UI['${builderName}'] = config;
                        return;
                    }

                    const componentType = '${builderName.charAt(0).toUpperCase() + builderName.slice(1)}';
                    const factory = createBuilderFactory(componentType, config.defaults);

                    UI['${builderName}'] = (...args) => {
                        const builder = factory(...args);
                        if (config.methods) {
                            for (const methodName in config.methods) {
                                builder[methodName] = config.methods[methodName].bind(builder);
                            }
                        }
                        applyExtensions(builder, '${builderName}');
                        return builder;
                    };
                })();
            `);
        }

        // Шаг 1.4: UI.component
        entryPointContent.push(`
            UI.component = (compFn, props, ...children) => {
                const vNode = { type: compFn, props: props || {}, children };
                return { vNode, key: function(k) { this.vNode.props.key = k; return this; }, ref: function(r) { this.vNode.props.ref = r; return this; }, toJSON: function() { return this.vNode; } };
            };
        `);

        // Шаг 1.5: Гибридные компоненты
        const hybridComponentsData = {};
        const hybridPath = path.join(__dirname, 'hybrid-components');
        if (fs.existsSync(hybridPath)) {
            fs.readdirSync(hybridPath).forEach(dirName => {
                // ... (логика сборки hybridData остается прежней)
                const htmlPath = path.join(hybridPath, dirName, 'component.html');
                const cssPath = path.join(hybridPath, dirName, 'component.css');
                if (fs.existsSync(htmlPath)) {
                    hybridComponentsData[dirName] = { html: fs.readFileSync(htmlPath, 'utf-8'), css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '' };
                }
            });
        }
        entryPointContent.push(`const hybridData = ${JSON.stringify(hybridComponentsData)};`);
        entryPointContent.push(`
            UI.hybrid = (componentName) => {
                const data = hybridData[componentName];
                const vNode = { type: 'HybridComponent', props: { componentName, replacements: {}, listeners: {}, ref: null, onMount: null, onUnmount: null } };
                if (data) { vNode.props.innerHTML = data.html; vNode.props.inlineStyle = data.css; }
                return { vNode, replace: function(p, v) { this.vNode.props.replacements['{{' + p + '}}'] = v; return this; }, on: function(s, e, h) { if (!this.vNode.props.listeners[s]) this.vNode.props.listeners[s] = {}; this.vNode.props.listeners[s][e] = h; return this; }, ref: function(r) { this.vNode.props.ref = r; return this; }, toJSON: function() { return this.vNode; } };
            };
        `);

        // Шаг 1.6: Код приложения
        // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Правильный путь к app.js ***
        entryPointContent.push(`const appCode = require('../app.js');`);
        entryPointContent.push(`appCode(UI);`);

        // --- 2. Создание временного файла и сборка ---
        const tempEntryFile = path.join(__dirname, 'core', '_temp_entry.js');
        fs.writeFileSync(tempEntryFile, entryPointContent.join('\n\n'));

        // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Указываем basedir явно! ***
        const b = browserify(tempEntryFile, { basedir: __dirname });
        const bundleStream = b.bundle();

        bundleStream.on('error', (err) => { 
            console.error("[Server] Ошибка сборки Browserify:", err.message);
            if (!res.headersSent) res.status(500).send(`console.error(\`[SlightUI Build Error] ${err.message.replace(/`/g, "'")}\`)`);
            if (fs.existsSync(tempEntryFile)) fs.unlinkSync(tempEntryFile);
        });

        bundleStream.on('end', () => {
            if (fs.existsSync(tempEntryFile)) fs.unlinkSync(tempEntryFile);
        });
        
        bundleStream.on('close', () => {
             if (fs.existsSync(tempEntryFile)) fs.unlinkSync(tempEntryFile);
        });

        bundleStream.pipe(res);

    } catch (error) {
        console.error("[Server] Критическая ошибка:", error);
        if (!res.headersSent) res.status(500).send("console.error('Критическая ошибка на сервере сборки.');");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Fluent DevServer запущен на http://localhost:${PORT}`);
    console.log('   Обновите страницу в браузере для пересборки.');
});
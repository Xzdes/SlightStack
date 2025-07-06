// Файл: demo/server.js
// Исправленная версия с экранированием путей для Windows.

const express = require('express');
const browserify = require('browserify');
const path = require('path');
const fs = require('fs');
const stream = require('stream');

const slightUI = require('../index.js');

const app = express();
const PORT = 3000;

// Утилита для исправления путей для require()
function escapePath(p) {
    return p.replace(/\\/g, '\\\\');
}

app.get('/bundle.js', (req, res) => {
    console.log('[Demo Server] Запрос на /bundle.js, запускаю сборку демо...');
    res.setHeader('Content-Type', 'application/javascript');

    try {
        const entryPointContent = [];

        const coreFiles = slightUI.getCoreFilePaths();
        const components = slightUI.getComponentInfo();
        const hybridData = slightUI.getHybridComponentData();

        // Шаг 2.1: Инициализация ядра с экранированными путями
        entryPointContent.push(`
            const { render } = require('${escapePath(coreFiles.renderer)}');
            const { createReactive } = require('${escapePath(coreFiles.reactive)}');
            const { createBuilderFactory } = require('${escapePath(coreFiles.runtimeBuilder)}');
            const UI = {};
            UI.create = (options) => {
                if (!options.target || !options.view) throw new Error("SlightUI.create требует 'target' и 'view'.");
                render(options.view, options.target);
            };
            UI.createReactive = createReactive;
        `);

        // Шаг 2.2: Код расширений
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

        // Шаг 2.3: Динамическая сборка объекта UI с экранированными путями
        for (const componentName in components) {
            const componentInfo = components[componentName];
            entryPointContent.push(`
                (function() {
                    const config = require('${escapePath(componentInfo.path)}');
                    
                    if (${componentInfo.isFunction}) {
                        UI['${componentName}'] = config;
                        return;
                    }

                    const componentType = '${componentName.charAt(0).toUpperCase() + componentName.slice(1)}';
                    const factory = createBuilderFactory(componentType, config.defaults);

                    UI['${componentName}'] = (...args) => {
                        const builder = factory(...args);
                        if (config.methods) {
                            for (const methodName in config.methods) {
                                builder[methodName] = config.methods[methodName].bind(builder);
                            }
                        }
                        applyExtensions(builder, '${componentName}');
                        return builder;
                    };
                })();
            `);
        }

        // Шаг 2.4: UI.component
        entryPointContent.push(`
            UI.component = (compFn, props, ...children) => {
                const vNode = { type: compFn, props: props || {}, children };
                return { vNode, key: function(k) { this.vNode.props.key = k; return this; }, ref: function(r) { this.vNode.props.ref = r; return this; }, toJSON: function() { return this.vNode; } };
            };
        `);

        // Шаг 2.5: Гибридные компоненты
        entryPointContent.push(`const hybridData = ${JSON.stringify(hybridData)};`);
        entryPointContent.push(`
            UI.hybrid = (componentName) => {
                const data = hybridData[componentName];
                const vNode = { type: 'HybridComponent', props: { componentName, replacements: {}, listeners: {}, ref: null, onMount: null, onUnmount: null } };
                if (data) { vNode.props.innerHTML = data.html; vNode.props.inlineStyle = data.css; }
                return { vNode, replace: function(p, v) { this.vNode.props.replacements['{{' + p + '}}'] = v; return this; }, on: function(s, e, h) { if (!this.vNode.props.listeners[s]) this.vNode.props.listeners[s] = {}; this.vNode.props.listeners[s][e] = h; return this; }, ref: function(r) { this.vNode.props.ref = r; return this; }, toJSON: function() { return this.vNode; } };
            };
        `);

        // Шаг 2.6: Код демо-приложения с экранированным путем
        const appPath = path.resolve(__dirname, 'app.js');
        entryPointContent.push(`const appCode = require('${escapePath(appPath)}');`);
        entryPointContent.push(`appCode(UI);`);
        
        const b = browserify();
        const readable = new stream.Readable();
        readable._read = () => {};
        readable.push(entryPointContent.join('\n\n'));
        readable.push(null);

        b.add(readable, { basedir: path.resolve(__dirname, '..') });
        const bundleStream = b.bundle();

        bundleStream.on('error', (err) => {
            console.error("[Demo Server] Ошибка сборки Browserify:", err.message, err.stack);
            if (!res.headersSent) res.status(500).send(`console.error(\`[SlightUI Demo Build Error] ${err.message.replace(/`/g, "'")}\`)`);
        });

        bundleStream.pipe(res);

    } catch (error) {
        console.error("[Demo Server] Критическая ошибка:", error);
        if (!res.headersSent) res.status(500).send("console.error('Критическая ошибка на сервере сборки демо.');");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'test.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Demo запущено на http://localhost:${PORT}`);
    console.log('   Используйте "npm run start:demo" для запуска.');
});
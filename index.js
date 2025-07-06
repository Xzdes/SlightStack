// Файл: index.js
// Это публичный Node.js API для фреймворка SlightStack.
// Он предоставляет утилиты для сборщиков и для продвинутого использования в Node.js-окружении.

const path = require('path');
const fs = require('fs');

// Импортируем внутренние модули, API которых мы хотим экспортировать.
const { buildUIObject } = require('./core/ui-builder.js');
const { createReactive, createEffect } = require('./core/reactive.js');
const { render } = require('./core/renderer.js');
const { normalize } = require('./core/vdom.js');


// --- API для сборщиков (Browserify, Webpack, Vite, etc.) ---

/**
 * Возвращает объект с абсолютными путями ко всем основным файлам ядра.
 * Это позволяет сборщикам напрямую подключать нужные части фреймворка.
 * @returns {{renderer: string, reactive: string, vdom: string, runtimeBuilder: string}}
 */
function getCoreFilePaths() {
    return {
        renderer:       path.resolve(__dirname, 'core/renderer.js'),
        reactive:       path.resolve(__dirname, 'core/reactive.js'),
        vdom:           path.resolve(__dirname, 'core/vdom.js'),
        runtimeBuilder: path.resolve(__dirname, 'core/ui-builder-runtime.js')
    };
}

/**
 * Сканирует проект и возвращает объект с информацией обо всех компонентах.
 * Ключ - имя компонента, значение - информация о нем (путь, тип экспорта).
 * @returns {Object.<string, {path: string, isFunction: boolean}>}
 */
function getComponentInfo() {
    const uiMap = buildUIObject(); // Эта функция сканирует папки components/ и helpers/
    const componentInfo = {};
    for (const builderName in uiMap) {
        const absolutePath = path.resolve(__dirname, uiMap[builderName].path);
        // Проверяем, является ли экспортируемый модуль функцией (для table.js)
        const isFunction = typeof require(absolutePath) === 'function';
        componentInfo[builderName] = {
            path: absolutePath,
            isFunction: isFunction,
        };
    }
    return componentInfo;
}

/**
 * Собирает и возвращает данные обо всех гибридных компонентах.
 * @returns {Object.<string, {html: string, css: string}>}
 */
function getHybridComponentData() {
    const hybridComponentsData = {};
    const hybridPath = path.resolve(__dirname, 'hybrid-components');
    if (fs.existsSync(hybridPath)) {
        fs.readdirSync(hybridPath).forEach(dirName => {
            const componentDir = path.join(hybridPath, dirName);
            const htmlPath = path.join(componentDir, 'component.html');
            const cssPath = path.join(componentDir, 'component.css');
            if (fs.existsSync(htmlPath)) {
                hybridComponentsData[dirName] = {
                    html: fs.readFileSync(htmlPath, 'utf-8'),
                    css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''
                };
            }
        });
    }
    return hybridComponentsData;
}


// --- API для продвинутого использования (например, Server-Side Rendering) ---

/**
 * Набор runtime-функций, которые могут быть полезны для выполнения
 * кода SlightStack вне стандартного браузерного окружения.
 */
const runtime = {
    /**
     * Создает реактивный объект состояния.
     * @see /core/reactive.js
     */
    createReactive,

    /**
     * Создает реактивный эффект.
     * @see /core/reactive.js
     */
    createEffect,

    /**
     * Основная функция рендеринга (теоретически может рендерить в JSDOM на сервере).
     * @see /core/renderer.js
     */
    render,

    /**
     * Функция нормализации, превращающая любой объект в VNode.
     * @see /core/vdom.js
     */
    normalize
};


// --- Основной экспорт модуля ---

module.exports = {
    // API для сборщиков: предоставляет "чертежи" и пути
    builderAPI: {
        getCoreFilePaths,
        getComponentInfo,
        getHybridComponentData
    },

    // API для runtime: предоставляет готовые к использованию функции
    runtimeAPI: runtime,

    // Для удобства и обратной совместимости, дублируем ключевые функции на верхний уровень.
    // Это позволит писать `const { createEffect } = require('slightstack')`
    createEffect: runtime.createEffect,
    createReactive: runtime.createReactive
};
// Файл: slight-ui/index.js

const path = require('path');
const { buildUIObject } = require('./core/ui-builder.js');

/**
 * Возвращает абсолютные пути ко всем основным файлам ядра.
 * Это API для сборщиков (Browserify, Webpack, Vite), которые будут
 * использовать ваш фреймворк.
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
 * Возвращает объект с информацией обо всех компонентах, найденных в проекте.
 * Ключ - имя компонента, значение - информация о нем.
 * @returns {Object.<string, {path: string, isFunction: boolean}>}
 */
function getComponentInfo() {
    const uiMap = buildUIObject(); // Эта функция сканирует папки components/ и helpers/
    const componentInfo = {};
    for (const builderName in uiMap) {
        const absolutePath = path.resolve(__dirname, uiMap[builderName].path);
        componentInfo[builderName] = {
            path: absolutePath,
            // Проверяем, является ли экспортируемый модуль функцией (для table.js)
            isFunction: typeof require(absolutePath) === 'function'
        };
    }
    return componentInfo;
}

/**
 * Возвращает данные о гибридных компонентах.
 * @returns {Object}
 */
function getHybridComponentData() {
    const fs = require('fs');
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

module.exports = {
    // Публичное API для сборщиков
    getCoreFilePaths,
    getComponentInfo,
    getHybridComponentData
};
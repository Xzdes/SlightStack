// Файл: index.js
// Задача: Служить публичным API для Node.js окружения (в основном для сборщика).
// Он сканирует проект на наличие компонентов и предоставляет пути к файлам ядра.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Используем встроенный модуль для генерации хэша

// --- API для сборщиков ---

/**
 * Возвращает объект с абсолютными путями ко всем файлам ядра.
 * Это позволяет сборщику (Browserify) точно знать, какие файлы включать в бандл.
 * @returns {Object.<string, string>}
 */
function getCoreFilePaths() {
    const corePath = path.resolve(__dirname, 'core');
    const domPath = path.join(corePath, 'dom');
    const reactivityPath = path.join(corePath, 'reactivity');
    const rendererPath = path.join(corePath, 'renderer');
    const vdomPath = path.join(corePath, 'vdom');

    return {
        // Top-level
        api: path.join(corePath, 'api.js'),
        createApp: path.join(corePath, 'create-app.js'),
        stateManager: path.join(corePath, 'state-manager.js'),
        
        // DOM
        domCreation: path.join(domPath, 'creation.js'),
        domPatching: path.join(domPath, 'patching.js'),

        // Reactivity
        reactivityEffect: path.join(reactivityPath, 'effect.js'),
        reactivityReactive: path.join(reactivityPath, 'reactive.js'),

        // Renderer
        rendererMount: path.join(rendererPath, 'mount.js'),
        rendererPatch: path.join(rendererPath, 'patch.js'),
        rendererUtils: path.join(rendererPath, 'utils.js'),
        
        // VDOM
        vdomNormalize: path.join(vdomPath, 'normalize.js'),
        vdomPropsResolver: path.join(vdomPath, 'props-resolver.js'),
        vdomVNode: path.join(vdomPath, 'vnode.js'),
        
        // Пользовательский код
        appCode: path.join(__dirname, 'demo', 'app.js'),
    };
}

/**
 * Сканирует папку `hybrid-components` и возвращает данные обо всех компонентах.
 * @returns {Object.<string, {html: string, css: string, scopeId: string}>}
 *          Ключ - имя компонента, значение - объект с его HTML, CSS и уникальным ID.
 */
function getHybridComponentData() {
    const hybridComponentsData = {};
    const hybridPath = path.resolve(__dirname, 'hybrid-components');
    
    if (!fs.existsSync(hybridPath)) {
        console.warn(`[SlightUI-Build] Папка 'hybrid-components' не найдена.`);
        return {};
    }

    fs.readdirSync(hybridPath).forEach(dirName => {
        const componentDir = path.join(hybridPath, dirName);
        if (!fs.statSync(componentDir).isDirectory()) return;

        const htmlPath = path.join(componentDir, 'component.html');
        const cssPath = path.join(componentDir, 'component.css');

        if (fs.existsSync(htmlPath)) {
            // Генерируем уникальный ID для скоупинга на основе пути к папке компонента
            const hash = crypto.createHash('md5').update(componentDir).digest('hex').substring(0, 8);
            const scopeId = `data-slight-v-${hash}`;

            hybridComponentsData[dirName] = {
                html: fs.readFileSync(htmlPath, 'utf-8'),
                css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '',
                scopeId: scopeId // Сохраняем ID для использования в рендерере
            };
        }
    });
    
    return hybridComponentsData;
}

// --- Основной экспорт модуля ---

module.exports = {
    // API для сборщиков: предоставляет "чертежи" и пути
    builderAPI: {
        getCoreFilePaths,
        getHybridComponentData
    },
};
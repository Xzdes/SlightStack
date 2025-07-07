// Файл: index.js
// Задача: Служить публичным API для Node.js окружения (в основном для сборщика).
// Он сканирует проект на наличие компонентов и предоставляет пути к файлам ядра.

const path = require('path');
const fs = require('fs');

// --- API для сборщиков ---

/**
 * Возвращает объект с абсолютными путями ко всем файлам ядра.
 * Это позволяет сборщику (Browserify) точно знать, какие файлы включать в бандл.
 * @returns {Object.<string, string>}
 */
function getCoreFilePaths() {
    const corePath = path.resolve(__dirname, 'core');
    return {
        // Реактивность
        reactive: path.join(corePath, 'reactive.js'),
        tracker: path.join(corePath, 'tracker.js'),
        // VDOM
        vnode: path.join(corePath, 'vnode.js'),
        normalize: path.join(corePath, 'normalize.js'),
        // Рендеринг
        dom: path.join(corePath, 'dom.js'),
        renderer: path.join(corePath, 'renderer.js'),
        // <<< НОВОЕ >>>
        stateManager: path.join(corePath, 'state-manager.js'),
        propsResolver: path.join(corePath, 'props-resolver.js'),
        // <<< КОНЕЦ НОВОГО >>>
        // API
        api: path.join(corePath, 'api.js'),
    };
}

/**
 * Сканирует папку `hybrid-components` и возвращает данные обо всех компонентах.
 * @returns {Object.<string, {html: string, css: string}>}
 *          Ключ - имя компонента, значение - объект с его HTML и CSS кодом.
 */
function getHybridComponentData() {
    const hybridComponentsData = {};
    const hybridPath = path.resolve(__dirname, 'hybrid-components');
    
    if (!fs.existsSync(hybridPath)) {
        console.warn(`[SlightUI-Build] Папка 'hybrid-components' не найдена. UI будет пустым.`);
        return {};
    }

    fs.readdirSync(hybridPath).forEach(dirName => {
        const componentDir = path.join(hybridPath, dirName);
        if (!fs.statSync(componentDir).isDirectory()) return;

        const htmlPath = path.join(componentDir, 'component.html');
        const cssPath = path.join(componentDir, 'component.css');

        if (fs.existsSync(htmlPath)) {
            hybridComponentsData[dirName] = {
                html: fs.readFileSync(htmlPath, 'utf-8'),
                css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''
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
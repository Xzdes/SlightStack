// Файл: index.js (исправленная версия)

const path = require('path');
const fs = require('fs');

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
        // [ИЗМЕНЕНИЕ] Удаляем эту строку
        // rendererPatchChildren: path.join(rendererPath, 'patch-children.js'), 
        rendererUtils: path.join(rendererPath, 'utils.js'),
        
        // VDOM
        vdomNormalize: path.join(vdomPath, 'normalize.js'),
        vdomPropsResolver: path.join(vdomPath, 'props-resolver.js'),
        vdomVNode: path.join(vdomPath, 'vnode.js'),
        
        // Пользовательский код
        appCode: path.join(__dirname, 'demo', 'app.js'),
    };
}

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
            hybridComponentsData[dirName] = {
                html: fs.readFileSync(htmlPath, 'utf-8'),
                css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''
            };
        }
    });
    
    return hybridComponentsData;
}

module.exports = {
    builderAPI: {
        getCoreFilePaths,
        getHybridComponentData
    },
};
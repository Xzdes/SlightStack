// Файл: index.js

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
        router: path.join(corePath, 'router.js'), // [ИЗМЕНЕНИЕ] Добавили новый файл
        
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

function getHybridComponentData(componentsPath) {
    const hybridComponentsData = {};
    const hybridPath = componentsPath || path.resolve(__dirname, 'hybrid-components');
    
    if (!fs.existsSync(hybridPath)) {
        console.warn(`[SlightUI-Build] Папка '${hybridPath}' не найдена.`);
        return {};
    }

    fs.readdirSync(hybridPath).forEach(dirName => {
        const componentDir = path.join(hybridPath, dirName);
        if (!fs.statSync(componentDir).isDirectory()) return;

        const htmlPath = path.join(componentDir, 'component.html');
        const cssPath = path.join(componentDir, 'component.css');

        if (fs.existsSync(htmlPath)) {
            const hash = crypto.createHash('md5').update(componentDir).digest('hex').substring(0, 8);
            const scopeId = `data-slight-v-${hash}`;

            hybridComponentsData[dirName] = {
                html: fs.readFileSync(htmlPath, 'utf-8'),
                css: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '',
                scopeId: scopeId
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
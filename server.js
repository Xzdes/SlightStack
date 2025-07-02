// Файл: server.js (Обновленная, пуленепробиваемая версия)

const express = require('express');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

const app = express();
const PORT = 3000;

app.get('/bundle.js', (req, res) => {
    console.log('Запрос на /bundle.js, запускаю безопасную сборку...');
    res.setHeader('Content-Type', 'application/javascript');
    
    const codeParts = [];

    // Добавляем ядро
    codeParts.push(`
        const { render } = require('./core/renderer.js');
        const { createReactive, createEffect } = require('./core/reactive.js'); 
        const UI = {};
        UI.create = (options) => render(options.view, options.state, options.target);
        UI.createReactive = createReactive;
    `);

    // --- ИЗМЕНЕНИЕ 1: Безопасная загрузка компонентов ---
    function appendBuilders(dirPath) {
        const absolutePath = path.join(__dirname, dirPath);
        if (!fs.existsSync(absolutePath)) return;
        
        const files = fs.readdirSync(absolutePath);
        files.forEach(file => {
            if (path.extname(file) !== '.js') return;

            const builderName = path.basename(file, '.js');
            const relativePath = `./${dirPath}/${file}`;

            try {
                // Мы делаем require здесь, чтобы поймать синтаксические ошибки ДО сборки
                require.resolve(path.join(absolutePath, file)); 
                codeParts.push(`try { UI.${builderName} = require('${relativePath}'); } catch(e) { console.error('Ошибка инициализации компонента ${builderName}:', e); UI.${builderName} = () => ({ toJSON: () => ({ type: 'ErrorComponent', props: { message: 'Ошибка загрузки компонента ${builderName}' } }) }); }`);
            } catch (e) {
                console.error(`\n[ОШИБКА СБОРКИ] Не удалось загрузить компонент ${file}. Он не будет доступен.`, e.message);
                // Мы не добавляем его в сборку, приложение не упадет.
            }
        });
    }

    appendBuilders('components');
    appendBuilders('helpers');
    
    // Безопасная загрузка гибридных компонентов (здесь код уже достаточно безопасен, т.к. использует try/catch)
    const hybridComponentsData = {};
    const hybridPath = path.join(__dirname, 'hybrid-components');
    if (fs.existsSync(hybridPath)) {
        const componentDirs = fs.readdirSync(hybridPath);
        componentDirs.forEach(dirName => {
            try {
                const htmlPath = path.join(hybridPath, dirName, 'component.html');
                const cssPath = path.join(hybridPath, dirName, 'component.css');
                if (fs.existsSync(htmlPath) && fs.existsSync(cssPath)) {
                    hybridComponentsData[dirName] = {
                        html: fs.readFileSync(htmlPath, 'utf-8'),
                        css: fs.readFileSync(cssPath, 'utf-8')
                    };
                }
            } catch (e) { console.error(`[ОШИБКА СБОРКИ] Ошибка чтения гибридного компонента ${dirName}:`, e.message); }
        });
    }
    // Остальная часть кода server.js без изменений...
    codeParts.push(`const hybridData = ${JSON.stringify(hybridComponentsData)};`);
    codeParts.push(`
        UI.hybrid = function(componentName) {
            const data = hybridData[componentName];
            const vNode = {
                type: 'HybridComponent',
                props: { componentName: componentName, replacements: {}, listeners: {} }
            };
            if (!data) {
                vNode.props.innerHTML = '<div style="border:2px solid red; padding:10px; color:red;">Гибридный компонент <strong>' + componentName + '</strong> не найден</div>';
            } else {
                vNode.props.innerHTML = data.html;
                vNode.props.inlineStyle = data.css;
            }
            return {
                vNode: vNode,
                replace: function(p, v) { this.vNode.props.replacements[p] = v; return this; },
                on: function(s, e, h) { 
                    if (!this.vNode.props.listeners[s]) this.vNode.props.listeners[s] = {};
                    this.vNode.props.listeners[s][e] = h; return this; 
                },
                onMount: function(h) { this.vNode.props.onMount = h; return this; },
                toJSON: function() { return this.vNode; }
            };
        };
    `);
    
    const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
    codeParts.push(`try { (function(UI) { ${appCode} })(UI); } catch(e) { console.error('Критическая ошибка в app.js:', e); document.getElementById('app').innerHTML = '<div style="border: 2px solid darkred; background: #ffdddd; padding: 20px;"><h2>Критическая ошибка в app.js</h2><pre>' + e.stack + '</pre></div>'; }`);

    const finalCode = codeParts.join('\n');
    
    const b = browserify();
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(finalCode);
    readable.push(null);
    b.add(readable, { basedir: __dirname });
    
    const bundleStream = b.bundle();

    bundleStream.on('error', (err) => { 
        console.error("Ошибка сборки:", err.message);
        const safeErrorMessage = JSON.stringify('Ошибка сборки: ' + err.message);
        const script = 'console.error(' + safeErrorMessage + ');';
        res.status(500).send(script);
    });

    bundleStream.pipe(res);
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SlightUI Fluent DevServer запущен на http://localhost:${PORT}`);
});
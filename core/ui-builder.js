// Файл: core/ui-builder.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)

const fs = require('fs');
const path = require('path');

function buildUIObject() {
    // Теперь это будет объект вида { button: { module: require(...), path: '...' } }
    const UI_MAP = {}; 

    function loadBuildersFrom(dirPath) {
        const absolutePath = path.join(__dirname, '..', dirPath);
        if (!fs.existsSync(absolutePath)) {
            console.warn(`[UI Builder] Директория не найдена, пропускаю: ${absolutePath}`);
            return;
        }

        const files = fs.readdirSync(absolutePath);
        
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const builderName = path.basename(file, '.js');
                const modulePath = path.join(absolutePath, file);
                
                // Сохраняем и сам модуль, и относительный путь для Browserify
                UI_MAP[builderName] = {
                    module: require(modulePath),
                    path: `./${dirPath}/${file}` // Путь, который поймет require в браузере
                };
            }
        });
    }

    loadBuildersFrom('components');
    loadBuildersFrom('helpers');

    return UI_MAP;
}

module.exports = {
    buildUIObject
};
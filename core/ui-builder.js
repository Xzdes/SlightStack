// Файл: core/ui-builder.js
// Собирает все "строители" в единый объект UI.

const fs = require('fs');
const path = require('path');

const UI = {};

function loadBuildersFrom(dirPath) {
    const absolutePath = path.join(__dirname, '..', dirPath);
    const files = fs.readdirSync(absolutePath);
    
    files.forEach(file => {
        if (path.extname(file) === '.js') {
            const builderName = path.basename(file, '.js');
            // require вернет функцию, которую мы и запишем в UI
            UI[builderName] = require(path.join(absolutePath, file));
        }
    });
}

// Загружаем все строители
loadBuildersFrom('components');
loadBuildersFrom('helpers');

module.exports = UI;
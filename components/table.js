// Файл: components/table.js

const For = require('../helpers/for.js');

/**
 * Внутренняя "разворачивающая" функция.
 * Преобразует строитель в VNode или возвращает объект как есть.
 * @param {object} builder - Строитель или VNode.
 * @returns {object|null} VNode.
 */
function unwrap(builder) {
    if (!builder) return null;
    return typeof builder.toJSON === 'function' ? builder.toJSON() : builder;
}

/**
 * Строитель для компонента "Таблица".
 * В отличие от простых компонентов, он сам управляет своей сложной структурой VNode.
 */
function TableBuilder() {
    this.tableProps = {
        headers: [],       // Массив объектов для заголовков { key, label }
        rows: [],          // Массив объектов с данными
        key: null,
        onMount: null,
        onUnmount: null,
        style: { width: '100%', borderCollapse: 'collapse' }
    };
    this.renderCellFn = null; // Кастомная функция для рендеринга ячеек
}

// --- Методы для настройки ---

TableBuilder.prototype.headers = function(headerArray) {
    this.tableProps.headers = headerArray;
    return this;
};

TableBuilder.prototype.rows = function(dataArray) {
    this.tableProps.rows = dataArray;
    return this;
};

TableBuilder.prototype.renderCell = function(renderFn) {
    this.renderCellFn = renderFn;
    return this;
};

// --- Общие методы, которые должны быть у каждого строителя ---

TableBuilder.prototype.key = function(k) {
    this.tableProps.key = k;
    return this;
};

TableBuilder.prototype.onMount = function(handler) {
    this.tableProps.onMount = handler;
    return this;
};

TableBuilder.prototype.onUnmount = function(handler) {
    this.tableProps.onUnmount = handler;
    return this;
};

TableBuilder.prototype.style = function(styleObject) {
    Object.assign(this.tableProps.style, styleObject);
    return this;
};

// --- Финальный метод ---

/**
 * Собирает и возвращает финальный VNode для всей таблицы.
 * @returns {object} VNode.
 */
TableBuilder.prototype.toJSON = function() {
    const { headers, rows, key, onMount, onUnmount, style } = this.tableProps;

    // Функция для рендеринга шапки таблицы (thead)
    const renderHeader = () => ({
        type: 'Thead', // Тип VNode
        props: { tag: 'thead' },
        children: [{
            type: 'Tr', 
            props: { tag: 'tr' },
            children: headers.map(h => ({
                type: 'Th',
                props: { 
                    tag: 'th', 
                    key: h.key, 
                    style: { padding: '12px', border: '1px solid #ddd', textAlign: 'left' } 
                },
                children: [h.label]
            }))
        }]
    });

    // Функция для рендеринга тела таблицы (tbody)
    const renderBody = () => ({
        type: 'Tbody',
        props: { tag: 'tbody' },
        children: [
            unwrap(For({
                each: rows,
                key: 'id', // Предполагаем, что у каждой строки есть уникальный 'id'
                as: (row) => ({ // Эта функция должна вернуть "строитель" или VNode
                    type: 'Tr',
                    props: { tag: 'tr', key: row.id },
                    children: headers.map(h => {
                        const cellContent = this.renderCellFn 
                            ? this.renderCellFn(h.key, row) 
                            : (row[h.key] ?? '');
                        
                        return {
                            type: 'Td',
                            props: { 
                                tag: 'td', 
                                key: h.key, 
                                style: { padding: '12px', border: '1px solid #ddd' } 
                            },
                            // Важно: unwrap может понадобиться, если renderCellFn вернет строитель
                            children: [ unwrap(cellContent) ] 
                        };
                    })
                })
            }))
        ]
    });

    // Собираем всё вместе в VNode для компонента Table
    return {
        type: 'Table',
        props: {
            tag: 'table',
            key: key,
            onMount: onMount,
            onUnmount: onUnmount,
            style: style
        },
        children: [renderHeader(), renderBody()]
    };
};

// Экспортируем функцию, которая возвращает новый экземпляр строителя.
// Это не вписывается в новую модель "конфигурации", но это осознанное исключение
// для такого сложного компонента.
// В server.js для него нужно будет сделать специальную обработку.
module.exports = () => new TableBuilder();
// Файл: components/table.js

const For = require('../helpers/for.js');

/**
 * Строитель для компонента "Таблица".
 */
function TableBuilder() {
    this.props = {
        headers: [],       // Массив объектов для заголовков { key, label }
        rows: [],          // Массив объектов с данными
        key: null,         // Ключ для самой таблицы
        onMount: null,
        onUnmount: null,
    };
    this.renderCellFn = null; // Кастомная функция для рендеринга ячеек
}

// --- Методы для настройки ---

/**
 * Устанавливает заголовки таблицы.
 * @param {Array<{key: string, label: string}>} headerArray - Массив объектов заголовков.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.headers = function(headerArray) {
    this.props.headers = headerArray;
    return this;
};

/**
 * Устанавливает данные для строк таблицы.
 * @param {Array<object>} dataArray - Массив объектов с данными.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.rows = function(dataArray) {
    this.props.rows = dataArray;
    return this;
};

/**
 * Задает кастомную функцию для рендеринга содержимого ячейки.
 * @param {Function} renderFn - Функция, принимающая (key, row) и возвращающая VNode.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.renderCell = function(renderFn) {
    this.renderCellFn = renderFn;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для самого элемента <table>.
 * @param {string|number} k - Уникальный ключ.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.key = function(k) {
    this.props.key = k;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования таблицы в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент <table>.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.onMount = function(handler) {
    this.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием таблицы из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент <table>.
 * @returns {TableBuilder} this для цепочки вызовов.
 */
TableBuilder.prototype.onUnmount = function(handler) {
    this.props.onUnmount = handler;
    return this;
};

/**
 * Внутренняя "разворачивающая" функция.
 * @param {object} builder - Строитель.
 * @returns {object|null} VNode.
 */
function unwrap(builder) {
    return builder && builder.toJSON ? builder.toJSON() : builder;
}


// --- Финальный метод ---

/**
 * Собирает финальный VNode для всей таблицы.
 * @returns {object} VNode.
 */
TableBuilder.prototype.toJSON = function() {
    const { headers, rows, key, onMount, onUnmount } = this.props;

    // Функция для рендеринга шапки таблицы (thead)
    const renderHeader = () => ({
        type: 'TableHeader',
        props: { tag: 'thead' },
        children: [{
            type: 'HeaderRow', 
            props: { tag: 'tr' },
            children: headers.map(h => ({
                type: 'HeaderCell', 
                props: { tag: 'th', key: h.key, style: { padding: '12px', border: '1px solid #ddd', textAlign: 'left' } },
                children: [h.label]
            }))
        }]
    });

    // Функция для рендеринга тела таблицы (tbody) с использованием UI.for
    const renderBody = () => ({
        type: 'TableBody', 
        props: { tag: 'tbody' },
        children: [For({
            each: rows,
            key: 'id', // Предполагаем, что у каждой строки есть уникальный 'id'
            as: (row) => ({
                type: 'BodyRow',
                props: { tag: 'tr', key: row.id }, // Ключ для строки <tr>
                children: headers.map(h => ({
                    type: 'BodyCell',
                    props: { tag: 'td', key: h.key, style: { padding: '12px', border: '1px solid #ddd' } }, // Ключ для ячейки <td>
                    children: [ this.renderCellFn ? this.renderCellFn(h.key, row) : (row[h.key] ?? '') ] // Используем ?? '' для пустых значений
                }))
            })
        })]
    });

    // Собираем всё вместе
    return {
        type: 'Table',
        props: {
            tag: 'table',
            key: key,
            onMount: onMount,
            onUnmount: onUnmount,
            style: { width: '100%', borderCollapse: 'collapse' }
        },
        children: [unwrap(renderHeader()), unwrap(renderBody())]
    };
};

module.exports = () => new TableBuilder();
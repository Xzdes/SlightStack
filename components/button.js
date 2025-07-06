// Файл: components/button.js

/**
 * Строитель для компонента "Кнопка".
 * @param {string} label - Текст, который будет отображаться на кнопке.
 */
function ButtonBuilder(label = '') {
    this.vNode = {
        type: 'Button',
        props: {
            tag: 'button',
            style: {}
        },
        children: [label] // Текст кнопки теперь всегда является дочерним элементом
    };
}

// --- Методы для настройки ---

/**
 * Устанавливает обработчик события 'click'.
 * @param {Function} handler - Функция, которая будет вызвана при клике.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.onClick = function(handler) {
    this.vNode.props.onClick = handler;
    return this;
};

/**
 * Добавляет или перезаписывает стили для элемента.
 * @param {object} styleObject - Объект со стилями (e.g., { color: 'red' }).
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};

/**
 * Устанавливает HTML-атрибут 'id'.
 * @param {string} id - Уникальный идентификатор элемента.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.id = function(id) {
    this.vNode.props.id = id;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для элемента, используемый VDOM для оптимизации.
 * Обязателен для элементов в списках, создаваемых через UI.for.
 * @param {string|number} keyValue - Уникальный ключ.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

/**
 * Привязывает объект-ссылку для получения прямого доступа к DOM-элементу.
 * @param {object} refObject - Объект вида { current: null }.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.ref = function(refObject) {
    this.vNode.props.ref = refObject;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования элемента в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент в качестве аргумента.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием элемента из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент в качестве аргумента.
 * @returns {ButtonBuilder} this для цепочки вызовов.
 */
ButtonBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};

// --- Финальный метод ---

/**
 * Возвращает "сырой" VNode объект для рендерера.
 * @returns {object} VNode.
 */
ButtonBuilder.prototype.toJSON = function() {
    return this.vNode;
};

module.exports = (label) => new ButtonBuilder(label);
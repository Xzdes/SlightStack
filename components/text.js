// Файл: components/text.js

/**
 * Строитель для текстовых элементов.
 * По умолчанию создает <p>, но тег можно изменить с помощью .as().
 * @param {string|number} initialValue - Начальное текстовое содержимое.
 */
function TextBuilder(initialValue = '') {
    this.vNode = {
        type: 'TextElement', 
        props: {
            tag: 'p',
            style: {}
        },
        children: [String(initialValue)] 
    };
}

// --- Методы для настройки внешнего вида и поведения ---

/**
 * Делает текст жирным (font-weight: bold).
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.bold = function() {
    this.vNode.props.style.fontWeight = 'bold';
    return this;
};

/**
 * Увеличивает размер шрифта.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.large = function() {
    this.vNode.props.style.fontSize = '1.25rem';
    return this;
};

/**
 * Уменьшает размер шрифта.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.small = function() {
    this.vNode.props.style.fontSize = '0.9rem';
    return this;
};

/**
 * Устанавливает цвет текста.
 * @param {string} colorValue - Значение цвета (e.g., 'red', '#ff0000').
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.color = function(colorValue) {
    this.vNode.props.style.color = colorValue;
    return this;
};

/**
 * Изменяет HTML-тег элемента.
 * @param {string} tagName - Имя тега (e.g., 'h1', 'span', 'div').
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.as = function(tagName) {
    this.vNode.props.tag = tagName;
    return this;
};

/**
 * Добавляет или перезаписывает стили для элемента.
 * @param {object} styleObject - Объект со стилями.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};

/**
 * Устанавливает обработчик события 'click'.
 * @param {Function} handler - Функция-обработчик.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.onClick = function(handler) {
    this.vNode.props.onClick = handler;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для элемента.
 * @param {string|number} keyValue - Уникальный ключ.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

/**
 * Привязывает объект-ссылку для получения прямого доступа к DOM-элементу.
 * @param {object} refObject - Объект вида { current: null }.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.ref = function(refObject) {
    this.vNode.props.ref = refObject;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования элемента в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием элемента из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {TextBuilder} this для цепочки вызовов.
 */
TextBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};


// --- Финальный метод ---

/**
 * Возвращает "сырой" VNode объект для рендерера.
 * @returns {object} VNode.
 */
TextBuilder.prototype.toJSON = function() {
    return this.vNode;
};

module.exports = (value) => new TextBuilder(value);
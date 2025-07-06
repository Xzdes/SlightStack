// Файл: components/row.js

/**
 * Строитель для компонента "Ряд" (Горизонтальный Flex-контейнер).
 * Располагает дочерние элементы в ряд, слева направо.
 */
function RowBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: {
                display: 'flex',
                flexDirection: 'row' // Главная особенность ряда
            }
        },
        children: []
    };
}

// --- Методы для настройки компоновки и внешнего вида ---

/**
 * Управляет поведением самого ряда внутри родительского flex-контейнера.
 * Например, если этот ряд находится внутри UI.stack().
 * @param {number} grow - Коэффициент роста (flex-grow).
 * @param {number} shrink - Коэффициент сжатия (flex-shrink).
 * @param {string} basis - Базовый размер (flex-basis).
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.flex = function(grow, shrink, basis) {
    this.vNode.props.style.flex = `${grow} ${shrink} ${basis}`;
    return this;
};

/**
 * Устанавливает отступ между дочерними элементами.
 * @param {number} size - Размер отступа в пикселях.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.gap = function(size) {
    this.vNode.props.style.gap = `${size}px`;
    return this;
};

/**
 * Задает дочерние элементы для ряда.
 * @param {...object} args - Компоненты-строители (UI.text, UI.button и т.д.).
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.children = function(...args) {
    this.vNode.children = args;
    return this;
};

/**
 * Управляет выравниванием дочерних элементов по главной оси (горизонтали).
 * @param {string} value - Значение CSS-свойства justifyContent (e.g., 'center', 'space-between').
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.justify = function(value) {
    this.vNode.props.style.justifyContent = value;
    return this;
};

/**
 * Управляет выравниванием дочерних элементов по поперечной оси (вертикали).
 * @param {string} value - Значение CSS-свойства alignItems (e.g., 'center', 'flex-start').
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.align = function(value) {
    this.vNode.props.style.alignItems = value;
    return this;
};

/**
 * Добавляет или перезаписывает стили.
 * @param {object} styleObject - Объект со стилями.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};

/**
 * Изменяет HTML-тег элемента.
 * @param {string} tagName - Имя тега.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.as = function(tagName) {
    this.vNode.props.tag = tagName;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для элемента.
 * @param {string|number} keyValue - Уникальный ключ.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

/**
 * Привязывает объект-ссылку для получения прямого доступа к DOM-элементу.
 * @param {object} refObject - Объект вида { current: null }.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.ref = function(refObject) {
    this.vNode.props.ref = refObject;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования элемента в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием элемента из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {RowBuilder} this для цепочки вызовов.
 */
RowBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};


// --- Финальный метод ---

/**
 * Возвращает "сырой" VNode объект для рендерера.
 * @returns {object} VNode.
 */
RowBuilder.prototype.toJSON = function() {
    return this.vNode;
};

module.exports = () => new RowBuilder();
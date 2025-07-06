// Файл: components/stack.js

/**
 * Строитель для компонента "Стек" (Вертикальный Flex-контейнер).
 * Располагает дочерние элементы друг под другом.
 */
function StackBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: {
                display: 'flex',
                flexDirection: 'column' // Главная особенность стека
            }
        },
        children: []
    };
}

// --- Методы для настройки компоновки и внешнего вида ---

/**
 * Управляет поведением самого стека внутри родительского flex-контейнера.
 * Например, если этот стек находится внутри UI.row().
 * @param {number} grow - Коэффициент роста (flex-grow).
 * @param {number} shrink - Коэффициент сжатия (flex-shrink).
 * @param {string} basis - Базовый размер (flex-basis).
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.flex = function(grow, shrink, basis) {
    this.vNode.props.style.flex = `${grow} ${shrink} ${basis}`;
    return this;
};

/**
 * Устанавливает отступ между дочерними элементами.
 * @param {number} size - Размер отступа в пикселях.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.gap = function(size) {
    this.vNode.props.style.gap = `${size}px`;
    return this;
};

/**
 * Задает дочерние элементы для стека.
 * @param {...object} args - Компоненты-строители (UI.text, UI.button и т.д.).
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.children = function(...args) {
    this.vNode.children = args;
    return this;
};

/**
 * Центрирует дочерние элементы по поперечной оси (горизонтали).
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.center = function() {
    this.vNode.props.style.alignItems = 'center';
    return this;
};

/**
 * Добавляет или перезаписывает стили.
 * @param {object} styleObject - Объект со стилями.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};

/**
 * Изменяет HTML-тег элемента.
 * @param {string} tagName - Имя тега.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.as = function(tagName) {
    this.vNode.props.tag = tagName;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для элемента.
 * @param {string|number} keyValue - Уникальный ключ.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

/**
 * Привязывает объект-ссылку для получения прямого доступа к DOM-элементу.
 * @param {object} refObject - Объект вида { current: null }.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.ref = function(refObject) {
    this.vNode.props.ref = refObject;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования элемента в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием элемента из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {StackBuilder} this для цепочки вызовов.
 */
StackBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};


// --- Финальный метод ---

/**
 * Возвращает "сырой" VNode объект для рендерера.
 * @returns {object} VNode.
 */
StackBuilder.prototype.toJSON = function() {
    return this.vNode;
};

module.exports = () => new StackBuilder();
// Файл: components/input.js (Исправленная версия)

/**
 * "Строитель" для элемента ввода (<input>).
 */
function InputBuilder() {
    this.vNode = {
        type: 'Input',
        props: {
            tag: 'input',
            type: 'text',
            style: {
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                width: 'calc(100% - 22px)',
            }
        }
    };
}

// --- Методы-модификаторы ---

/**
 * Устанавливает ID для элемента. Важно для сохранения фокуса.
 * @param {string} id - Уникальный идентификатор.
 */
InputBuilder.prototype.id = function(id) {
    this.vNode.props.id = id;
    return this;
};

/**
 * Устанавливает текущее значение в поле ввода.
 * @param {string | number} val - Значение.
 */
InputBuilder.prototype.value = function(val) {
    this.vNode.props.value = val;
    return this;
};

/**
 * Устанавливает текст-подсказку (placeholder).
 * @param {string} text - Текст подсказки.
 */
InputBuilder.prototype.placeholder = function(text) {
    this.vNode.props.placeholder = text;
    return this;
};

/**
 * Изменяет тип input (например, на 'password', 'number', 'checkbox').
 * @param {string} inputType - Тип элемента input.
 */
InputBuilder.prototype.type = function(inputType) {
    this.vNode.props.type = inputType;
    return this;
};

/**
 * Применяет объект со стилями к элементу.
 * @param {object} styleObject - Объект CSS-стилей.
 */
// --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
InputBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};


// --- Обработчики событий ---

/**
 * Назначает обработчик на событие ввода (срабатывает на каждое изменение).
 * @param {Function} handler - Функция обратного вызова.
 */
InputBuilder.prototype.onInput = function(handler) {
    this.vNode.props.onInput = handler;
    return this;
};

/**
 * Назначает обработчик на событие изменения (срабатывает после потери фокуса).
 * @param {Function} handler - Функция обратного вызова.
 */
InputBuilder.prototype.onChange = function(handler) {
    this.vNode.props.onChange = handler;
    return this;
};

// --- Хуки жизненного цикла ---

/**
 * Назначает обработчик, который выполнится после монтирования элемента в DOM.
 * @param {Function} handler - Функция обратного вызова.
 */
InputBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Назначает обработчик, который выполнится перед удалением элемента из DOM.
 * @param {Function} handler - Функция обратного вызова.
 */
InputBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};

// --- Финальный метод ---

/**
 * Возвращает собранный vNode. Вызывается рендерером.
 */
InputBuilder.prototype.toJSON = function() {
    return this.vNode;
};

// Экспортируем фабрику для создания экземпляра строителя.
module.exports = () => new InputBuilder();
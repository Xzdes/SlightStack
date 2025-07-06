// Файл: components/input.js

/**
 * Строитель для элемента <input>.
 */
function InputBuilder() {
    this.vNode = {
        type: 'Input',
        props: {
            tag: 'input',
            type: 'text', // тип по умолчанию
            style: {
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                width: 'calc(100% - 22px)', // Учитываем padding и border
            }
        },
        children: [] // У input-элемента не может быть дочерних элементов
    };
}

// --- Методы для настройки ---

/**
 * Устанавливает HTML-атрибут 'id'.
 * @param {string} id - Уникальный идентификатор.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.id = function(id) {
    this.vNode.props.id = id;
    return this;
};

/**
 * Устанавливает значение поля ввода.
 * @param {string|number} val - Значение.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.value = function(val) {
    this.vNode.props.value = val;
    return this;
};

/**
 * Устанавливает плейсхолдер (подсказку в пустом поле).
 * @param {string} text - Текст плейсхолдера.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.placeholder = function(text) {
    this.vNode.props.placeholder = text;
    return this;
};

/**
 * Устанавливает тип поля ввода.
 * @param {string} inputType - Тип (e.g., 'text', 'password', 'number', 'checkbox').
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.type = function(inputType) {
    this.vNode.props.type = inputType;
    return this;
};

/**
 * Добавляет или перезаписывает стили.
 * @param {object} styleObject - Объект со стилями.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.style = function(styleObject) {
    Object.assign(this.vNode.props.style, styleObject);
    return this;
};

// --- Методы для обработки событий ---

/**
 * Устанавливает обработчик события 'input'.
 * Срабатывает при каждом изменении значения.
 * @param {Function} handler - Функция-обработчик.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.onInput = function(handler) {
    this.vNode.props.onInput = handler;
    return this;
};

/**
 * Устанавливает обработчик события 'change'.
 * Срабатывает после изменения значения и потери фокуса.
 * @param {Function} handler - Функция-обработчик.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.onChange = function(handler) {
    this.vNode.props.onChange = handler;
    return this;
};


// --- НОВЫЕ МЕТОДЫ (УЛУЧШЕНИЯ ЯДРА) ---

/**
 * Устанавливает уникальный ключ для элемента.
 * @param {string|number} keyValue - Уникальный ключ.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

/**
 * Привязывает объект-ссылку для получения прямого доступа к DOM-элементу.
 * @param {object} refObject - Объект вида { current: null }.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.ref = function(refObject) {
    this.vNode.props.ref = refObject;
    return this;
};

/**
 * Устанавливает хук, который будет вызван после монтирования элемента в DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.onMount = function(handler) {
    this.vNode.props.onMount = handler;
    return this;
};

/**
 * Устанавливает хук, который будет вызван перед размонтированием элемента из DOM.
 * @param {Function} handler - Функция, принимающая DOM-элемент.
 * @returns {InputBuilder} this для цепочки вызовов.
 */
InputBuilder.prototype.onUnmount = function(handler) {
    this.vNode.props.onUnmount = handler;
    return this;
};


// --- Финальный метод ---

/**
 * Возвращает "сырой" VNode объект для рендерера.
 * @returns {object} VNode.
 */
InputBuilder.prototype.toJSON = function() {
    return this.vNode;
};

module.exports = () => new InputBuilder();
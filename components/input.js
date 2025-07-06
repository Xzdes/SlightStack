// Файл: components/input.js

module.exports = {
    /**
     * Настройки по умолчанию для компонента "Поле ввода".
     */
    defaults: {
        tag: 'input',
        style: {
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            width: 'calc(100% - 22px)', // Учитываем padding и border
        },
        /**
         * Функция инициализации для <input> не принимает аргументов,
         * так как у него не может быть дочерних элементов.
         */
        init: function() {
            this.vNode.children = []; // input всегда пуст внутри
            this.vNode.props.type = 'text'; // тип по умолчанию
        }
    },

    /**
     * Уникальные методы, специфичные только для компонента "Поле ввода".
     */
    methods: {
        /**
         * Устанавливает HTML-атрибут 'id'.
         * @param {string} id - Уникальный идентификатор.
         * @returns {this}
         */
        id: function(id) {
            this.vNode.props.id = id;
            return this;
        },

        /**
         * Устанавливает значение поля ввода.
         * @param {string|number} val - Значение.
         * @returns {this}
         */
        value: function(val) {
            this.vNode.props.value = val;
            return this;
        },

        /**
         * Устанавливает плейсхолдер (подсказку в пустом поле).
         * @param {string} text - Текст плейсхолдера.
         * @returns {this}
         */
        placeholder: function(text) {
            this.vNode.props.placeholder = text;
            return this;
        },

        /**
         * Устанавливает тип поля ввода.
         * @param {string} inputType - Тип (e.g., 'text', 'password', 'number', 'checkbox').
         * @returns {this}
         */
        type: function(inputType) {
            this.vNode.props.type = inputType;
            return this;
        },
        
        /**
         * Устанавливает состояние checked для checkbox или radio.
         * @param {boolean} isChecked - Состояние.
         * @returns {this}
         */
        checked: function(isChecked = true) {
            this.vNode.props.checked = isChecked;
            return this;
        },

        /**
         * Устанавливает обработчик события 'input'.
         * Срабатывает при каждом изменении значения.
         * @param {Function} handler - Функция-обработчик.
         * @returns {this}
         */
        onInput: function(handler) {
            this.vNode.props.onInput = handler;
            return this;
        },

        /**
         * Устанавливает обработчик события 'change'.
         * Срабатывает после изменения значения и потери фокуса.
         * @param {Function} handler - Функция-обработчик.
         * @returns {this}
         */
        onChange: function(handler) {
            this.vNode.props.onChange = handler;
            return this;
        }
    }
};
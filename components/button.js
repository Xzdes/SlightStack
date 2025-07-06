// Файл: components/button.js

module.exports = {
    /**
     * Настройки по умолчанию для компонента "Кнопка".
     */
    defaults: {
        tag: 'button',
        style: {
            /* 
               Стили по умолчанию можно вынести сюда для консистентности,
               например: padding, border, cursor и т.д.
               padding: '8px 16px',
               border: '1px solid #ccc',
               borderRadius: '4px',
               cursor: 'pointer'
            */
        },
        /**
         * Функция инициализации. Вызывается при создании строителя.
         * Принимает текст для кнопки: UI.button('Click me').
         * @param {string} label - Текст, который будет отображаться на кнопке.
         */
        init: function(label = '') {
            this.vNode.children = [label];
        }
    },

    /**
     * Уникальные методы, специфичные только для компонента "Кнопка".
     */
    methods: {
        /**
         * Устанавливает обработчик события 'click'.
         * @param {Function} handler - Функция, которая будет вызвана при клике.
         * @returns {this}
         */
        onClick: function(handler) {
            this.vNode.props.onClick = handler;
            return this;
        },

        /**
         * Устанавливает HTML-атрибут 'id'.
         * @param {string} id - Уникальный идентификатор элемента.
         * @returns {this}
         */
        id: function(id) {
            this.vNode.props.id = id;
            return this;
        },

        /**
         * Устанавливает HTML-атрибут 'disabled'.
         * @param {boolean} isDisabled - Если true, кнопка будет неактивна.
         * @returns {this}
         */
        disabled: function(isDisabled = true) {
            this.vNode.props.disabled = isDisabled;
            return this;
        }
    }
};
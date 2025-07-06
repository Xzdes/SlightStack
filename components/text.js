// Файл: components/text.js

module.exports = {
    /**
     * Настройки по умолчанию для компонента "Текст".
     */
    defaults: {
        tag: 'p',
        style: {},
        /**
         * Функция инициализации. Вызывается при создании строителя.
         * Принимает текстовое содержимое: UI.text('Hello World').
         * @param {string|number} initialValue - Начальное текстовое содержимое.
         */
        init: function(initialValue = '') {
            // Текстовое содержимое всегда является дочерним элементом.
            this.vNode.children = [String(initialValue)];
        }
    },

    /**
     * Уникальные методы, специфичные только для компонента "Текст".
     */
    methods: {
        /**
         * Делает текст жирным.
         * @returns {this}
         */
        bold: function() {
            this.vNode.props.style.fontWeight = 'bold';
            return this;
        },

        /**
         * Увеличивает размер шрифта.
         * @returns {this}
         */
        large: function() {
            this.vNode.props.style.fontSize = '1.25rem';
            return this;
        },

        /**
         * Уменьшает размер шрифта.
         * @returns {this}
         */
        small: function() {
            this.vNode.props.style.fontSize = '0.9rem';
            return this;
        },

        /**
         * Устанавливает цвет текста.
         * @param {string} colorValue - Значение цвета CSS (e.g., 'red', '#ff0000').
         * @returns {this}
         */
        color: function(colorValue) {
            this.vNode.props.style.color = colorValue;
            return this;
        },

        /**
         * Изменяет HTML-тег элемента.
         * @param {string} tagName - Имя тега (e.g., 'span', 'h1').
         * @returns {this}
         */
        as: function(tagName) {
            this.vNode.props.tag = tagName;
            return this;
        },

        /**
         * Устанавливает обработчик события 'click'.
         * Полезно, если текст используется как ссылка или кнопка.
         * @param {Function} handler - Функция, которая будет вызвана при клике.
         * @returns {this}
         */
        onClick: function(handler) {
            this.vNode.props.onClick = handler;
            return this;
        }
    }
};
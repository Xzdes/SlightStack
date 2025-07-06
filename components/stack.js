// Файл: components/stack.js

module.exports = {
    /**
     * Настройки по умолчанию для компонента "Стек".
     * Эти значения используются при создании экземпляра строителя.
     */
    defaults: {
        tag: 'div',
        style: {
            display: 'flex',
            flexDirection: 'column' // Главная особенность стека
        },
        /**
         * Функция инициализации. Вызывается при создании строителя.
         * Принимает аргументы, переданные в UI.stack(...).
         * @param {...object} children - Дочерние компоненты.
         */
        init: function(...children) {
            // `this` здесь - это экземпляр строителя, созданный в ui-builder.js
            if (children.length > 0) {
                this.vNode.children = children;
            }
        }
    },

    /**
     * Уникальные методы, специфичные только для компонента "Стек".
     */
    methods: {
        /**
         * Задает дочерние элементы для стека.
         * @param {...object} args - Компоненты-строители (UI.text, UI.button и т.д.).
         * @returns {this}
         */
        children: function(...args) {
            this.vNode.children = args;
            return this;
        },

        /**
         * Управляет поведением самого стека внутри родительского flex-контейнера.
         * @param {number} grow - Коэффициент роста (flex-grow).
         * @param {number} shrink - Коэффициент сжатия (flex-shrink).
         * @param {string} basis - Базовый размер (flex-basis).
         * @returns {this}
         */
        flex: function(grow, shrink, basis) {
            this.vNode.props.style.flex = `${grow} ${shrink} ${basis}`;
            return this;
        },

        /**
         * Устанавливает отступ между дочерними элементами.
         * @param {number} size - Размер отступа в пикселях.
         * @returns {this}
         */
        gap: function(size) {
            this.vNode.props.style.gap = `${size}px`;
            return this;
        },

        /**
         * Центрирует дочерние элементы по поперечной оси (горизонтали).
         * @returns {this}
         */
        center: function() {
            this.vNode.props.style.alignItems = 'center';
            return this;
        },

        /**
         * Изменяет HTML-тег элемента.
         * @param {string} tagName - Имя тега.
         * @returns {this}
         */
        as: function(tagName) {
            this.vNode.props.tag = tagName;
            return this;
        }
    }
};
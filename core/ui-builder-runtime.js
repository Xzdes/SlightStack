// Файл: core/ui-builder-runtime.js

/**
 * Объект-прототип с общими методами для всех строителей компонентов.
 * Этот код выполняется в браузере.
 */
const BaseBuilder = {
    /**
     * Устанавливает или добавляет props для VNode.
     * @param {object} propsObject - Объект с props.
     * @returns {this}
     */
    props(propsObject) {
        Object.assign(this.vNode.props, propsObject);
        return this;
    },

    /**
     * Добавляет или перезаписывает CSS-стили.
     * @param {object} styleObject - Объект со стилями.
     * @returns {this}
     */
    style(styleObject) {
        if (!this.vNode.props.style) {
            this.vNode.props.style = {};
        }
        Object.assign(this.vNode.props.style, styleObject);
        return this;
    },

    /**
     * Устанавливает уникальный ключ для VDOM-оптимизации.
     * @param {string|number} keyValue - Уникальный ключ.
     * @returns {this}
     */
    key(keyValue) {
        this.vNode.props.key = keyValue;
        return this;
    },

    /**
     * Привязывает ref-объект для прямого доступа к DOM-элементу.
     * @param {object} refObject - Объект вида { current: null }.
     * @returns {this}
     */
    ref(refObject) {
        this.vNode.props.ref = refObject;
        return this;
    },

    /**
     * Устанавливает хук жизненного цикла onMount.
     * @param {Function} handler - Функция, вызываемая после монтирования.
     * @returns {this}
     */
    onMount(handler) {
        this.vNode.props.onMount = handler;
        return this;
    },

    /**
     * Устанавливает хук жизненного цикла onUnmount.
     * @param {Function} handler - Функция, вызываемая перед размонтированием.
     * @returns {this}
     */
    onUnmount(handler) {
        this.vNode.props.onUnmount = handler;
        return this;
    },

    /**
     * Устанавливает специальный data-атрибут для идентификации в редакторе.
     * @param {string|number} id - Уникальный идентификатор для редактора.
     * @returns {this}
     */
    editorId(id) {
        if (!this.vNode.props.attrs) {
            this.vNode.props.attrs = {};
        }
        this.vNode.props.attrs['data-editor-id'] = id;
        return this;
    },
    
    /**
     * Финализирующий метод, возвращает "сырой" VNode объект.
     * @returns {object} VNode.
     */
    toJSON() {
        return this.vNode;
    }
};

/**
 * Фабрика, которая создает функцию-конструктор для определенного типа строителя.
 * @param {string} componentType - Имя типа компонента (e.g., 'Row', 'Button').
 * @param {object} defaults - Объект с настройками по умолчанию для компонента.
 * @returns {Function} Функция, создающая экземпляр строителя.
 */
function createBuilderFactory(componentType, defaults = {}) {
    return (...args) => {
        const vNode = {
            type: componentType,
            props: {
                tag: defaults.tag || 'div',
                style: { ...(defaults.style || {}) },
            },
            children: []
        };
        const builder = Object.create(BaseBuilder);
        builder.vNode = vNode;
        if (defaults.init) {
            defaults.init.call(builder, ...args);
        }
        return builder;
    };
}

module.exports = { createBuilderFactory };
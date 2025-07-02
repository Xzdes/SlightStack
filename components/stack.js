// Файл: components/stack.js (Финальная версия с .as() и .key())

function StackBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: { display: 'flex', flexDirection: 'column' },
            children: []
        }
    };
}

// --- Методы-модификаторы ---

StackBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
StackBuilder.prototype.children = function(...args) { this.vNode.props.children = args; return this; };
StackBuilder.prototype.center = function() { this.vNode.props.style.alignItems = 'center'; return this; };
StackBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };

// --- НОВЫЙ МЕТОД: Изменяет HTML-тег ---
StackBuilder.prototype.as = function(tagName) {
    this.vNode.props.tag = tagName;
    return this;
};

// --- НОВЫЙ МЕТОД: Устанавливает ключ ---
StackBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

// --- Хуки жизненного цикла ---
StackBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
StackBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };

// --- Финальный метод ---
StackBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new StackBuilder();
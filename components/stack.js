// Файл: components/stack.js

function StackBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: { display: 'flex', flexDirection: 'column' }
        },
        children: []
    };
}

// --- НОВЫЙ МЕТОД ---
/**
 * Управляет поведением элемента внутри родительского flex-контейнера.
 * @param {number} grow - Коэффициент роста.
 * @param {number} shrink - Коэффициент сжатия.
 * @param {string} basis - Базовый размер.
 */
StackBuilder.prototype.flex = function(grow, shrink, basis) {
    this.vNode.props.style.flex = `${grow} ${shrink} ${basis}`;
    return this;
};
// --------------------

StackBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
StackBuilder.prototype.children = function(...args) { this.vNode.children = args; return this; };
StackBuilder.prototype.center = function() { this.vNode.props.style.alignItems = 'center'; return this; };
StackBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
StackBuilder.prototype.as = function(tagName) { this.vNode.props.tag = tagName; return this; };
StackBuilder.prototype.key = function(keyValue) { this.vNode.props.key = keyValue; return this; };
StackBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
StackBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };
StackBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new StackBuilder();
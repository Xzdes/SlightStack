// Файл: components/row.js

function RowBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: { display: 'flex', flexDirection: 'row' }
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
RowBuilder.prototype.flex = function(grow, shrink, basis) {
    this.vNode.props.style.flex = `${grow} ${shrink} ${basis}`;
    return this;
};
// --------------------

RowBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
RowBuilder.prototype.children = function(...args) { this.vNode.children = args; return this; };
RowBuilder.prototype.justify = function(value) { this.vNode.props.style.justifyContent = value; return this; };
RowBuilder.prototype.align = function(value) { this.vNode.props.style.alignItems = value; return this; };
RowBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
RowBuilder.prototype.as = function(tagName) { this.vNode.props.tag = tagName; return this; };
RowBuilder.prototype.key = function(keyValue) { this.vNode.props.key = keyValue; return this; };
RowBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
RowBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };
RowBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new RowBuilder();
// Файл: components/row.js (Финальная версия с .as() и .key())

function RowBuilder() {
    this.vNode = {
        type: 'Layout',
        props: {
            tag: 'div',
            style: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
            children: []
        }
    };
}

// --- Методы-модификаторы ---
RowBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
RowBuilder.prototype.children = function(...args) { this.vNode.props.children = args; return this; };
RowBuilder.prototype.justify = function(value) { const flexValue = value === 'end' ? 'flex-end' : value; this.vNode.props.style.justifyContent = flexValue; return this; };
RowBuilder.prototype.align = function(value) { this.vNode.props.style.alignItems = value; return this; };
RowBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };

// --- НОВЫЙ МЕТОД: Изменяет HTML-тег ---
RowBuilder.prototype.as = function(tagName) {
    this.vNode.props.tag = tagName;
    return this;
};

// --- НОВЫЙ МЕТОД: Устанавливает ключ ---
RowBuilder.prototype.key = function(keyValue) {
    this.vNode.props.key = keyValue;
    return this;
};

// --- Хуки жизненного цикла ---
RowBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
RowBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };

// --- Финальный метод ---
RowBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new RowBuilder();
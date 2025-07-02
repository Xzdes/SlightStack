// Файл: components/text.js

function TextBuilder(initialValue = '') {
    this.vNode = {
        type: 'TextElement', 
        props: {
            tag: 'p',
            style: {}
        },
        children: [String(initialValue)] 
    };
}

// Методы-модификаторы
TextBuilder.prototype.bold = function() { this.vNode.props.style.fontWeight = 'bold'; return this; };
TextBuilder.prototype.large = function() { this.vNode.props.style.fontSize = '1.25rem'; return this; };
TextBuilder.prototype.small = function() { this.vNode.props.style.fontSize = '0.9rem'; return this; };
TextBuilder.prototype.color = function(c) { this.vNode.props.style.color = c; return this; };
TextBuilder.prototype.as = function(tag) { this.vNode.props.tag = tag; return this; };
TextBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
TextBuilder.prototype.onClick = function(handler) { this.vNode.props.onClick = handler; return this; };

// --- НЕДОСТАЮЩИЙ МЕТОД ---
TextBuilder.prototype.key = function(keyValue) { this.vNode.props.key = keyValue; return this; };
// -------------------------

// Хуки жизненного цикла
TextBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
TextBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };

// Финальный метод
TextBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = (value) => new TextBuilder(value);
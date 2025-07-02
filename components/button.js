// Файл: components/button.js (ФИНАЛЬНАЯ, ПРАВИЛЬНАЯ ВЕРСИЯ)

function ButtonBuilder(label) {
    this.vNode = {
        type: 'Button',
        props: { tag: 'button', style: {} },
        children: [label] // Текст кнопки идет в children
    };
}

// Методы-модификаторы
ButtonBuilder.prototype.onClick = function(handler) { this.vNode.props.onClick = handler; return this; };
ButtonBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
ButtonBuilder.prototype.id = function(id) { this.vNode.props.id = id; return this; };

// Хуки жизненного цикла
ButtonBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
ButtonBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };

// Финальный метод
ButtonBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = (label) => new ButtonBuilder(label);
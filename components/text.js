// Файл: components/text.js (ФИНАЛЬНАЯ, ИСПРАВЛЕННАЯ ВЕРСИЯ)

function TextBuilder(initialValue = '') {
    this.vNode = {
        // --- ИЗМЕНЕНИЕ: Тип теперь общий, а не специальный 'text' ---
        type: 'TextElement', 
        props: {
            tag: 'p', // По умолчанию это <p>
            style: {}
        },
        // Текстовое содержимое является дочерним элементом этого vNode
        children: [String(initialValue)] 
    };
}

// Методы-модификаторы теперь будут работать, так как рендерер создаст настоящий элемент
TextBuilder.prototype.bold = function() { this.vNode.props.style.fontWeight = 'bold'; return this; };
TextBuilder.prototype.large = function() { this.vNode.props.style.fontSize = '1.25rem'; return this; };
TextBuilder.prototype.small = function() { this.vNode.props.style.fontSize = '0.9rem'; return this; };
TextBuilder.prototype.color = function(c) { this.vNode.props.style.color = c; return this; };
TextBuilder.prototype.as = function(tag) { this.vNode.props.tag = tag; return this; }; // Этот метод теперь критически важен
TextBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
TextBuilder.prototype.onClick = function(handler) { this.vNode.props.onClick = handler; return this; };

// Хуки жизненного цикла
TextBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
TextBuilder.prototype.onUnmount = function(handler) { this.vNode.props.onUnmount = handler; return this; };

// Финальный метод
TextBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = (value) => new TextBuilder(value);
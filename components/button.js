// Файл: components/button.js

function ButtonBuilder(label) {
    this.vNode = {
        type: 'Button',
        props: { tag: 'button', children: [label], style: {} }
    };
}
ButtonBuilder.prototype.onClick = function(handler) { this.vNode.props.onClick = handler; return this; };
ButtonBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
ButtonBuilder.prototype.id = function(id) { this.vNode.props.id = id; return this; };
ButtonBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = (label) => new ButtonBuilder(label);
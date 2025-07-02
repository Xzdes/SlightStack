// Файл: components/text.js

function TextBuilder(initialValue = '') {
    this.vNode = {
        type: 'Text',
        props: { tag: 'p', style: {}, children: [initialValue] }
    };
}
TextBuilder.prototype.bold = function() { this.vNode.props.style.fontWeight = 'bold'; return this; };
TextBuilder.prototype.large = function() { this.vNode.props.style.fontSize = '1.25rem'; return this; };
TextBuilder.prototype.small = function() { this.vNode.props.style.fontSize = '0.9rem'; return this; };
TextBuilder.prototype.color = function(c) { this.vNode.props.style.color = c; return this; };
TextBuilder.prototype.as = function(tag) { this.vNode.props.tag = tag; return this; };
TextBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
TextBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = (value) => new TextBuilder(value);
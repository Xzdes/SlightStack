// Файл: components/row.js

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
RowBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
RowBuilder.prototype.children = function(...args) { this.vNode.props.children = args; return this; };
RowBuilder.prototype.justify = function(value) { const flexValue = value === 'end' ? 'flex-end' : value; this.vNode.props.style.justifyContent = flexValue; return this; };
RowBuilder.prototype.align = function(value) { this.vNode.props.style.alignItems = value; return this; };
RowBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
RowBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new RowBuilder();
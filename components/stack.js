// Файл: components/stack.js

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
StackBuilder.prototype.gap = function(size) { this.vNode.props.style.gap = `${size}px`; return this; };
StackBuilder.prototype.children = function(...args) { this.vNode.props.children = args; return this; };
StackBuilder.prototype.center = function() { this.vNode.props.style.alignItems = 'center'; return this; };
StackBuilder.prototype.style = function(styleObject) { Object.assign(this.vNode.props.style, styleObject); return this; };
StackBuilder.prototype.toJSON = function() { return this.vNode; };

module.exports = () => new StackBuilder();
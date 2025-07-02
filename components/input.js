// Файл: components/input.js
function InputBuilder() {
this.vNode = {
type: 'Input',
props: {
tag: 'input',
type: 'text',
style: {
padding: '10px', fontSize: '16px', border: '1px solid #ccc',
borderRadius: '5px', width: 'calc(100% - 22px)',
}
}
};
}
InputBuilder.prototype.id = function(id) { this.vNode.props.id = id; return this; };
InputBuilder.prototype.value = function(val) { this.vNode.props.value = val; return this; };
InputBuilder.prototype.placeholder = function(text) { this.vNode.props.placeholder = text; return this; };
InputBuilder.prototype.type = function(inputType) { this.vNode.props.type = inputType; return this; };
InputBuilder.prototype.onInput = function(handler) { this.vNode.props.onInput = handler; return this; };
InputBuilder.prototype.onChange = function(handler) { this.vNode.props.onChange = handler; return this; };
InputBuilder.prototype.onMount = function(handler) { this.vNode.props.onMount = handler; return this; };
InputBuilder.prototype.toJSON = function() { return this.vNode; };
module.exports = () => new InputBuilder();
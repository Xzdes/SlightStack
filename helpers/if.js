// Файл: helpers/if.js
function IfBuilder(condition) {
    this.condition = condition;
    this.thenFn = () => null;
}
IfBuilder.prototype.then = function(builder) { this.thenFn = () => builder; return this; };
IfBuilder.prototype.else = function(builder) { this.elseFn = () => builder; return this; };
IfBuilder.prototype.toJSON = function() {
    if (this.condition) {
        const builder = this.thenFn();
        return builder && builder.toJSON ? builder.toJSON() : builder;
    } else if (this.elseFn) {
        const builder = this.elseFn();
        return builder && builder.toJSON ? builder.toJSON() : builder;
    }
    return null;
};
module.exports = (condition) => new IfBuilder(condition);
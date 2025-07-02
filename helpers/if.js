// Файл: helpers/if.js

function IfBuilder(condition) {
    this.condition = !!condition;
    this.thenBuilder = null;
    this.elseBuilder = null;
}

IfBuilder.prototype.then = function(builder) {
    this.thenBuilder = builder;
    return this;
};

IfBuilder.prototype.else = function(builder) {
    this.elseBuilder = builder;
    return this;
};

function unwrapBuilder(builderOrFn) {
    if (!builderOrFn) {
        return null;
    }
    const builder = typeof builderOrFn === 'function' ? builderOrFn() : builderOrFn;
    
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    
    return builder;
}

IfBuilder.prototype.toJSON = function() {
    if (this.condition) {
        return unwrapBuilder(this.thenBuilder);
    } else {
        return unwrapBuilder(this.elseBuilder);
    }
};

module.exports = (condition) => new IfBuilder(condition);
// Файл: helpers/if.js (НЕБОЛЬШОЕ УЛУЧШЕНИЕ)

function IfBuilder(conditionFn) {
    // Теперь мы храним функцию, а не результат
    this.conditionFn = conditionFn;
    this.thenBranch = null;
    this.elseBranch = null;
}

IfBuilder.prototype.then = function(builderOrFn) {
    this.thenBranch = builderOrFn;
    return this;
};

IfBuilder.prototype.else = function(builderOrFn) {
    this.elseBranch = builderOrFn;
    return this;
};

function unwrapBranch(branch) {
    // ... (без изменений)
    if (!branch) {
        return null;
    }
    const builder = typeof branch === 'function' ? branch() : branch;
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    return builder;
}

IfBuilder.prototype.toJSON = function() {
    // Вызываем функцию УСЛОВИЯ здесь, внутри рендера.
    // Это гарантирует, что зависимость (state.showInfo) будет отслежена.
    if (this.conditionFn()) {
        return unwrapBranch(this.thenBranch);
    } else {
        return unwrapBranch(this.elseBranch);
    }
};

// Экспортируем функцию, которая принимает ФУНКЦИЮ
module.exports = (conditionFn) => new IfBuilder(conditionFn);
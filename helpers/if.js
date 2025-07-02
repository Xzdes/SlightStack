// Файл: helpers/if.js (Финальная, исправленная версия)

/**
 * "Строитель" для условного рендеринга.
 * @param {boolean} condition - Условие, которое определяет, что будет отрендерено.
 */
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

// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
/**
 * Рекурсивно "распаковывает" строитель, выполняя функции, если они есть.
 * @param {object|Function} builderOrFn - Строитель или функция, возвращающая строитель.
 * @returns {object|null} - vNode или null
 */
function unwrapBuilder(builderOrFn) {
    if (!builderOrFn) {
        return null;
    }

    // Если это функция, вызываем ее, чтобы получить строитель
    const builder = typeof builderOrFn === 'function' ? builderOrFn() : builderOrFn;
    
    // Теперь, когда у нас точно есть строитель, получаем его vNode
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    
    return builder; // Возвращаем как есть (например, для простых строк)
}


IfBuilder.prototype.toJSON = function() {
    if (this.condition) {
        return unwrapBuilder(this.thenBuilder);
    } else {
        return unwrapBuilder(this.elseBuilder);
    }
};

module.exports = (condition) => new IfBuilder(condition);
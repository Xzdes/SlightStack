// Файл: helpers/if.js

/**
 * "Строитель" для условного рендеринга.
 * @param {boolean} condition - Условие, которое определяет, что будет отрендерено.
 */
function IfBuilder(condition) {
    this.condition = !!condition; // Приводим к булеву типу на всякий случай
    this.thenBuilder = null;      // Строитель для случая "истина"
    this.elseBuilder = null;      // Строитель для случая "ложь"
}

// --- Методы-модификаторы ---

/**
 * Задает строитель, который будет выполнен, если условие истинно.
 * @param {object} builder - Другой компонент-строитель (например, UI.text(...)).
 */
IfBuilder.prototype.then = function(builder) {
    this.thenBuilder = builder;
    return this;
};

/**
 * Задает строитель, который будет выполнен, если условие ложно.
 * @param {object} builder - Другой компонент-строитель.
 */
IfBuilder.prototype.else = function(builder) {
    this.elseBuilder = builder;
    return this;
};

// --- Финальный метод ---

/**
 * Возвращает vNode нужной ветки (then или else) или null. Вызывается рендерером.
 */
IfBuilder.prototype.toJSON = function() {
    if (this.condition) {
        // Если условие истинно, "распаковываем" строитель из then
        const builderToRender = this.thenBuilder;
        // Проверяем, что это валидный строитель, перед вызовом toJSON
        return builderToRender && typeof builderToRender.toJSON === 'function' 
            ? builderToRender.toJSON() 
            : builderToRender;
    } else if (this.elseBuilder) {
        // Если условие ложно, "распаковываем" строитель из else
        const builderToRender = this.elseBuilder;
        return builderToRender && typeof builderToRender.toJSON === 'function' 
            ? builderToRender.toJSON() 
            : builderToRender;
    }
    
    // Если условие ложно и нет ветки else, не рендерим ничего
    return null;
};

// Экспортируем фабрику для создания экземпляра строителя.
module.exports = (condition) => new IfBuilder(condition);
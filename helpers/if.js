// Файл: helpers/if.js

/**
 * Внутренняя функция для "разворачивания" ветки условия.
 * Если передан строитель, вызывает его .toJSON().
 * Если передана функция, вызывает ее и затем разворачивает результат.
 * @param {object|Function|null} branch - Ветка условия.
 * @returns {object|null} VNode или null.
 */
function unwrapBranch(branch) {
    if (!branch) {
        return null;
    }
    // Если ветка - это функция (для ленивого вычисления), вызываем ее
    const builder = typeof branch === 'function' ? branch() : branch;
    
    // Если результат - это строитель, получаем его VNode
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    
    // Иначе возвращаем как есть (может быть уже VNode или null)
    return builder;
}

/**
 * Строитель для условного рендеринга.
 * @param {Function} conditionFn - Функция, возвращающая boolean.
 */
function IfBuilder(conditionFn) {
    // Храним функцию условия, а не ее результат, для реактивности.
    this.conditionFn = conditionFn;
    this.thenBranch = null;
    this.elseBranch = null;
}

/**
 * Устанавливает VNode или строитель для случая, когда условие истинно.
 * @param {object|Function} builderOrFn - Строитель или функция, возвращающая строитель.
 * @returns {this}
 */
IfBuilder.prototype.then = function(builderOrFn) {
    this.thenBranch = builderOrFn;
    return this;
};

/**
 * Устанавливает VNode или строитель для случая, когда условие ложно.
 * @param {object|Function} builderOrFn - Строитель или функция, возвращающая строитель.
 * @returns {this}
 */
IfBuilder.prototype.else = function(builderOrFn) {
    this.elseBranch = builderOrFn;
    return this;
};

/**
* Финализирующий метод. Вычисляет условие и возвращает VNode соответствующей ветки.
* Этот метод вызывается на каждом цикле рендера, обеспечивая реактивность.
* @returns {object|null} VNode.
*/
IfBuilder.prototype.toJSON = function() {
    // Условие вычисляется именно здесь, в момент рендеринга.
    // Это гарантирует, что все реактивные зависимости будут отслежены.
    if (this.conditionFn()) {
        return unwrapBranch(this.thenBranch);
    } else {
        return unwrapBranch(this.elseBranch);
    }
};

/**
 * Экспортируем функцию, которая принимает функцию-условие и возвращает IfBuilder.
 * @param {Function} conditionFn - Функция, возвращающая boolean.
 * @returns {IfBuilder}
 */
module.exports = (conditionFn) => new IfBuilder(conditionFn);
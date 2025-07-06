// Файл: core/tracker.js

const dependencyStack = [];

/**
 * Помещает функцию-обновлятор в стек.
 * Теперь система знает, что эта функция является "активной"
 * и все обращения к реактивным свойствам должны ее "запомнить".
 * @param {Function} updater - Функция, которая будет отслеживаться.
 */
function startTracking(updater) {
    dependencyStack.push(updater);
}

/**
 * Убирает последнюю функцию-обновлятор из стека,
 * завершая тем самым период отслеживания для нее.
 */
function stopTracking() {
    dependencyStack.pop();
}

/**
 * Возвращает текущую активную функцию-обновлятор.
 * @returns {Function|undefined} Активный эффект или undefined, если его нет.
 */
function getActiveUpdater() {
    return dependencyStack[dependencyStack.length - 1];
}

module.exports = { startTracking, stopTracking, getActiveUpdater };
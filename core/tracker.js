// Файл: core/tracker.js (Версия со стеком)

const dependencyStack = [];

function startTracking(updater) {
    dependencyStack.push(updater);
}

function stopTracking() {
    dependencyStack.pop();
}

function getActiveUpdater() {
    // Возвращаем последний элемент, не удаляя его
    return dependencyStack[dependencyStack.length - 1];
}

module.exports = { startTracking, stopTracking, getActiveUpdater };
// Файл: core/reactivity/effect.js

const dependencyStack = [];

function startTracking(updater) {
    dependencyStack.push(updater);
}

function stopTracking() {
    dependencyStack.pop();
}

function getActiveUpdater() {
    return dependencyStack[dependencyStack.length - 1];
}

function createEffect(fn) {
    const effect = () => {
        startTracking(effect);
        fn();
        stopTracking();
    };
    effect();
    // [ИЗМЕНЕНИЕ] Возвращаем саму функцию эффекта, чтобы ее можно было вызывать извне.
    return effect;
}

module.exports = { createEffect, getActiveUpdater };
// Файл: core/reactive.js (Новое ядро с эффектами)

const tracker = require('./tracker');

// depMap теперь внутри модуля, а не передается снаружи
const depMap = new Map();

function track(key) {
    const activeEffect = tracker.getActiveUpdater();
    if (activeEffect) {
        if (!depMap.has(key)) depMap.set(key, new Set());
        depMap.get(key).add(activeEffect);
    }
}

function trigger(key) {
    const effects = depMap.get(key);
    if (effects) [...effects].forEach(effect => effect());
}

function createReactive(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            track(key);
            return Reflect.get(target, key, receiver);
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue === value) return true;
            const res = Reflect.set(target, key, value, receiver);
            trigger(key);
            return res;
        }
    });
}

// Новая функция для создания "слушателей"
function createEffect(fn) {
    const effect = () => {
        tracker.startTracking(effect);
        fn();
        tracker.stopTracking();
    };
    effect(); // Запускаем эффект в первый раз, чтобы собрать зависимости
}

module.exports = { createReactive, createEffect };
// Файл: core/reactive.js (НОВАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ МАССИВОВ)

const tracker = require('./tracker');

const dependencyMap = new Map();

function track(key) {
    const activeEffect = tracker.getActiveUpdater();
    if (activeEffect) {
        if (!dependencyMap.has(key)) {
            dependencyMap.set(key, new Set());
        }
        dependencyMap.get(key).add(activeEffect);
    }
}

function trigger(key) {
    const effects = dependencyMap.get(key);
    if (effects) {
        const effectsToRun = new Set(effects);
        effectsToRun.forEach(effect => effect());
    }
}

// Методы, которые изменяют массив, не меняя его ссылку
const arrayMutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

function createReactive(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            // Если мы обращаемся к свойству массива...
            if (Array.isArray(target) && arrayMutatingMethods.includes(key)) {
                // ...мы возвращаем нашу собственную функцию-обертку.
                return function(...args) {
                    // Сначала выполняем оригинальный метод (например, push)
                    const result = Array.prototype[key].apply(target, args);
                    // А затем ПРИНУДИТЕЛЬНО запускаем обновление для свойства 'length' массива.
                    // Этого достаточно, чтобы компоненты, использующие массив, перерисовались.
                    trigger('length');
                    return result;
                };
            }

            // Отслеживаем чтение любого свойства
            track(key);
            return Reflect.get(target, key, receiver);
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue === value) {
                return true;
            }

            // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ДЛЯ IF ---
            // Если мы меняем свойство, от которого зависит if (например, showInfo),
            // то нужно триггерить обновление.
            const result = Reflect.set(target, key, value, receiver);
            trigger(key);
            
            // Если изменилась длина массива (например, state.users = [...]),
            // также триггерим обновление по 'length', чтобы UI.for среагировал.
            if (Array.isArray(target) && key === 'length') {
                trigger('length');
            }

            return result;
        }
    });
}

function createEffect(fn) {
    const effect = () => {
        tracker.startTracking(effect);
        fn();
        tracker.stopTracking();
    };
    effect();
}

module.exports = { createReactive, createEffect };
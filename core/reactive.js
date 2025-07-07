// Файл: core/reactive.js (CommonJS, финальная исправленная версия)

const tracker = require('./tracker');
const targetMap = new Map();

function track(target, key) {
    const activeEffect = tracker.getActiveUpdater();
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            depsMap = new Map();
            targetMap.set(target, depsMap);
        }
        let dep = depsMap.get(key);
        if (!dep) {
            dep = new Set();
            depsMap.set(key, dep);
        }
        dep.add(activeEffect);
    }
}

function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const dep = depsMap.get(key);
    if (dep) {
        const effectsToRun = new Set(dep);
        effectsToRun.forEach(effect => effect());
    }
}

const arrayMutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

function createReactive(target) {
    if (target === null || typeof target !== 'object') {
        return target;
    }
    return new Proxy(target, {
        get(target, key, receiver) {
            if (Array.isArray(target) && arrayMutatingMethods.includes(key)) {
                return function(...args) {
                    const result = Array.prototype[key].apply(target, args);
                    trigger(target, 'length');
                    return result;
                };
            }
            track(target, key);
            const value = Reflect.get(target, key, receiver);
            if (value !== null && typeof value === 'object') {
                return createReactive(value);
            }
            return value;
        },
        set(target, key, value, receiver) {
            // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
            const hadKey = Array.isArray(target) ? Number(key) < target.length : Object.prototype.hasOwnProperty.call(target, key);
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);

            if (!hadKey) {
                // Если ключа не было (добавление нового элемента в массив)
                trigger(target, 'length');
            } else if (value !== oldValue) {
                // Если значение изменилось
                trigger(target, key);
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
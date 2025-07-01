// Файл: core/reactive.js (Версия 2.0 - Улучшенный сеттер)

const tracker = require('./tracker');

function createReactive(target, depMap) {
  function createProxy(obj, path) {
    return new Proxy(obj, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        const currentPath = path ? `${path}.${prop}` : prop;

        const activeUpdater = tracker.getActiveUpdater();
        if (activeUpdater) {
          if (!depMap.has(currentPath)) {
            depMap.set(currentPath, new Set());
          }
          depMap.get(currentPath).add(activeUpdater);
        }

        if (value !== null && typeof value === 'object' && !value._isProxy) {
          // Добавляем флаг, чтобы не оборачивать прокси в прокси
          Object.defineProperty(value, '_isProxy', { value: true, enumerable: false });
          return createProxy(value, currentPath);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const currentPath = path ? `${path}.${prop}` : prop;
        const oldValue = target[prop];

        if (oldValue === value) return true;

        const success = Reflect.set(target, prop, value, receiver);
        
        // Копируем сет подписчиков, чтобы избежать бесконечных циклов, если
        // внутри апдейтера будет изменение того же свойства.
        const deps = new Set(depMap.get(currentPath));
        if (deps) {
          deps.forEach(updater => updater());
        }
        
        // Уведомляем подписчиков на сам массив при изменении его длины
        if (Array.isArray(target) && prop === 'length') {
            const arrayDeps = new Set(depMap.get(path));
            if (arrayDeps) {
                arrayDeps.forEach(updater => updater());
            }
        }
        return success;
      },
    });
  }
  return createProxy(target, '');
}

module.exports = { createReactive };
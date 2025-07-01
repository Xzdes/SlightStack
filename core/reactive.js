// Файл: core/reactive.js
// Назначение: Создает глубокий реактивный Proxy-объект.
// Перехватывает чтение и запись свойств для отслеживания зависимостей и запуска обновлений.

const tracker = require('./tracker');

/**
 * Создает реактивный Proxy для объекта.
 * @param {object} target - Исходный объект состояния.
 * @param {Map} depMap - Глобальная карта зависимостей (path -> Set<updater>).
 * @returns {object} - Реактивный Proxy-объект.
 */
function createReactive(target, depMap) {
  // Внутренняя рекурсивная функция для создания Proxy.
  // path - это путь к текущему объекту (например, 'user.settings').
  function createProxy(obj, path) {
    return new Proxy(obj, {
      /**
       * Перехватчик для чтения свойств.
       */
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        const currentPath = path ? `${path}.${prop}` : prop;

        // Регистрируем зависимость.
        const activeUpdater = tracker.getActiveUpdater();
        if (activeUpdater) {
          if (!depMap.has(currentPath)) {
            depMap.set(currentPath, new Set());
          }
          depMap.get(currentPath).add(activeUpdater);
        }

        // Если значение - это объект, делаем его тоже реактивным (глубокая реактивность).
        // Проверяем, что это не null и является объектом.
        if (value !== null && typeof value === 'object') {
          return createProxy(value, currentPath);
        }

        return value;
      },

      /**
       * Перехватчик для записи свойств.
       */
      set(target, prop, value, receiver) {
        const currentPath = path ? `${path}.${prop}` : prop;
        const oldValue = target[prop];

        // Не запускаем обновления, если значение не изменилось.
        if (oldValue === value) {
          return true;
        }

        const success = Reflect.set(target, prop, value, receiver);

        // Находим всех подписчиков на это свойство и запускаем их.
        const deps = depMap.get(currentPath);
        if (deps) {
          deps.forEach(updater => updater());
        }

        // Если мы изменяем массив (например, через .push), его свойство 'length' меняется.
        // Нам нужно также уведомить подписчиков самого массива, а не только его длины.
        // Это упрощенный способ для обработки мутаций массивов.
        if (Array.isArray(target) && prop === 'length') {
            const arrayDeps = depMap.get(path);
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

module.exports = {
  createReactive,
};
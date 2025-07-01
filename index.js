// Файл: index.js
// Назначение: Главный экспортный файл. Собирает все части фреймворка
// и предоставляет удобный публичный API.

const { render } = require('./core/renderer');

// --- Публичный API ---

/**
 * Главная точка входа для создания приложения SlightUI.
 * @param {object} options - Объект с опциями для инициализации.
 * @param {HTMLElement} options.target - DOM-элемент, куда будет вмонтировано приложение.
 * @param {Function} options.view - Функция-чертеж, которая описывает UI.
 * @param {object} [options.state={}] - Начальное состояние приложения.
 */
function create(options) {
  if (!options || !options.target) {
    throw new Error('SlightUI.create: опция "target" является обязательной.');
  }
  if (typeof options.view !== 'function') {
    throw new Error('SlightUI.create: опция "view" должна быть функцией.');
  }

  // Вызываем наш главный рендерер со всеми параметрами.
  render(options.view, options.state || {}, options.target);
}

// Собираем все в один объект для экспорта.
module.exports = {
  // Главный объект для управления приложением.
  UI: {
    create,
  },

  // Экспортируем все наши компоненты и хелперы, чтобы пользователь мог их использовать.
  
  // Компоненты-примитивы
  Layout: require('./components/layout'),
  Text: require('./components/text'),
  Button: require('./components/button'),
  Input: require('./components/input'),

  // Логические компоненты (хелперы)
  If: require('./helpers/if'),
  For: require('./helpers/for'),
};
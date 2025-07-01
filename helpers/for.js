// Файл: helpers/for.js
// Назначение: Логический компонент для рендеринга списков (массивов).

/**
 * Генерирует массив виртуальных узлов на основе входного массива данных.
 * @param {object} props - Свойства компонента.
 * @param {Array} props.each - Массив данных для итерации.
 * @param {Function} props.as - Функция-рендер для каждого элемента массива.
 *      Принимает (item, index) и должна возвращать vNode.
 * @returns {object} - Возвращает специальный vNode типа 'Fragment',
 *      содержащий массив дочерних vNode.
 */
function For(props) {
  const { each: items, as: renderFn } = props;

  // Проверяем, что нам передали массив и функцию для рендеринга.
  if (!Array.isArray(items) || typeof renderFn !== 'function') {
    return null;
  }

  // Используем `map` для преобразования каждого элемента данных в vNode.
  const children = items.map((item, index) => {
    // Вызываем пользовательскую функцию-рендер для каждого элемента.
    return renderFn(item, index);
  });

  // Мы не можем просто вернуть массив vNodes, так как наш рендерер
  // ожидает один корневой vNode.
  // Поэтому мы возвращаем специальный vNode типа "Fragment".
  // Наш рендерер должен будет научиться его обрабатывать:
  // вместо создания DOM-элемента, он просто рекурсивно обработает
  // все дочерние элементы фрагмента.
  return {
    type: 'Fragment',
    props: {
      children: children,
    },
  };
}

module.exports = For;
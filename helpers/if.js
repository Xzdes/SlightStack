// Файл: helpers/if.js
// Назначение: Логический компонент для условного рендеринга.

/**
 * Возвращает один из дочерних компонентов в зависимости от условия.
 * @param {object} props - Свойства компонента.
 * @param {boolean} props.condition - Условие, которое определяет, что рендерить.
 * @param {Function} props.then - Функция, которая возвращает vNode для рендеринга, если условие истинно.
 * @param {Function} [props.else] - Функция, которая возвращает vNode, если условие ложно.
 * @returns {object|null} - Виртуальный узел (vNode) от `then()` или `else()`, или null.
 */
function If(props) {
  const { condition, then: thenFn, else: elseFn } = props;

  // Важно, что `then` и `else` - это функции.
  // Это обеспечивает "ленивое" вычисление: мы вызываем функцию (и создаем vNode)
  // только для той ветки, которая нам действительно нужна. Это экономит ресурсы.
  if (condition) {
    // Проверяем, что thenFn действительно функция, перед вызовом.
    return typeof thenFn === 'function' ? thenFn() : null;
  } else {
    // Если есть функция elseFn, вызываем ее.
    return typeof elseFn === 'function' ? elseFn() : null;
  }
}

module.exports = If;
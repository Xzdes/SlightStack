// Файл: helpers/for.js

/**
 * Хелпер для рендеринга списков.
 * @param {object} props - Объект со свойствами.
 * @param {Array} props.each - Массив данных для итерации.
 * @param {string} props.key - Имя свойства в объектах массива, которое будет использоваться как уникальный ключ.
 * @param {Function} props.as - Функция-рендер, которая вызывается для каждого элемента. 
 *      Принимает (item, index) и должна возвращать компонент-строитель.
 * @returns {Array|null} - Возвращает массив "строителей" или null.
 */
function For(props) {
  const { each: items, key, as: renderFn } = props;
  
  // Проверки на корректность переданных данных
  if (!Array.isArray(items)) {
    console.error('Prop "each" в компоненте For должен быть массивом.');
    return null;
  }
  if (typeof renderFn !== 'function') {
    console.error('Prop "as" в компоненте For должен быть функцией.');
    return null;
  }
  if (!key) {
      console.warn('Компонент For работает более предсказуемо с обязательным prop "key".');
  }

  // Используем `map` для преобразования каждого элемента данных в компонент-строитель
  return items.map((item, index) => {
    // Вызываем пользовательскую функцию-рендер для каждого элемента
    const vNodeBuilder = renderFn(item, index);
    
    // Автоматически добавляем ключ к vNode, если он есть
    if (vNodeBuilder && vNodeBuilder.toJSON && key && item[key] !== undefined) {
        const vNode = vNodeBuilder.toJSON();
        vNode.props.key = item[key];
        // Возвращаем строитель, т.к. рендерер ожидает именно его
    }

    return vNodeBuilder;
  });
}

// Экспортируем напрямую как функцию, а не фабрику,
// так как это не "строитель" с цепочкой методов.
module.exports = For;
// Файл: helpers/for.js

/**
 * Вспомогательная функция для рендеринга списков.
 * Принимает массив данных и функцию-рендер для каждого элемента.
 * Возвращает VNode типа 'Fragment' с дочерними элементами.
 * @param {object} props - Свойства для рендеринга списка.
 * @param {Array} props.each - Массив данных для итерации.
 * @param {string} props.key - Имя свойства в объекте, которое будет использоваться как ключ.
 * @param {Function} props.as - Функция, вызываемая для каждого элемента массива. Должна возвращать строитель или VNode.
 * @returns {object} VNode типа 'Fragment'.
 */
function For(props) {
  const { each: items, key: keyName, as: renderFn } = props;
  
  if (!Array.isArray(items)) {
    console.error('[SlightUI] "each" в UI.for должен быть массивом.');
    return { type: 'Fragment', props: {}, children: [] };
  }
  if (typeof renderFn !== 'function') {
    console.error('[SlightUI] "as" в UI.for должен быть функцией.');
    return { type: 'Fragment', props: {}, children: [] };
  }
  if (!keyName) {
      console.error('[SlightUI] "key" является обязательным свойством для UI.for.');
      return { type: 'Fragment', props: {}, children: [] };
  }

  const children = items.map((item, index) => {
    // Вызываем функцию-рендер, она должна вернуть компонент-строитель.
    const builder = renderFn(item, index);
    
    if (builder && typeof builder.key === 'function') {
        const keyValue = item[keyName];
        if (keyValue === undefined) {
             console.warn(`[SlightUI] Ключ "${keyName}" не найден в элементе списка:`, item);
        }
        // Применяем ключ к сгенерированному компоненту.
        // Это необходимо для корректной работы VDOM.
        builder.key(keyValue);
    } else {
        console.warn('[SlightUI] Функция "as" в UI.for не вернула компонент-строитель или совместимый объект.', builder);
    }

    // Возвращаем сам строитель.
    // vdom.js (normalize) позже преобразует его в VNode.
    return builder;
  });

  // UI.for всегда возвращает фрагмент, который "растворяется" при рендеринге.
  return {
      type: 'Fragment',
      props: {},
      children: children
  };
}

module.exports = For;
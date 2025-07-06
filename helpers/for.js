// Файл: helpers/for.js

/**
 * Логический компонент для рендеринга списков.
 * Он не создает DOM-элемент сам, а возвращает Фрагмент с дочерними элементами.
 * @param {object} props - Свойства для рендеринга списка.
 * @param {Array} props.each - Массив данных для итерации.
 * @param {string} props.key - Имя поля в объекте массива, которое будет использоваться как уникальный ключ.
 * @param {Function} props.as - Функция-рендер, которая вызывается для каждого элемента массива и должна возвращать строитель (e.g., UI.text()).
 * @returns {object} VNode типа 'Fragment' с дочерними элементами списка.
 */
function For(props) {
  const { each: items, key: keyName, as: renderFn } = props;
  
  // --- УЛУЧШЕНИЕ: Добавляем проверки на входе для надежности ---
  if (!Array.isArray(items)) {
    console.error('[SlightUI] Свойство "each" в компоненте UI.for должно быть массивом. Получено:', items);
    // Возвращаем пустой Фрагмент, чтобы приложение не упало.
    return { type: 'Fragment', props: {}, children: [] };
  }
  if (typeof renderFn !== 'function') {
    console.error('[SlightUI] Свойство "as" в компоненте UI.for должно быть функцией. Получено:', renderFn);
    return { type: 'Fragment', props: {}, children: [] };
  }
  if (!keyName) {
      console.error('[SlightUI] Свойство "key" является обязательным для компонента UI.for.');
      return { type: 'Fragment', props: {}, children: [] };
  }

  // Создаем дочерние VNodes, применяя функцию-рендер к каждому элементу данных.
  const children = items.map((item, index) => {
    // Вызываем функцию-рендер, переданную пользователем
    const builder = renderFn(item, index);
    
    // "Разворачиваем" строитель в "сырой" VNode
    const vNode = builder && typeof builder.toJSON === 'function' ? builder.toJSON() : builder;

    // --- УЛУЧШЕНИЕ: Автоматическое применение ключа, если он не был задан вручную ---
    // Это делает код пользователя чище и защищает от ошибок.
    if (vNode && vNode.props) {
        // Получаем значение ключа из текущего элемента данных
        const keyValue = item[keyName];
        
        if (keyValue === undefined) {
             console.warn(`[SlightUI] Ключ "${keyName}" не найден в элементе списка:`, item);
        }

        // Если у VNode еще нет ключа, устанавливаем его.
        if (vNode.props.key === undefined) {
            vNode.props.key = keyValue;
        }
    }

    return vNode;
  });

  // Возвращаем финальный VNode типа 'Fragment', который содержит все сгенерированные дочерние элементы.
  return {
      type: 'Fragment',
      props: {},
      children: children
  };
}

module.exports = For;
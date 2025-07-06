// Файл: helpers/for.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)

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
      console.error('[SlightUI] "key" является обязательным для UI.for.');
      return { type: 'Fragment', props: {}, children: [] };
  }

  const children = items.map((item, index) => {
    // Вызываем функцию-рендер, она вернет строитель
    const builder = renderFn(item, index);
    
    // --- ИЗМЕНЕНИЕ: Упрощаем логику ---
    // Проверяем, что это действительно строитель, и применяем ключ
    if (builder && typeof builder.key === 'function') {
        const keyValue = item[keyName];
        if (keyValue === undefined) {
             console.warn(`[SlightUI] Ключ "${keyName}" не найден в элементе списка:`, item);
        }
        // Вызываем метод .key() самого строителя.
        // Это более надежно, чем пытаться записать в props напрямую.
        builder.key(keyValue);
    } else {
        console.warn('[SlightUI] Функция "as" в UI.for не вернула компонент-строитель.', builder);
    }

    return builder; // Возвращаем сам строитель, normalize разберется с ним
  });

  return {
      type: 'Fragment',
      props: {},
      children: children
  };
}

module.exports = For;
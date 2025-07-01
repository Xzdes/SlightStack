// Файл: helpers/for.js (Финальная, правильная версия)

function For(props) {
  const { each: items, key, as: renderFn } = props;
  
  // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
  // Мы "читаем" свойство .length массива items.
  // Этого достаточно, чтобы наш Proxy подписал текущий `update` на изменения
  // самого массива `items`. Теперь, когда filter изменит массив (и его длину),
  // Proxy "разбудит" `update`, и все перерисуется.
  if (!Array.isArray(items)) {
    return null;
  }
  const dependencyTrigger = items.length; // Вот эта строка все исправляет!

  if (!key) {
      console.error('Компонент <For> требует обязательный prop "key".');
      return null;
  }

  return items.map((item, index) => {
    const vNode = renderFn(item, index);
    if (vNode && typeof vNode === 'object' && vNode.props) {
      vNode.props.key = item[key];
    }
    return vNode;
  });
}

module.exports = For;
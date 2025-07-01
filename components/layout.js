// Файл: components/layout.js
// Назначение: Компонент для управления компоновкой дочерних элементов.

/**
 * Создает виртуальный узел для Layout-контейнера.
 * @param {object} props - Свойства компонента.
 * @param {'vertical' | 'horizontal'} [props.direction='vertical'] - Направление компоновки.
 * @param {number} [props.gap=0] - Пространство между дочерними элементами в пикселях.
 * @param {Array<object>} [props.children=[]] - Массив дочерних виртуальных узлов.
 * @returns {object} - Виртуальный узел (vNode).
 */
function Layout(props) {
  const { direction = 'vertical', gap = 0, children = [] } = props;

  // Layout будет рендериться как <div> с flex-стилями.
  const style = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    gap: `${gap}px`,
  };

  // Возвращаем стандартизированный объект vNode, который поймет наш рендерер.
  return {
    type: 'Layout',
    props: {
      tag: 'div', // Указываем рендереру, какой DOM-элемент создавать.
      style: style,
      children: children,
    },
  };
}

module.exports = Layout;
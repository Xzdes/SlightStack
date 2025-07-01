// Файл: components/button.js
// Назначение: Компонент для создания интерактивных кнопок.

/**
 * Создает виртуальный узел для кнопки.
 * @param {object} props - Свойства компонента.
 * @param {string} [props.label=''] - Текст на кнопке.
 * @param {Function} [props.onClick=()=>{}] - Функция обратного вызова при клике.
 * @param {'primary' | 'secondary'} [props.variant='primary'] - Внешний вид кнопки.
 * @returns {object|null} - Виртуальный узел (vNode) или null, если нет текста.
 */
function Button(props) {
  const { label = '', onClick = () => {}, variant = 'primary' } = props;

  if (!label) {
    return null;
  }

  // Базовые стили для всех кнопок
  const style = {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
  };

  // Стили в зависимости от варианта
  if (variant === 'primary') {
    style.backgroundColor = '#007BFF';
    style.color = 'white';
  } else if (variant === 'secondary') {
    style.backgroundColor = '#6c757d';
    style.color = 'white';
  }

  // Возвращаем vNode для тега <button>.
  // Наш рендерер уже умеет обрабатывать 'onClick' и 'children'.
  return {
    type: 'Button',
    props: {
      tag: 'button',
      style: style,
      onClick: onClick,
      // Как и в компоненте Text, передаем label как дочерний элемент.
      // Это потребует от рендерера уметь обрабатывать строки.
      children: [label],
    },
  };
}

module.exports = Button;
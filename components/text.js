// Файл: components/text.js
// Назначение: Компонент для отображения текста.

/**
 * Создает виртуальный узел для текстового элемента.
 * @param {object} props - Свойства компонента.
 * @param {string} [props.value=''] - Текст для отображения.
 * @param {'small' | 'medium' | 'large'} [props.size='medium'] - Размер шрифта.
 * @param {'normal' | 'bold'} [props.weight='normal'] - Насыщенность шрифта.
 * @param {boolean} [props.strikethrough=false] - Добавить ли зачеркивание.
 * @returns {object|null} - Виртуальный узел (vNode) или null, если нет текста.
 */
function Text(props) {
  const { value = '', size = 'medium', weight = 'normal', strikethrough = false } = props;

  // Если текста нет, не рендерим ничего. Это удобно.
  if (!value) {
    return null;
  }

  const style = {
    fontWeight: weight,
    textDecoration: strikethrough ? 'line-through' : 'none',
  };

  // Преобразуем относительные размеры в конкретные значения.
  switch (size) {
    case 'small':
      style.fontSize = '14px';
      break;
    case 'large':
      style.fontSize = '20px';
      break;
    case 'medium':
    default:
      style.fontSize = '16px';
      break;
  }

  // Создаем дочерний узел, который будет содержать сам текст.
  // Это не DOM-узел, а просто строка, которую рендерер обработает как textContent.
  // Но для унификации мы обернем его в массив children.
  // Однако, для простоты нашей модели рендеринга, мы просто передадим текст
  // как специальное свойство. renderer.js должен будет это обработать.
  // ИЗМЕНЕНИЕ: Упрощаем! Мы создадим <span> с текстом внутри.
  
  const textNode = {
      type: 'TextNode',
      props: {
          tag: 'span',
          textContent: value // Используем textContent для простоты в рендерере
      }
  };

  // Оборачиваем наш текстовый спан в div со стилями
  return {
    type: 'TextWrapper',
    props: {
        tag: 'div',
        style: style,
        children: [textNode] // Упрощение: Текст это всегда спан внутри дива.
    }
  }
}

// Изменение в логике mount в renderer.js, которое нам понадобится:
// в цикле по пропсам добавить:
// else if (key === 'textContent') {
//   el.textContent = props[key];
// }
// Это изменение нужно будет внести позже, сейчас просто держим в уме.
// ИЛИ, для еще большей простоты, мы можем сделать так, чтобы Text возвращал <p>
// и передавал текст как дочерний элемент. Но это менее гибко.
// Давайте остановимся на варианте со span и textContent.
//
// Переписываю компонент для лучшей совместимости с текущим рендерером,
// чтобы не требовать его изменения.

function RefactoredText(props) {
    const { value = '', size = 'medium', weight = 'normal', strikethrough = false } = props;

    if (!value) {
        return null;
    }

    const style = {
        fontWeight: weight,
        fontSize: size === 'small' ? '14px' : size === 'large' ? '20px' : '16px',
        textDecoration: strikethrough ? 'line-through' : 'none',
        // Добавим немного свойств для сброса стилей параграфа по умолчанию
        margin: 0,
        padding: 0,
    };

    // Рендерер уже умеет обрабатывать children.
    // Если child - это строка, он должен создать текстовый узел.
    // Наш текущий рендерер не умеет, он ожидает vNode.
    // Значит, текст должен быть внутри другого элемента. Это плохо.
    //
    // ФИНАЛЬНОЕ РЕШЕНИЕ для простоты:
    // Текст - это просто <div>, у которого есть textContent.
    // renderer должен будет это поддержать.
    // Я вернусь и исправлю renderer, когда мы закончим с компонентами.
    // Пока что пишем "идеальный" компонент.

    return {
        type: 'Text',
        props: {
            tag: 'p', // Используем <p> для семантики
            style: style,
            children: [value] // Renderer должен будет научиться обрабатывать строки в children
        }
    }
}


module.exports = RefactoredText;
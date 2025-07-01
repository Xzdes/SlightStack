// Файл: components/input.js (Обновленная версия)

function Input(props) {
  const { placeholder = '', bindTo, key, id } = props; // Добавили id

  if (!bindTo || typeof key !== 'string') {
    console.error('Input component requires "bindTo" (the state object) and "key" (a string) props.');
    return null;
  }

  const style = {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: 'calc(100% - 22px)',
  };
  
  const onInput = (event) => {
    bindTo[key] = event.target.value;
  };

  const finalProps = { // Собираем пропсы в отдельный объект
      tag: 'input',
      style: style,
      placeholder: placeholder,
      value: bindTo[key],
      onInput: onInput,
  };

  // Если id передан, добавляем его
  if (id) {
      finalProps.id = id;
  }

  return {
    type: 'Input',
    props: finalProps,
  };
}

module.exports = Input;
// Файл: components/input.js (Версия 2.0 - без bindTo)

function Input(props) {
  // Убираем деструктуризацию bindTo и key
  const { placeholder = '', id, onInput, value, onMount } = props;

  const style = {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: 'calc(100% - 22px)',
  };

  // Собираем пропсы для передачи в рендерер.
  // Мы просто передаем все, что пришло, дальше.
  const finalProps = {
      ...props, // Передаем все пропсы (включая id, onMount и т.д.)
      tag: 'input',
      style: style,
      placeholder: placeholder,
  };

  return {
    type: 'Input',
    props: finalProps,
  };
}

module.exports = Input;
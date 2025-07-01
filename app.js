// Файл: app.js (теперь он не зависит от require)
// Он будет обернут сервером в функцию, которая примет SlightUI как аргумент.

const { UI, Layout, Text, Button, Input, If, For } = SlightUI;

const initialState = {
  counter: 0,
  inputText: 'Автоматизация работает!',
  tasks: [
    { id: 1, title: 'Задача 1', done: true },
    { id: 2, title: 'Задача 2', done: false },
  ],
};

function AppView(state) {
  return Layout({
    gap: 20,
    children: [
      Text({ value: 'SlightUI с полной автоматизацией!', size: 'large' }),
      Layout({ direction: 'horizontal', gap: 10, children: [
        Button({ label: `Счетчик: ${state.counter}`, onClick: () => state.counter++ }),
      ]}),
      If({ condition: state.counter > 5, then: () => Text({ value: 'Счетчик больше пяти.' }) }),
      Input({ id: 'main-input', bindTo: state, key: 'inputText' }),
      Text({ value: `Введено: ${state.inputText}` }),
      For({ each: state.tasks, as: (task) => Text({ value: task.title, strikethrough: task.done }) }),
    ],
  });
}

UI.create({
  target: document.getElementById('app'),
  view: AppView,
  state: initialState,
});
// app.js - Наше тестовое приложение, использующее SlightUI

// Импортируем все необходимое из нашего фреймворка
const { UI, Layout, Text, Button, Input, If, For } = require('./index.js');

// 1. Определяем начальное состояние приложения
const initialState = {
  counter: 0,
  inputText: 'Привет, мир!',
  tasks: [
    { id: 1, title: 'Написать ядро фреймворка', done: true },
    { id: 2, title: 'Создать компоненты', done: true },
    { id: 3, title: 'Протестировать все вместе!', done: false },
  ],
};

// 2. Описываем внешний вид приложения с помощью функции-чертежа
function AppView(state) {
  return Layout({
    gap: 20, // Расстояние между элементами
    children: [
      Text({ value: 'Добро пожаловать в SlightUI!', size: 'large', weight: 'bold' }),
      
      // Блок счетчика
      Layout({ direction: 'horizontal', gap: 10, children: [
        Button({
          label: 'Нажми меня!',
          onClick: () => state.counter++, // Просто меняем состояние
        }),
        Text({ value: `Счетчик: ${state.counter}` }),
      ]}),
      
      // Условный рендеринг
      If({
        condition: state.counter > 5,
        then: () => Text({ value: 'Отличная работа! Счетчик больше пяти.', size: 'small' })
      }),

      // Двусторонняя привязка
      Input({
        id: 'main-input',
        placeholder: 'Введите текст...',
        bindTo: state,
        key: 'inputText',
      }),
      Text({ value: `Вы ввели: ${state.inputText}` }),

      // Рендеринг списка
      Text({ value: 'Список задач:', weight: 'bold' }),
      For({
        each: state.tasks,
        as: (task) => Text({
          value: task.title,
          strikethrough: task.done, // Зачеркиваем выполненные задачи
        }),
      }),
    ],
  });
}

// 3. Создаем и монтируем приложение
UI.create({
  target: document.getElementById('app'),
  view: AppView,
  state: initialState,
});
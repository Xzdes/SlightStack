// Файл: app.js (Версия 3.0 - с корректным обновлением состояния)
// Этот код будет обернут сервером, который передаст ему объект SlightUI

const { UI, Layout, Text, Button, Input, If, For, Table, Tabs } = SlightUI;

// 1. Создаем начальное состояние приложения
const appState = {
    counter: 0,
    textInputValue: 'Текст для инпута',
    tasks: [
        { id: 1, text: 'Реализовать Keyed Patch', done: true },
        { id: 2, text: 'Добавить хуки жизненного цикла', done: true },
        { id: 3, text: 'Создать компонент Table', done: false },
        { id: 4, text: 'Решить проблему с обновлением', done: false },
    ],
    activeTab: 0,
};

// 2. Определяем функции-обработчики, которые будут менять состояние

// Хук для демонстрации onMount
const onInputMount = (el) => {
    console.log('Элемент Input смонтирован!', el);
    el.style.borderColor = 'green';
};

// Хук для демонстрации onUnmount
const onTextUnmount = () => {
    console.log('Текст "Счетчик больше пяти" был удален из DOM!');
};

// Удаление задачи. `filter` возвращает новый массив, что отлично для реактивности.
const removeTask = (id) => {
    appState.tasks = appState.tasks.filter(t => t.id !== id);
};

// Перемешивание задач. `sort` мутирует исходный массив.
const shuffleTasks = () => {
    appState.tasks.sort(() => Math.random() - 0.5);
    // --- ВАЖНОЕ ИСПРАВЛЕНИЕ ---
    // После мутации создаем поверхностную копию массива,
    // чтобы система реактивности гарантированно увидела изменение.
    appState.tasks = [...appState.tasks];
};

// Функция для кастомного рендеринга ячеек в таблице
const renderTableCell = (key, rowData) => {
    if (key === 'done') {
        return rowData.done ? '✅ Да' : '❌ Нет';
    }
    if (key === 'actions') {
        // Кнопка для удаления строки, вызывает наш обработчик
        return Button({ label: 'Удалить', onClick: () => removeTask(rowData.id) });
    }
    // По умолчанию просто возвращаем значение из данных
    return rowData[key];
};

// 3. Главная функция-чертеж, которая описывает весь наш UI
function AppView(state) {
    return Layout({
        gap: 20,
        children: [
            Text({ value: 'Тестирование SlightUI v3.0 (Стабильная)', size: 'large' }),
            Tabs({
                items: [
                    {
                        label: 'Основное',
                        content: () => Layout({
                            key: 'tab1', // Добавляем ключи для надежности
                            gap: 15,
                            children: [
                                Button({ label: 'Перемешать задачи', onClick: shuffleTasks }),
                                Text({ value: 'Счетчик: ' + state.counter }),
                                Button({ label: '+1', onClick: () => state.counter++ }),
                                Input({
                                    id: 'test-input',
                                    value: state.textInputValue,
                                    onInput: (e) => state.textInputValue = e.target.value,
                                    onMount: onInputMount,
                                }),
                                Text({ value: `Введено: ${state.textInputValue}` }),
                                If({
                                    condition: state.counter > 5,
                                    then: () => Text({ value: 'Счетчик больше пяти!', onUnmount: onTextUnmount }),
                                })
                            ]
                        })
                    },
                    {
                        label: 'Таблица задач',
                        content: () => Table({
                            key: 'tab2', // Добавляем ключи для надежности
                            headers: [
                                { key: 'id', label: 'ID' },
                                { key: 'text', label: 'Задача' },
                                { key: 'done', label: 'Выполнено' },
                                { key: 'actions', label: 'Действия' }
                            ],
                            rows: state.tasks,
                            renderCell: renderTableCell,
                        })
                    }
                ],
                activeTab: state.activeTab,
                onTabChange: (index) => state.activeTab = index
            })
        ]
    });
}

// 4. Запускаем приложение
UI.create({
    target: document.getElementById('app'),
    view: AppView,
    state: appState
});
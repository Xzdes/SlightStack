// Файл: app.js (Финальная версия с правильным управлением состоянием)
// Этот код будет обернут сервером, который передаст ему объект SlightUI

// --- 1. Импортируем createReactive напрямую ---
// Мы должны его экспортировать. Я исправлю это в server.js
const { UI, Layout, Text, Button, Input, If, For, Table, Tabs, createReactive } = SlightUI;

// 2. Создаем ОБЫЧНЫЙ объект с начальными данными
const initialState = {
    counter: 0,
    textInputValue: 'Текст',
    tasks: [
        { id: 1, text: 'Задача 1', done: true },
        { id: 2, text: 'Задача 2', done: false },
    ],
    activeTab: 0,
};

// --- 3. ДЕЛАЕМ ЕГО РЕАКТИВНЫМ ОДИН РАЗ ---
const state = createReactive(initialState);

// 4. Все обработчики теперь работают с РЕАКТИВНЫМ `state`
const onInputMount = (el) => {
    console.log('Элемент Input смонтирован!');
    el.style.borderColor = 'purple';
};

const removeTask = (id) => {
    // Мы меняем тот же самый `state`, за которым следит Proxy
    state.tasks = state.tasks.filter(t => t.id !== id);
};

const shuffleTasks = () => {
    state.tasks.sort(() => Math.random() - 0.5);
    state.tasks = [...state.tasks]; 
};

// 5. Главная функция-чертеж, она принимает тот же РЕАКТИВНЫЙ `state`
function AppView(currentState) { // Переименовал для ясности
    return Layout({
        gap: 20,
        children: [
            Text({ value: 'SlightUI (Финальная Архитектура!)', size: 'large' }),
            Tabs({
                items: [
                    {
                        label: 'Основное',
                        content: () => Layout({
                            children: [
                                Button({ label: 'Перемешать задачи', onClick: shuffleTasks }),
                                Text({ value: 'Счетчик: ' + currentState.counter }),
                                Button({ label: '+1', onClick: () => currentState.counter++ }),
                                Input({
                                    id: 'test-input',
                                    value: currentState.textInputValue,
                                    onInput: (e) => currentState.textInputValue = e.target.value,
                                    onMount: onInputMount,
                                }),
                                Text({ value: `Введено: ${currentState.textInputValue}` }),
                            ]
                        })
                    },
                    {
                        label: 'Таблица задач',
                        content: () => Table({
                            headers: [
                                { key: 'id', label: 'ID' },
                                { key: 'text', label: 'Задача' },
                                { key: 'done', label: 'Выполнено' },
                                { key: 'actions', label: 'Действия' }
                            ],
                            rows: currentState.tasks, // Читаем из реактивного состояния
                            renderCell: (key, rowData) => {
                                if (key === 'done') return rowData.done ? '✅' : '❌';
                                if (key === 'actions') return Button({ label: 'Удалить', onClick: () => removeTask(rowData.id) });
                                return rowData[key];
                            },
                        })
                    }
                ],
                activeTab: currentState.activeTab,
                onTabChange: (index) => currentState.activeTab = index
            })
        ]
    });
}

// 6. Запускаем приложение, передавая уже готовый РЕАКТИВНЫЙ `state`
UI.create({
    target: document.getElementById('app'),
    view: AppView,
    state: state // Передаем `state`, а не `initialState`
});
// Файл: demo/app.js

module.exports = function(UI) {

    const { Router, Link, provideRouterDeps } = require('../core/router.js');
    provideRouterDeps({ UI, createReactiveFn: UI.createReactive });
    
    UI.config({
        breakpoints: {
            sm: 768
        }
    });

    const appState = UI.createReactive({
        todos: [
            { id: 1, text: 'Создать роутер', done: true },
            { id: 2, text: 'Сделать адаптивный layout', done: true },
            { id: 3, text: 'Интегрировать To-Do List', done: false },
        ],
        newTodoText: '',
        filter: 'all',
        isSidebarOpen: false
    });

    const filteredTodos = () => { /* ... без изменений ... */ };
    const addTodo = () => { /* ... без изменений ... */ };
    const deleteTodo = (idToDelete) => { /* ... без изменений ... */ };

    const DashboardPage = () => UI.text({ tag: 'h1', text: 'Главная панель' });
    const TasksPage = () => UI.stack({ gap: 20 }).children(
        UI.text({ tag: 'h1', text: 'Управление задачами' }),
        UI.row({ gap: 10, alignItems: 'center' }).children(
            UI.input({ flex: 1, placeholder: 'Что нужно сделать?', onkeyup: (e) => { if (e.key === 'Enter') addTodo(); } }).model(appState, 'newTodoText'),
            UI.button({ text: 'Добавить', onclick: addTodo })
        ),
        UI.stack({ gap: 8 }).children(
            UI.for({
                each: filteredTodos,
                key: 'id',
                as: (todo) =>
                    UI.row({
                        key: todo.id, gap: 12, alignItems: 'center', padding: '10px', borderRadius: 6,
                        className: { 'completed-todo': todo.done }, background: todo.done ? '#f3f4f6' : '#fff',
                        transition: 'background 0.2s', ':hover:boxShadow': '0 1px 3px rgba(0,0,0,0.05)'
                    }).children(
                        UI.input().model(todo, 'done'),
                        UI.text({ text: todo.text, flex: 1 }),
                        UI.button({
                            text: 'Удалить', onclick: () => deleteTodo(todo.id), 'sm:text': '🗑️',
                            'sm:background': 'transparent', 'sm:border': 'none', 'sm:padding': '4px',
                            'sm:color': '#ef4444', 'sm:hover:background': '#fee2e2'
                        })
                    )
            })
        ),
        UI.row({ gap: 8, justifyContent: 'center', marginTop: 10 }).children(
            UI.button({ text: 'Все', className: { 'active-filter': appState.filter === 'all' }, onclick: () => appState.filter = 'all' }),
            UI.button({ text: 'Активные', className: { 'active-filter': appState.filter === 'active' }, onclick: () => appState.filter = 'active' }),
            UI.button({ text: 'Завершенные', className: { 'active-filter': appState.filter === 'completed' }, onclick: () => appState.filter = 'completed' })
        )
    );
    const SettingsPage = () => UI.text({ tag: 'h1', text: 'Настройки' });
    const NotFoundPage = () => UI.text({ tag: 'h1', text: '404' });

    const routes = { '/': DashboardPage, '/tasks': TasksPage, '/settings': SettingsPage, '*': NotFoundPage };

    // --- Главный вид приложения ---
    const AppView = () =>
        UI.stack({ // [ИЗМЕНЕНИЕ] Главный контейнер - stack
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }).children(
            // Основной layout, который теперь вложен
            UI.row({
                width: '100%',
                height: '100%',
            }).children(
                // Сайдбар
                UI.stack({
                    width: 240, flexShrink: 0, height: '100vh', background: 'white',
                    padding: '20px 0', borderRight: '1px solid #e5e7eb',
                    transition: 'margin-left 0.3s ease-in-out', gap: 10,
                    // Адаптивная логика
                    marginLeft: '0px',
                    'sm:marginLeft': appState.isSidebarOpen ? '0px' : '-240px',
                    'sm:position': 'absolute',
                    'sm:zIndex': 20
                }).children(
                    UI.text({ tag: 'h2', text: 'SlightDash', padding: '0 20px', margin: '0 0 20px 0', fontSize: 22, fontWeight: 600 }),
                    Link({ to: '/', children: 'Главная', padding: '10px 20px', ':hover:background': '#f4f7fa' }),
                    Link({ to: '/tasks', children: 'Задачи', padding: '10px 20px', ':hover:background': '#f4f7fa' }),
                    Link({ to: '/settings', children: 'Настройки', padding: '10px 20px', ':hover:background': '#f4f7fa' })
                ),
                // Область контента
                UI.stack({ flex: 1, height: '100%' }).children(
                    UI.row({
                        height: 70, padding: '0 30px', alignItems: 'center',
                        background: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
                    }).children(
                         UI.button({
                            text: '☰', fontSize: 24, padding: '5px 10px',
                            display: 'none', 'sm:display': 'block',
                            onclick: () => appState.isSidebarOpen = !appState.isSidebarOpen
                        })
                    ),
                    UI.stack({ padding: 30, overflowY: 'auto', flex: 1 }).children(
                        Router({ routes })
                    )
                )
            ),
            // Оверлей
            UI.stack({
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0, 0, 0, 0.4)', zIndex: 10,
                transition: 'opacity 0.3s',
                opacity: appState.isSidebarOpen ? 1 : 0,
                pointerEvents: appState.isSidebarOpen ? 'auto' : 'none',
                display: 'none', 'sm:display': 'block',
                onclick: () => appState.isSidebarOpen = false
            })
        );
    
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .completed-todo p { text-decoration: line-through; color: #6b7280; }
        .active-filter { border-color: #6366f1; background-color: #eef2ff; }
        a { text-decoration: none; color: inherit; display: block; }
    `;
    document.head.appendChild(styleEl);

    UI.create({ target: document.getElementById('app'), view: AppView });
};
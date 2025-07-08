// Файл: demo/app.js

module.exports = function(UI) {

    UI.config({
        breakpoints: {
            sm: 768
        }
    });

    const state = UI.createReactive({
        todos: [
            { id: 1, text: 'Изучить SlightStack', done: true },
            { id: 2, text: 'Реализовать Keyed VDOM', done: true },
            { id: 3, text: 'Написать демо "To-Do List"', done: false },
        ],
        newTodoText: '',
        filter: 'all' // all, active, completed
    });

    const filteredTodos = () => {
        switch(state.filter) {
            case 'active': return state.todos.filter(t => !t.done);
            case 'completed': return state.todos.filter(t => t.done);
            default: return state.todos;
        }
    };


    const addTodo = () => {
        if (!state.newTodoText.trim()) return;
        state.todos.push({
            id: Date.now(),
            text: state.newTodoText.trim(),
            done: false
        });
        state.newTodoText = '';
    };

    const deleteTodo = (idToDelete) => {
        state.todos = state.todos.filter(todo => todo.id !== idToDelete);
    };

    const AppView = () =>
        UI.stack({
            width: '100%',
            maxWidth: '600px',
            padding: 20,
            gap: 20,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            'sm:maxWidth': '100%',
            'sm:padding': 15,
            'sm:borderRadius': 0
        }).children(

            UI.text({ 
                text: 'Мой список дел', 
                tag: 'h1', 
                margin: 0, 
                color: '#111827',
                'sm:fontSize': '24px'
            }),

            UI.row({
                gap: 10,
                alignItems: 'center',
                'sm:flexDirection': 'column',
                'sm:alignItems': 'stretch'
            }).children(

                UI.input({
                    flex: '1 1 auto',
                    placeholder: 'Что нужно сделать?',
                    onkeyup: (e) => { if (e.key === 'Enter') addTodo(); }
                }).model(state, 'newTodoText'),

                UI.button({
                    text: 'Добавить',
                    onclick: addTodo,
                    'sm:marginTop': 5
                })
            ),

           UI.stack({ gap: 8 }).children(
                UI.for({
                    each: filteredTodos, // Используем вычисляемый список
                    key: 'id',
                    as: (todo) =>
                        UI.row({
                            key: todo.id,
                            gap: 12,
                            alignItems: 'center',
                            padding: '10px',
                            borderRadius: 6,
                            // [ТЕСТ] Используем умный className
                            className: [
                                'todo-item',
                                { 'completed-todo': todo.done }
                            ],
                            background: todo.done ? '#f3f4f6' : '#fff',
                            transition: 'background 0.2s',
                            ':hover:boxShadow': '0 1px 3px rgba(0,0,0,0.05)'
                        }).children(
                            UI.input().model(todo, 'done'),

                            UI.text({
                                text: todo.text,
                                flex: '1 1 auto',
                                textDecoration: todo.done ? 'line-through' : 'none',
                                color: todo.done ? '#6b7280' : '#111827'
                            }),
                            
                            UI.button({
                                text: 'Удалить',
                                onclick: () => deleteTodo(todo.id),
                                'sm:text': '🗑️',
                                'sm:background': 'transparent',
                                'sm:border': 'none',
                                'sm:padding': '4px',
                                'sm:color': '#ef4444',
                                'sm:hover:background': '#fee2e2'
                            })
                        )
                })
            ),
                    // [ТЕСТ] Новые кнопки для фильтрации
            UI.row({ gap: 8, justifyContent: 'center', marginTop: 10 }).children(
                UI.button({
                    text: 'Все',
                    // [ТЕСТ] Условный класс
                    className: { 'active-filter': state.filter === 'all' },
                    onclick: () => state.filter = 'all'
                }),
                UI.button({
                    text: 'Активные',
                    className: { 'active-filter': state.filter === 'active' },
                    onclick: () => state.filter = 'active'
                }),
                UI.button({
                    text: 'Завершенные',
                    className: { 'active-filter': state.filter === 'completed' },
                    onclick: () => state.filter = 'completed'
                })
            )
        );

    // Добавим стили для теста
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .completed-todo p { text-decoration: line-through; color: #6b7280; }
        .active-filter { border-color: #6366f1; background-color: #eef2ff; }
    `;
    document.head.appendChild(styleEl);

    UI.create({ target: document.getElementById('app'), view: AppView });
};

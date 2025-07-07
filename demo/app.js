// Файл: demo/app.js (Финальная версия)

module.exports = function(UI) {
    const state = UI.createReactive({
        todos: [ { id: 1, text: 'Изучить SlightStack', done: true }, { id: 2, text: 'Реализовать Keyed VDOM', done: true }, { id: 3, text: 'Написать демо "To-Do List"', done: false }, ],
        newTodoText: ''
    });
    const addTodo = () => { if (!state.newTodoText.trim()) return; state.todos.push({ id: Date.now(), text: state.newTodoText.trim(), done: false }); state.newTodoText = ''; };
    const deleteTodo = (idToDelete) => { state.todos = state.todos.filter(todo => todo.id !== idToDelete); };

    const AppView = () => (
        UI.stack().props({ style: { width: '100%', maxWidth: '600px', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', gap: '20px' }}).children(
            UI.text('Мой список дел').props({ tag: 'h1', style: { margin: 0, color: '#111827' } }),
            UI.row().props({ style: { gap: '10px', alignItems: 'center' } }).children(
                UI.input().props({ style: { flex: '1 1 auto' }, attrs: { placeholder: 'Что нужно сделать?' } }).model(state, 'newTodoText'),
                UI.button('Добавить').on('click', addTodo)
            ),
            UI.stack().props({ style: { gap: '8px' } }).children(
                UI.for({
                    each: () => state.todos,
                    key: 'id',
                    as: (todo) => UI.row().key(todo.id).props({ style: { gap: '12px', alignItems: 'center', padding: '10px', borderRadius: '6px', background: todo.done ? '#f3f4f6' : '#fff' } }).children(
                        // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
                        // Просто вызываем .model(), он все сделает сам
                        UI.input().model(todo, 'done'),
                        
                        UI.text(todo.text).props({ style: { flex: '1 1 auto', textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? '#6b7280' : '#111827' } }),
                        UI.button('Удалить').on('click', () => deleteTodo(todo.id))
                    )
                })
            )
        )
    );
    UI.create({ target: document.getElementById('app'), view: AppView });
};
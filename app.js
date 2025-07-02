// Файл: app.js (Финальная демонстрационная версия)

// UI передается сервером и содержит все наши строители
const state = UI.createReactive({
    viewTitle: "SlightUI: Демонстрация всех возможностей",
    showAdminPanel: false,
    adminName: "Администратор",
    users: [
        { id: 1, name: 'Анна К.', role: 'Админ', status: 'active' },
        { id: 2, name: 'Петр В.', role: 'Кассир', status: 'active' },
        { id: 3, name: 'Иван С.', role: 'Пользователь', status: 'inactive' },
    ],
    hybridButtonText: "Кнопка из Uiverse"
});

// --- Обработчики и утилиты ---

const onTitleMount = (domElement) => {
    console.log('Главный заголовок смонтирован!', domElement);
    domElement.style.transition = 'color 0.3s';
    domElement.style.color = '#6200ea'; // Яркий цвет для демонстрации
    domElement.addEventListener('mouseenter', () => domElement.style.color = '#006aff');
    domElement.addEventListener('mouseleave', () => domElement.style.color = '#6200ea');
};

const addUser = () => {
    const id = state.users.length > 0 ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
    const newUser = { id, name: `Новый пользователь ${id}`, role: 'Кассир', status: 'active' };
    state.users.push(newUser);
    state.users = [...state.users]; // Триггерим реактивность
};

const removeUser = (idToRemove) => {
    state.users = state.users.filter(user => user.id !== idToRemove);
};

const shuffleUsers = () => {
    state.users.sort(() => Math.random() - 0.5);
    state.users = [...state.users]; // Триггерим реактивность
};

// --- Главный вид приложения ---
const AppView = (s) => (
    UI.stack().gap(30).style({
        maxWidth: '800px',
        margin: '40px auto',
        padding: '30px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
    }).children(

        // 1. Использование Text, хуков и стилей
        UI.text(s.viewTitle).as('h1').bold().onMount(onTitleMount),
        
        // 2. Использование Row, Button и условного текста
        UI.row().gap(15).align('center').children(
            UI.text("Показать расширенные опции:"),
            UI.button(s.showAdminPanel ? 'Скрыть панель' : 'Показать панель')
              .onClick(() => s.showAdminPanel = !s.showAdminPanel)
        ),

        // 3. Использование If для рендеринга целого блока с Input
        UI.if(s.showAdminPanel).then(() =>
            UI.stack().gap(10).style({ 
                padding: '20px', 
                border: '1px solid #f0f0f0', 
                borderRadius: '8px',
                background: '#f9f9f9'
            }).children(
                UI.text("Панель администратора").bold(),
                UI.input()
                  .id('admin-name-input')
                  .value(s.adminName)
                  .onInput(e => s.adminName = e.target.value),
                UI.text(`Имя админа: ${s.adminName}`).small().color('#777'),
                UI.button("Добавить случайного пользователя").onClick(addUser)
            )
        ),

        // 4. Использование сложного компонента Table с For внутри
        UI.text("Таблица пользователей").as('h2').bold(),
        UI.button("Перемешать пользователей").onClick(shuffleUsers),
        UI.table()
          .headers([
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Имя' },
              { key: 'role', label: 'Роль' },
              { key: 'status', label: 'Статус' },
              { key: 'actions', label: 'Действия' }
          ])
          .rows(s.users) // Привязываем к реактивному массиву
          .renderCell((key, user) => {
              if (key === 'status') {
                  return UI.text(user.status).color(user.status === 'active' ? 'green' : '#999').bold();
              }
              if (key === 'actions') {
                  return UI.button('Удалить')
                           .onClick(() => removeUser(user.id))
                           .style({ background: '#ffebee', color: '#c62828', border: 'none' });
              }
              return user[key];
          }),
        
        // 5. Использование гибридного компонента
        UI.text("Гибридный компонент").as('h2').bold().style({ marginTop: '20px' }),
        UI.hybrid('uiverse-discover-button')
          .replace('{{TEXT}}', s.hybridButtonText)
          .on('button', 'click', () => {
              s.hybridButtonText = 'Нажато!';
              alert('Клик по гибридной кнопке!');
          })
    )
);

// --- Запуск ---
UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
// Файл: app.js (Финальная рабочая версия)

// UI передается сервером и содержит все наши строители
const state = UI.createReactive({
    viewTitle: "SlightUI: Демонстрация VDOM",
    showAdminPanel: true,
    adminName: "Администратор",
    users: [
        { id: 1, name: 'Анна К.', role: 'Админ', status: 'active' },
        { id: 2, name: 'Петр В.', role: 'Кассир', status: 'active' },
        { id: 3, name: 'Иван С.', role: 'Пользователь', status: 'inactive' },
    ],
    hybridButtonText: "Кнопка из Uiverse"
});

// =======================================================
// --- ОБРАБОТЧИКИ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
// =======================================================

const onTitleMount = (domElement) => {
    console.log('Главный заголовок смонтирован!', domElement);
    domElement.style.transition = 'color 0.3s';
    domElement.style.color = '#6200ea';
    domElement.addEventListener('mouseenter', () => domElement.style.color = '#006aff');
    domElement.addEventListener('mouseleave', () => domElement.style.color = '#6200ea');
};

const addUser = () => {
    const id = state.users.length > 0 ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
    const newUser = { id, name: `Новый пользователь ${id}`, role: 'Пользователь', status: 'active' };
    state.users.push(newUser);
    state.users = [...state.users]; // Триггерим реактивность
};

const removeUser = (idToRemove) => {
    state.users = state.users.filter(user => user.id !== idToRemove);
};

const shuffleUsers = () => {
    state.users.sort(() => Math.random() - 0.5);
    state.users = [...state.users];
};

const reverseUsers = () => {
    state.users.reverse();
    state.users = [...state.users];
};

const updateUserStatus = (userId) => {
    const user = state.users.find(u => u.id === userId);
    if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        state.users = [...state.users]; // Обновляем для VDOM
    }
};

const saveAdminSettings = () => {
    alert(`Настройки сохранены! Новое имя администратора: "${state.adminName}"`);
};

// ===================================
// --- ГЛАВНЫЙ ВИД ПРИЛОЖЕНИЯ ---
// ===================================

const AppView = (s) => (
    UI.stack().gap(25).children(

        // 1. Заголовок с хуком onMount
        UI.text(s.viewTitle).as('h1').bold().onMount(onTitleMount),
        
        // 2. Панель управления с условным рендерингом (UI.if)
        UI.row().gap(15).align('center').children(
            UI.text("Показать панель администратора:"),
            UI.button(s.showAdminPanel ? 'Скрыть' : 'Показать')
              .onClick(() => s.showAdminPanel = !s.showAdminPanel)
        ),

        UI.if(s.showAdminPanel).then(() =>
            UI.stack().key('admin-panel').gap(10).style({ 
                padding: '20px', border: '1px solid #e0e0e0', 
                borderRadius: '8px', background: '#fafafa'
            }).children(
                UI.text("Панель администратора").as('h3').bold(),
                UI.input().id('admin-name-input').value(s.adminName)
                  .onInput(e => s.adminName = e.target.value)
                  .placeholder("Введите имя админа..."),
                UI.text(`Текущее имя: ${s.adminName}`).small().color('#555'),
                UI.button("Сохранить").onClick(saveAdminSettings)
            )
        ),

        // 3. Таблица пользователей с VDOM-оптимизированными действиями
        UI.text("Таблица пользователей").as('h2').bold().style({ borderTop: '2px solid #eee', paddingTop: '20px' }),
        UI.row().gap(10).style({ flexWrap: 'wrap' }).children(
            UI.button("Добавить пользователя").onClick(addUser),
            UI.button("Перемешать").onClick(shuffleUsers),
            UI.button("Перевернуть список").onClick(reverseUsers)
        ),
        UI.table()
          .headers([
              { key: 'id', label: 'ID' }, { key: 'name', label: 'Имя' },
              { key: 'role', label: 'Роль' }, { key: 'status', label: 'Статус' },
              { key: 'actions', label: 'Действия' }
          ])
          .rows(s.users) // Привязываем к реактивному массиву
          .renderCell((key, user) => {
              if (key === 'status') {
                  // Кликабельный статус для проверки точечного обновления
                  return UI.text(user.status)
                           .color(user.status === 'active' ? 'green' : '#999')
                           .bold()
                           .style({ cursor: 'pointer' })
                           .onClick(() => updateUserStatus(user.id));
              }
              if (key === 'actions') {
                  // Кнопка удаления
                  return UI.button('Удалить')
                           .onClick(() => removeUser(user.id))
                           .style({ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: '5px' });
              }
              return user[key];
          }),

        // 4. Гибридный компонент
        UI.text("Гибридный компонент").as('h2').bold(),
        UI.hybrid('uiverse-discover-button')
          .replace('{{TEXT}}', s.hybridButtonText)
          .on('button', 'click', () => {
              s.hybridButtonText = 'Нажато! (' + new Date().toLocaleTimeString() + ')';
          })
    )
);

// ===================
// --- ЗАПУСК ---
// ===================
UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
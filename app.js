// Файл: app.js (Финальная, правильная версия)

// UI передается сервером и содержит все наши строители
const state = UI.createReactive({
    viewTitle: "SlightUI: Демонстрация и стресс-тест",
    showAdminPanel: false,
    adminName: "Администратор",
    users: [
        { id: 1, name: 'Анна К.', role: 'Админ', status: 'active' },
        { id: 2, name: 'Петр В.', role: 'Кассир', status: 'active' },
        { id: 3, name: 'Иван С.', role: 'Пользователь', status: 'inactive' },
    ],
    hybridButtonText: "Кнопка из Uiverse",
});

// =======================================================
// --- ШАГ 1: ВСЕ ОБРАБОТЧИКИ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
// Определяем всё, что будет использоваться ниже, в одном месте.
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
    const newUser = { id, name: `Новый пользователь ${id}`, role: 'Кассир', status: 'active' };
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

const saveAdminSettings = () => {
    alert(`Настройки сохранены! Новое имя администратора: "${state.adminName}"`);
};

// --- ✨ Намеренные ошибки для демонстрации ✨ ---

// 1. Ошибка в обработчике события
const buggyButtonHandler = () => {
    console.log("Эта кнопка сейчас вызовет ошибку...");
    const undefinedObject = null;
    undefinedObject.doSomething(); 
};

// 2. "Сломанный" компонент-строитель
const BrokenComponent = () => ({
    toJSON: () => {
        throw new Error("Я компонент, который всегда ломается при рендеринге!");
    }
});

// 3. Компонент с ошибкой в хуке onMount
const FaultyMountComponent = () => {
    return UI.text("Этот текст отрендерится, но в консоли будет ошибка из onMount.")
        .color('orange')
        .onMount(() => {
            console.log("Попытка выполнить ошибочный onMount...");
            document.getElementById('non-existent-element').focus();
        });
};


// ===================================
// --- ШАГ 2: ГЛАВНЫЙ ВИД ПРИЛОЖЕНИЯ ---
// Теперь, когда все функции определены, мы можем безопасно их использовать.
// ===================================

const AppView = (s) => (
    UI.stack().gap(30).style({
        maxWidth: '800px', margin: '40px auto', padding: '30px',
        background: '#ffffff', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
    }).children(

        // 1. Стандартные компоненты
        UI.text(s.viewTitle).as('h1').bold().onMount(onTitleMount),
        
        // 2. Условный рендеринг (UI.if)
        UI.row().gap(15).align('center').children(
            UI.text("Показать расширенные опции:"),
            UI.button(s.showAdminPanel ? 'Скрыть панель' : 'Показать панель')
              .onClick(() => s.showAdminPanel = !s.showAdminPanel)
        ),

        // Панель администратора, которая теперь работает правильно
        UI.if(s.showAdminPanel).then(() =>
            UI.stack().gap(10).style({ 
                padding: '20px', border: '1px solid #f0f0f0', 
                borderRadius: '8px', background: '#f9f9f9'
            }).children(
                UI.text("Панель администратора").bold(),
                UI.input().id('admin-name-input').value(s.adminName)
                  .onInput(e => s.adminName = e.target.value),
                UI.text(`Имя админа: ${s.adminName}`).small().color('#777'),
                UI.button("Сохранить настройки админа").onClick(saveAdminSettings)
            )
        ),

        // 3. Таблица с циклом (UI.table и UI.for)
        UI.text("Таблица пользователей").as('h2').bold(),
        UI.row().gap(10).children(
            UI.button("Добавить случайного").onClick(addUser),
            UI.button("Перемешать").onClick(shuffleUsers)
        ),
        UI.table()
          .headers([
              { key: 'id', label: 'ID' }, { key: 'name', label: 'Имя' },
              { key: 'role', label: 'Роль' }, { key: 'status', label: 'Статус' },
              { key: 'actions', label: 'Действия' }
          ])
          .rows(s.users)
          .renderCell((key, user) => {
              if (key === 'status') {
                  return UI.text(user.status).color(user.status === 'active' ? 'green' : '#999').bold();
              }
              if (key === 'actions') {
                  return UI.button('Удалить').onClick(() => removeUser(user.id))
                           .style({ background: '#ffebee', color: '#c62828', border: 'none' });
              }
              return user[key];
          }),
        
        // 4. Гибридный компонент
        UI.text("Гибридный компонент").as('h2').bold().style({ marginTop: '20px' }),
        UI.hybrid('uiverse-discover-button')
          .replace('{{TEXT}}', s.hybridButtonText)
          .on('button', 'click', () => {
              s.hybridButtonText = 'Нажато!';
              alert('Клик по гибридной кнопке!');
          }),

        // --- Раздел для демонстрации ошибок ---
        UI.text("Тестирование отказоустойчивости").as('h2').bold().style({ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }),

        // Ошибка №1
        UI.text("1. Ошибка в обработчике события:"),
        UI.button("Нажми меня, чтобы сломать").onClick(buggyButtonHandler).style({ background: '#ffcdd2' }),

        // Ошибка №2
        UI.text("2. Компонент, который не может отрендериться:").style({ marginTop: '20px' }),
        BrokenComponent(),
        
        // Ошибка №3
        UI.text("3. Попытка итерации не по массиву:").style({ marginTop: '20px' }),
        UI.for({ each: { a: 1, b: 2 }, as: (item) => UI.text(item) }),
        
        // Ошибка №4
        UI.text("4. Компонент с ошибкой в хуке onMount:").style({ marginTop: '20px' }),
        FaultyMountComponent()
    )
);

// ===================
// --- ШАГ 3: ЗАПУСК ---
// ===================
UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
// Файл: app.js (Финальная версия с работающей навигацией)

// --- 1. Состояние приложения ---
// ИЗМЕНЕНИЕ: Добавили 'activeScreen' для управления навигацией
const state = UI.createReactive({
    activeScreen: 'main', // 'main', 'profile', 'settings'
    users: [
        { id: 1, name: 'Анна Кузнецова', role: 'Администратор', status: 'active' },
        { id: 2, name: 'Петр Васильев', role: 'Менеджер', status: 'inactive' },
        { id: 3, name: 'Иван Сидоров', role: 'Пользователь', status: 'active' },
    ],
    showInfo: true,
    newUser: { name: '', role: 'Пользователь' },
    filterText: '',
    discoverButtonText: 'Узнать больше' 
});


// --- 2. Компоненты-строители ---

// Header и Footer без изменений
const Header = () => UI.row().align('center').children(UI.text("SlightUI Dashboard").as('h2').bold().color('#4f46e5'));
const Footer = () => UI.row().align('center').justify('center').children(UI.text("© 2024").small().color('#6b7280'));


// ИЗМЕНЕНИЕ: Sidebar теперь умеет менять состояние и подсвечивать активную кнопку
const Sidebar = () => {
    const baseButtonStyle = { width: '100%', justifyContent: 'flex-start', padding: '8px 12px', border: '1px solid transparent', background: 'none' };
    const activeButtonStyle = { ...baseButtonStyle, background: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5', fontWeight: 'bold' };

    // Функция для создания навигационной кнопки
    const NavButton = (screenName, label) =>
        UI.button(label)
            .style(state.activeScreen === screenName ? activeButtonStyle : baseButtonStyle)
            .onClick(() => state.activeScreen = screenName);
            
    return UI.stack().gap(8).children(
        UI.text("Навигация").bold().color('#374151'),
        NavButton('main', 'Главная'),
        NavButton('profile', 'Профиль'),
        NavButton('settings', 'Настройки')
    );
};

// --- Компоненты для каждого экрана ---

const MainScreenContent = () => {
    // ... вся логика добавления/фильтрации пользователей остается здесь ...
    const newUserNameInputRef = { current: null };
    const filteredUsers = state.users.filter(user => user.name.toLowerCase().includes(state.filterText.toLowerCase()));
    const addUser = () => {
        if (!state.newUser.name.trim()) return;
        const newUserObject = { id: Date.now(), name: state.newUser.name, role: state.newUser.role, status: 'active' };
        state.users = [...state.users, newUserObject];
        state.newUser.name = '';
        newUserNameInputRef.current?.focus();
    };

    return UI.stack().gap(20).children(
        UI.text("Основной контент").as('h3').bold(),
        UI.row().gap(10).align('center').children(
            UI.button("Показать/Скрыть инфо").onClick(() => state.showInfo = !state.showInfo),
            UI.input().placeholder("Фильтр по имени...").value(state.filterText).onInput(e => state.filterText = e.target.value)
        ),
        UI.if(() => state.showInfo).then(() =>
            UI.stack().key('info-block').style({ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '5px', background: '#f9fafb' }).gap(10).children(
                UI.text("Это демонстрационный дашборд, построенный на SlightUI."),
                UI.hybrid('uiverse-discover-button').replace('TEXT', state.discoverButtonText).on('root', 'click', () => {
                    state.discoverButtonText = 'Загрузка...';
                    setTimeout(() => { state.discoverButtonText = 'Готово!'; }, 1000);
                })
            )
        ),
        UI.stack().gap(10).style({ borderTop: '1px solid #eee', paddingTop: '20px' }).children(
            UI.text("Добавить нового пользователя:").bold(),
            UI.row().gap(10).align('center').children(
                UI.input().placeholder("Имя пользователя").value(state.newUser.name).onInput(e => state.newUser.name = e.target.value).ref(newUserNameInputRef).onMount(el => el.focus()),
                UI.button("Добавить").onClick(addUser)
            )
        ),
        UI.text("Таблица пользователей:").bold(),
        UI.table().key('users-table').headers([{ key: 'name', label: 'Имя' }, { key: 'role', label: 'Роль' }, { key: 'status', label: 'Статус' }, { key: 'actions', label: 'Действия' }]).rows(filteredUsers).renderCell((key, row) => {
            if (key === 'status') return UI.text(row.status).bold().color(row.status === 'active' ? 'green' : 'gray');
            if (key === 'actions') return UI.button("Удалить").onClick(() => { state.users = state.users.filter(u => u.id !== row.id); });
            return row[key];
        })
    );
};

const ProfileScreenContent = () =>
    UI.stack().gap(10).children(
        UI.text("Профиль пользователя").as('h3').bold(),
        UI.text("Здесь будет форма редактирования профиля.")
    );

const SettingsScreenContent = () =>
    UI.stack().gap(10).children(
        UI.text("Настройки системы").as('h3').bold(),
        UI.text("Здесь будут различные системные настройки."),
        UI.button("Сбросить настройки")
    );


// ИЗМЕНЕНИЕ: Content теперь является "роутером", который решает, какой компонент показать
const Content = () => {
    switch (state.activeScreen) {
        case 'main':
            return MainScreenContent();
        case 'profile':
            return ProfileScreenContent();
        case 'settings':
            return SettingsScreenContent();
        default:
            return UI.text("Страница не найдена").color('red');
    }
};


// --- 3. Главный вид приложения (AppView) ---
// Структура остается той же, но теперь Content будет динамически меняться
const AppView = () => (
    UI.stack().style({ width: '100%', height: '100%' }).children(
        UI.stack().flex(0, 0, '60px').style({ padding: '15px', background: '#eef2ff', borderBottom: '1px solid #e0e7ff' }).children(Header()),
        UI.row().flex(1, 1, 'auto').style({ overflow: 'hidden' }).children(
            UI.stack().flex(0, 0, '220px').style({ padding: '15px', background: '#ffffff', borderRight: '1px solid #e5e7eb' }).children(Sidebar()),
            UI.stack().flex(1, 1, 'auto').style({ padding: '15px', overflow: 'auto', background: '#f9fafb' }).children(Content())
        ),
        UI.stack().flex(0, 0, '40px').style({ padding: '10px', background: '#eef2ff', borderTop: '1px solid #e0e7ff' }).children(Footer())
    )
);


// --- 4. Запуск приложения ---
UI.create({
    target: document.getElementById('app'),
    view: AppView
});
// Файл: app.js (Правильная версия для финального теста)

// Компонент UserCard теперь может быть написан чисто и логично
const UserCard = (props) => {
    const { user, onDelete } = props;
    
    // Мы можем создавать стилизованный текст прямо внутри children
    return UI.row().style({ padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }).children(
        UI.stack().flex(1, 1, '0').children(UI.text(user.name)),
        UI.stack().flex(1, 1, '0').children(UI.text(user.role)),
        UI.stack().flex(1, 1, '0').children(
            UI.text(user.status).bold().color(user.status === 'active' ? 'green' : 'gray')
        ),
        UI.stack().flex(0, 0, 'auto').children(
            UI.button('Удалить').key(`delete-btn-${user.id}`).onClick(() => onDelete(user.id))
        )
    );
};

// --- Остальная часть файла app.js без изменений ---
const Header = () => UI.row().align('center').children(UI.text("SlightUI Dashboard V2").as('h2').bold().color('#4f46e5'));
const Footer = () => UI.row().align('center').justify('center').children(UI.text("© 2024").small().color('#6b7280'));
const Sidebar = () => {
    const baseButtonStyle = { width: '100%', justifyContent: 'flex-start', padding: '8px 12px', border: '1px solid transparent', background: 'none', cursor: 'pointer' };
    const activeButtonStyle = { ...baseButtonStyle, background: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5', fontWeight: 'bold' };
    const NavButton = (screen, label) => UI.button(label).key(screen).style(state.activeScreen === screen ? activeButtonStyle : baseButtonStyle).onClick(() => state.activeScreen = screen);
    return UI.stack().gap(8).children( UI.text("Навигация").bold().color('#374151'), NavButton('main', 'Главная'), NavButton('profile', 'Профиль'), NavButton('settings', 'Настройки') );
};
const state = UI.createReactive({ activeScreen: 'main', users: [ { id: 1, name: 'Анна Кузнецова', role: 'Администратор', status: 'active' }, { id: 2, name: 'Петр Васильев', role: 'Менеджер', status: 'inactive' }, { id: 3, name: 'Иван Сидоров', role: 'Пользователь', status: 'active' } ], filterText: '', newUserName: '', showInfo: true, discoverButtonText: 'Узнать больше' });
const MainScreenContent = () => {
    const inputRef = { current: null };
    const addUser = () => { if (!state.newUserName.trim()) return; state.users = [...state.users, { id: Date.now(), name: state.newUserName, role: 'Пользователь', status: 'active' }]; state.newUserName = ''; inputRef.current?.focus(); };
    const deleteUser = (userId) => { state.users = state.users.filter(u => u.id !== userId); };
    return UI.stack().gap(20).children(
        UI.row().gap(10).align('center').children( UI.button("Показать/Скрыть инфо").onClick(() => state.showInfo = !state.showInfo), UI.input().key('filter-input').placeholder("Фильтр по имени...").model(state, 'filterText') ),
        UI.if(() => state.showInfo).then(() => UI.stack().key('info-block').style({ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '5px', background: '#f9fafb' }).gap(10).children( UI.text("Это демонстрационный дашборд с компонентами, props и двусторонним связыванием."), UI.hybrid('uiverse-discover-button').replace('TEXT', state.discoverButtonText).on('root', 'click', () => { state.discoverButtonText = 'Загрузка...'; setTimeout(() => { state.discoverButtonText = 'Готово!'; }, 1000); }) ) ),
        UI.stack().gap(10).style({ borderTop: '1px solid #eee', paddingTop: '20px' }).children( UI.text("Добавить нового пользователя:").bold(), UI.row().gap(10).align('center').children( UI.input().key('add-user-input').placeholder("Имя пользователя").ref(inputRef).model(state, 'newUserName'), UI.button("Добавить").onClick(addUser) ) ),
        UI.stack().gap(5).children( UI.text("Список пользователей:").bold(), UI.stack().style({ border: '1px solid #eee', borderRadius: '5px' }).children( UI.for({ each: state.users.filter(u => u.name.toLowerCase().includes(state.filterText.toLowerCase())), key: 'id', as: (user) => UI.component(UserCard, { user: user, onDelete: deleteUser }) }) ) )
    );
};
const ProfileScreenContent = () => UI.stack().gap(10).children(UI.text("Профиль").as('h3').bold(), UI.text("Страница профиля в разработке."));
const SettingsScreenContent = () => UI.stack().gap(10).children(UI.text("Настройки").as('h3').bold(), UI.text("Страница настроек в разработке."));
const Content = () => { switch (state.activeScreen) { case 'main': return UI.component(MainScreenContent); case 'profile': return UI.component(ProfileScreenContent); case 'settings': return UI.component(SettingsScreenContent); default: return UI.text("Страница не найдена").color('red'); } };
const AppView = () => (
    UI.stack().style({ width: '100%', height: '100%' }).children(
        UI.stack().flex(0, 0, '60px').style({ padding: '15px', background: '#eef2ff', borderBottom: '1px solid #e0e7ff' }).children(UI.component(Header)),
        UI.row().flex(1, 1, 'auto').style({ overflow: 'hidden' }).children(
            UI.stack().flex(0, 0, '220px').style({ padding: '15px', background: '#ffffff', borderRight: '1px solid #e5e7eb' }).children(UI.component(Sidebar)),
            UI.stack().flex(1, 1, 'auto').style({ padding: '15px', overflow: 'auto', background: '#f9fafb' }).children(UI.component(Content))
        ),
        UI.stack().flex(0, 0, '40px').style({ padding: '10px', background: '#eef2ff', borderTop: '1px solid #e0e7ff' }).children(UI.component(Footer))
    )
);
UI.create({ target: document.getElementById('app'), view: AppView });
// Файл: app.js (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)

const state = UI.createReactive({
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


const Content = () => {
    const newUserNameInputRef = { current: null };
    
    const filteredUsers = state.users.filter(user => 
        user.name.toLowerCase().includes(state.filterText.toLowerCase())
    );

    const addUser = () => {
        if (!state.newUser.name.trim()) return;
        
        const newUserObject = { 
            id: Date.now(), 
            name: state.newUser.name,
            role: state.newUser.role,
            status: 'active'
        };

        // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ: ИММУТАБЕЛЬНОЕ ОБНОВЛЕНИЕ МАССИВА ---
        // Мы не мутируем старый массив, а создаем новый, присваивая его state.users.
        // Это гарантированно вызовет реактивное обновление.
        state.users = [...state.users, newUserObject];
        // -----------------------------------------------------------------

        state.newUser.name = ''; // Очищаем поле для ввода
        newUserNameInputRef.current?.focus();
    };
    
    return UI.stack().gap(20).children(
        UI.text("Основной контент").as('h3').bold(),

        UI.row().gap(10).align('center').children(
            UI.button("Показать/Скрыть инфо").onClick(() => state.showInfo = !state.showInfo),
            UI.input()
                .placeholder("Фильтр по имени...")
                .value(state.filterText)
                .onInput(e => state.filterText = e.target.value)
        ),
        
        UI.if(() => state.showInfo).then(() =>
            UI.stack().key('info-block').style({ 
                border: '1px solid #e5e7eb', padding: '15px', borderRadius: '5px', background: '#f9fafb' 
            }).gap(10).children(
                UI.text("Это демонстрационный дашборд, построенный на SlightUI."),
                // ИСПРАВЛЕНИЕ: Вызываем replace с чистым плейсхолдером 'TEXT'
                UI.hybrid('uiverse-discover-button')
                    .replace('TEXT', state.discoverButtonText)
                    .on('root', 'click', () => {
                        state.discoverButtonText = 'Загрузка...';
                        setTimeout(() => { state.discoverButtonText = 'Готово!'; }, 1000);
                    })
            )
        ),
        
        UI.stack().gap(10).style({ borderTop: '1px solid #eee', paddingTop: '20px' }).children(
            UI.text("Добавить нового пользователя:").bold(),
            UI.row().gap(10).align('center').children(
                UI.input()
                    .placeholder("Имя пользователя")
                    .value(state.newUser.name)
                    .onInput(e => state.newUser.name = e.target.value)
                    .ref(newUserNameInputRef)
                    .onMount(el => el.focus()),
                UI.button("Добавить").onClick(addUser)
            )
        ),

        UI.text("Таблица пользователей:").bold(),
        UI.table().key('users-table')
            .headers([
                { key: 'name', label: 'Имя' }, 
                { key: 'role', label: 'Роль' },
                { key: 'status', label: 'Статус' },
                { key: 'actions', label: 'Действия' }
            ])
            .rows(filteredUsers)
            .renderCell((key, row) => {
                if (key === 'status') {
                    return UI.text(row.status)
                        .bold()
                        .color(row.status === 'active' ? 'green' : 'gray');
                }
                if (key === 'actions') {
                    return UI.button("Удалить").onClick(() => {
                        // Тоже используем иммутабельный подход через filter
                        state.users = state.users.filter(u => u.id !== row.id);
                    });
                }
                return row[key];
            })
    );
};

// Остальная часть файла (Header, Footer, Sidebar, AppView, UI.create) остается без изменений.
const Header = () => UI.row().align('center').children(UI.text("SlightUI Dashboard").as('h2').bold().color('#4f46e5'));
const Footer = () => UI.row().align('center').justify('center').children(UI.text("© 2024").small().color('#6b7280'));
const Sidebar = () => UI.stack().gap(8).children(UI.text("Навигация").bold().color('#374151'), UI.button("Главная").style({ width: '100%', justifyContent: 'flex-start' }), UI.button("Профиль").style({ width: '100%', justifyContent: 'flex-start' }), UI.button("Настройки").style({ width: '100%', justifyContent: 'flex-start' }));

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

UI.create({ target: document.getElementById('app'), view: AppView });
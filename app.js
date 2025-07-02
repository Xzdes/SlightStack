// Файл: app.js (ФИНАЛЬНАЯ, ПОБЕДНАЯ ВЕРСИЯ)

// --- Стили и простые компоненты-заготовки ---
const panelStyle = { padding: '15px', borderRadius: '8px', boxSizing: 'border-box' };
const headerFooterStyle = { ...panelStyle, background: '#eef2ff', border: '1px solid #e0e7ff' };
const sidebarStyle = { ...panelStyle, background: '#ffffff', borderRight: '1px solid #e5e7eb' };
const contentStyle = { ...panelStyle, background: '#ffffff', overflow: 'auto' }; // Только контент может скроллиться

// --- Компоненты-строители для частей макета ---

const Header = () => 
    UI.row().align('center').children(
        UI.text("SlightUI Dashboard").as('h2').bold().color('#4f46e5')
    );

const Footer = () => 
    UI.row().align('center').justify('center').children(
        UI.text("© 2024").small().color('#6b7280')
    );

const Sidebar = () => 
    UI.stack().gap(8).children(
        UI.text("Навигация").bold().color('#374151'),
        UI.button("Главная"),
        UI.button("Профиль"),
        UI.button("Настройки")
    );

const state = UI.createReactive({
    users: [
        { id: 1, name: 'Анна Кузнецова', role: 'Администратор' },
        { id: 2, name: 'Петр Васильев', role: 'Менеджер' },
        { id: 3, name: 'Иван Сидоров', role: 'Пользователь' },
    ],
    showInfo: true,
});

const Content = () => 
    UI.stack().gap(20).children(
        UI.text("Основной контент").as('h3').bold(),
        UI.row().gap(10).children(
            UI.button("Показать/Скрыть инфо").onClick(() => state.showInfo = !state.showInfo),
            UI.button("Перемешать").onClick(() => {
                state.users.sort(() => Math.random() - 0.5);
                state.users = [...state.users];
            })
        ),
        UI.if(state.showInfo).then(() =>
            UI.text("Это информационный блок.").key('info-block').style({ 
                border: '1px solid #e5e7eb', padding: '15px', borderRadius: '5px', background: '#f9fafb' 
            })
        ),
        UI.text("Таблица пользователей:").bold(),
        UI.table()
            .headers([{ key: 'name', label: 'Имя' }, { key: 'role', label: 'Роль' }])
            .rows(state.users)
    );

// --- ГЛАВНЫЙ ВИД ПРИЛОЖЕНИЯ ---

const AppView = () => (
    // 1. Главный вертикальный контейнер. Он автоматически займет все пространство холста.
    UI.stack().style({ width: '100%', height: '100%' }).children(
        
        // 2. Шапка: не растет, не сжимается, высота 60px
        UI.stack().flex(0, 0, '60px').style(headerFooterStyle).children(
            Header()
        ),

        // 3. Средняя часть: растет и занимает все оставшееся место
        UI.row().flex(1, 1, 'auto').style({ overflow: 'hidden' }).children(
        
            // 4. Сайдбар: не растет, не сжимается, ширина 220px
            UI.stack().flex(0, 0, '220px').style(sidebarStyle).children(
                Sidebar()
            ),

            // 5. Контент: растет и занимает все оставшееся место
            UI.stack().flex(1, 1, 'auto').style(contentStyle).children(
                Content()
            )
        ),
        
        // 6. Футер: не растет, не сжимается, высота 40px
        UI.stack().flex(0, 0, '40px').style(headerFooterStyle).children(
            Footer()
        )
    )
);

// --- ЗАПУСК ---
UI.create({
    target: document.getElementById('app'),
    view: () => AppView()
});
// Файл: demo/app.js (Новая версия для "SlightDash")

module.exports = function(UI) {

    // 1. Импортируем наш новый роутер из ядра.
    // Обратите внимание, что provideRouterDeps уже был вызван в server.js,
    // поэтому Router и Link готовы к работе.
    const { Router, Link } = require('../core/router.js');

    // --- Компоненты страниц (пока что простые заглушки) ---

    const DashboardPage = () => UI.stack({ padding: 20, gap: 15 }).children(
        UI.text({ tag: 'h1', text: 'Главная панель' }),
        UI.text({ text: 'Здесь будут виджеты и статистика.' })
    );

    const TasksPage = () => UI.stack({ padding: 20, gap: 15 }).children(
        UI.text({ tag: 'h1', text: 'Управление задачами' }),
        UI.text({ text: 'Здесь будет наш To-Do List, но на стероидах.' })
    );
    
    const SettingsPage = () => UI.stack({ padding: 20, gap: 15 }).children(
        UI.text({ tag: 'h1', text: 'Настройки' }),
        UI.text({ text: 'Здесь будут различные настройки приложения.' })
    );

    const NotFoundPage = () => UI.stack({ padding: 20, gap: 15, alignItems: 'center' }).children(
        UI.text({ tag: 'h1', text: '404 - Страница не найдена' }),
        Link({ to: '/', children: 'Вернуться на главную' })
    );

    // --- Карта маршрутов для роутера ---

    const routes = {
        '/': DashboardPage,
        '/tasks': TasksPage,
        '/settings': SettingsPage,
        '*': NotFoundPage // Страница по умолчанию (404)
    };
    
    // --- Главный вид приложения ---
    
    const AppView = () =>
        UI.row({ width: '100vw', height: '100vh', background: '#f4f7fa' }).children(
            
            // Левая панель навигации (Sidebar)
            UI.stack({
                width: 240,
                background: 'white',
                padding: '20px 0',
                boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                gap: 10
            }).children(
                UI.text({
                    tag: 'h2',
                    text: 'SlightDash',
                    padding: '0 20px',
                    margin: '0 0 20px 0'
                }),
                
                // Используем наш новый компонент Link для навигации
                Link({ to: '/', children: 'Главная', padding: '10px 20px', ':hover:background': '#f4f7fa' }),
                Link({ to: '/tasks', children: 'Задачи', padding: '10px 20px', ':hover:background': '#f4f7fa' }),
                Link({ to: '/settings', children: 'Настройки', padding: '10px 20px', ':hover:background': '#f4f7fa' }),
                Link({ to: '/несуществующий-путь', children: 'Сломанная ссылка', padding: '10px 20px', color: 'red', ':hover:background': '#f4f7fa' })
            ),
            
            // Основная область контента
            UI.stack({ flex: 1, padding: 30, overflowY: 'auto' }).children(
                // Роутер будет рендерить здесь нужную страницу
                Router({ routes })
            )
        );

    // --- Запуск приложения ---
    
    UI.create({
        target: document.getElementById('app'),
        view: AppView
    });
};
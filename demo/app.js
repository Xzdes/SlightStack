// Файл: demo/app.js
// Задача: Продемонстрировать использование нового модульного API SlightStack.

// Весь код приложения обернут в функцию, которая принимает UI как зависимость.
// Это делает код чистым и тестируемым.
module.exports = function(UI) {

    // 1. Создаем реактивное состояние
    const state = UI.createReactive({
        counter: 0
    });

    // 2. Описываем наш UI как функцию, возвращающую VNode-строитель.
    const AppView = () => (
        UI.stack().props({
            style: {
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                background: 'linear-gradient(to right, #ece9e6, #ffffff)'
            }
        }).children(
            
            UI.text().props({
                TEXT: `Счетчик: ${state.counter}`,
                style: {
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#333'
                }
            }),

            UI.row().props({ style: { gap: '15px' } }).children(
                
                UI.button('Уменьшить')
                  .on('click', () => state.counter--),
                
                UI.button('Увеличить')
                  .on('click', () => state.counter++),

                UI.button('Сбросить')
                  .props({ disabled: state.counter === 0 })
                  .on('click', () => state.counter = 0)
            )
        )
    );

    // 3. Запускаем рендеринг в целевой DOM-элемент
    UI.create({
        target: document.getElementById('app'),
        view: AppView
    });
};
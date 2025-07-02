// Файл: app.js (Финальная версия с гибридной кнопкой)

// UI передается сервером
const state = UI.createReactive({
    counter: 0,
    textInputValue: "Fluent API работает!",
    hybridButtonText: "Кнопка из Uiverse"
});

const AppView = (s) => (
    UI.stack().gap(25).style({
        maxWidth: '600px',
        margin: '40px auto',
        padding: '30px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        alignItems: 'flex-start' // Выравниваем все по левому краю
    }).children(

        UI.text("SlightUI Fluent API").as('h1').bold(),

        UI.row().gap(15).align('center').children(
            UI.text(`Счетчик: ${s.counter}`),
            UI.button("+1").onClick(() => s.counter++)
        ),

        UI.input()
            .id("main-input")
            .value(s.textInputValue)
            .onInput(e => s.textInputValue = e.target.value),
        
        UI.if(s.textInputValue).then(
             UI.text(`Введено: ${s.textInputValue}`).color('#777').small()
        ),
        
        // --- ВОТ ОНА, НАША НОВАЯ КНОПКА! ---
        UI.hybrid('uiverse-discover-button')
          .replace('{{TEXT}}', s.hybridButtonText) // Управляем текстом из состояния
          .on('button', 'click', () => {
              alert('Клик по гибридной кнопке!');
              s.hybridButtonText = 'Нажато!';
          })
    )
);

UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
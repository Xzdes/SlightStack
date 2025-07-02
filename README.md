```markdown
# SlightUI — Fluent-фреймворк с гибридными компонентами

SlightUI — это современный JavaScript-фреймворк, созданный для максимального удовольствия от разработки. Его философия — элегантный **Fluent API** (текучий интерфейс), который позволяет описывать UI в виде интуитивно понятных цепочек методов, и **система гибридных компонентов** для легкой интеграции любого внешнего дизайна.

<br>

![Пример интерфейса SlightUI](https://i.imgur.com/r6C5l1Q.png)

<br>

**Ключевые особенности:**
*   **Элегантный Fluent API:** Пишите код, который читается как проза: `UI.text("Привет").bold().large()`.
*   **Гибридные компоненты:** Интегрируйте любой HTML/CSS дизайн (например, с [uiverse.io](https://uiverse.io/elements)) за считанные минуты.
*   **Полная автоматизация:** Просто создайте файл компонента — и он готов к использованию. Никаких ручных импортов.
*   **Встроенный DevServer:** Запустите одну команду и начните творить, с автоматической пересборкой при каждом обновлении страницы.
*   **Простая и мощная реактивность:** Меняйте ваш объект состояния, и интерфейс обновится сам.

---

## 🚀 Быстрый старт

### 1. Установка
Убедитесь, что у вас установлен [Node.js](https://nodejs.org/).

```bash
# Клонируйте репозиторий
git clone https://github.com/Xzdes/slight-ui.git

# Перейдите в папку проекта
cd slight-ui

# Установите все необходимые зависимости
npm install
```

### 2. Запуск
Для начала работы выполните всего одну команду в терминале:

```bash
npm start
```

Эта команда запустит локальный DevServer. После успешного запуска вы увидите в консоли:

```
✅ SlightUI Fluent DevServer с гибридными компонентами запущен на http://localhost:3000
```
**Откройте в браузере адрес `http://localhost:3000`**, и вы увидите работающее тестовое приложение.

---

## 🛠️ Практическое руководство

### 1. Основы: Fluent API и состояние

В `app.js` вы работаете с главным объектом `UI`, который передается сервером. Все начинается с создания реактивного состояния.

```javascript
// app.js

// UI передается сервером
const state = UI.createReactive({
    counter: 0,
    userName: "Гость"
});

const AppView = (s) => (
    // Создаем вертикальный контейнер
    UI.stack().gap(15).children(

        // Создаем текст и делаем его жирным
        UI.text(`Пользователь: ${s.userName}`).bold(),

        // Создаем ряд с элементами, выровненными по центру
        UI.row().gap(10).align('center').children(
            UI.text(`Счетчик: ${s.counter}`),
            UI.button("+1").onClick(() => s.counter++) // Меняем состояние по клику
        ),

        // Создаем поле ввода
        UI.input()
            .id("name-input")
            .value(s.userName) // Привязываем к состоянию
            .onInput(e => s.userName = e.target.value) // Обновляем состояние при вводе
    )
);

UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
```

### 2. Логические компоненты: `UI.if()`

Используйте `UI.if()` для условного рендеринга. Он принимает условие и использует метод `.then()` для отображения контента.

```javascript
const AppView = (s) => (
    UI.stack().gap(10).children(
        UI.text(`Счетчик: ${s.counter}`),
        UI.button("+1").onClick(() => s.counter++),

        // Показываем текст, только если счетчик больше 5
        UI.if(s.counter > 5).then(
            UI.text("Счетчик больше пяти!").color('green').bold()
        )
    )
);
```

### 3. Создание своего "нативного" компонента

Вы можете легко расширять `SlightUI` своими собственными компонентами-строителями.

**Шаг 1: Создайте файл `components/card.js`**
```javascript
// Файл: components/card.js
const UI = require('../core/ui-builder'); // Подключаем UI для использования внутри

function CardBuilder() {
    this.header = null;
    this.body = null;
}

// Методы для установки "слотов"
CardBuilder.prototype.header = function(headerBuilder) { this.header = headerBuilder; return this; };
CardBuilder.prototype.body = function(bodyBuilder) { this.body = bodyBuilder; return this; };

// Финальный метод, который собирает vNode
CardBuilder.prototype.toJSON = function() {
    return UI.stack()
        .style({
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden'
        })
        .children(
            // Рендерим слоты, если они есть
            this.header ? UI.stack().style({ padding: '15px 20px', borderBottom: '1px solid #eee' }).children(this.header) : null,
            this.body ? UI.stack().style({ padding: '20px' }).children(this.body) : null
        )
        .toJSON(); // Важно вернуть чистый vNode
};

module.exports = () => new CardBuilder();
```
**Шаг 2: Перезагрузите страницу в браузере.**
Сервер автоматически найдет `card.js` и добавит `UI.card` в ваш API.

**Шаг 3: Используйте в `app.js`**
```javascript
// app.js
const AppView = (s) => (
    UI.card()
      .header( UI.text(`Карточка пользователя`).bold() )
      .body( UI.text(`Имя: ${s.userName}`) )
);
```

### 4. Интеграция "гибридного" компонента с Uiverse

Это "суперсила" SlightUI.

**Шаг 1: Скопируйте HTML и CSS**
1.  Найдите компонент на [uiverse.io](https://uiverse.io/elements).
2.  Создайте папку в `hybrid-components/`, например, `my-button`.
3.  Скопируйте HTML в `hybrid-components/my-button/component.html`. Замените динамический текст на плейсхолдер, например, `{{BUTTON_TEXT}}`.
4.  Скопируйте CSS в `hybrid-components/my-button/component.css`.

**Шаг 2: Используйте в `app.js`**
Вызовите компонент по имени его папки через `UI.hybrid()`:
```javascript
// app.js
const AppView = (s) => (
    UI.stack().gap(20).children(
        UI.text("Обычная кнопка:"),
        UI.button("Клик").onClick(() => alert("Обычный клик")),

        UI.text("Гибридная кнопка:"),
        UI.hybrid('uiverse-discover-button') // Имя папки
          .replace('{{TEXT}}', `Нажато: ${s.counter}`) // Управляем текстом
          .on('button', 'click', () => s.counter++) // Навешиваем событие
    )
);
```
**Перезагрузите страницу, и новый компонент появится!**

---

## 📂 Структура проекта

```
slight-ui/
├── components/          # Папка для "нативных" Fluent-строителей (stack.js, button.js)
├── hybrid-components/   # Папка для "внешних" HTML/CSS компонентов
├── core/                # Ядро фреймворка (renderer.js, reactive.js)
├── helpers/             # Папка для логических компонентов (if.js, for.js)
├── app.js               # Ваше тестовое приложение
├── server.js            # Локальный сервер для разработки
└── test.html            # HTML-обертка для приложения
```

---

## 🔮 Что дальше?

*   **Пополняйте библиотеку `hybrid-components`:** Найдите красивые инпуты, переключатели, карточки и "адаптируйте" их для своего проекта.
*   **Создавайте сложные "нативные" компоненты:** Попробуйте создать `Table` или `Tabs` в виде Fluent-строителей.
*   **Напишите тесты** для ядра, чтобы гарантировать его стабильность.
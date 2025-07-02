```markdown
# SlightUI — Fluent-фреймворк с VDOM и гибридными компонентами

SlightUI — это современный JavaScript-фреймворк, созданный для максимального удовольствия от разработки. Его философия — элегантный **Fluent API** (текучий интерфейс), который позволяет описывать UI в виде интуитивно понятных цепочек методов, и высокопроизводительный движок **Virtual DOM** для молниеносных обновлений интерфейса.

<br>



<br>

**Ключевые особенности:**
*   **Элегантный Fluent API:** Пишите код, который читается как проза: `UI.text("Привет").bold().large()`.
*   **Производительный Virtual DOM:** Высокоэффективный движок рендеринга `(VDOM diff/patch)` гарантирует, что обновляются только измененные части UI. Результат — максимальная скорость и отсутствие мерцаний.
*   **Гибридные компоненты:** Интегрируйте любой HTML/CSS дизайн (например, с [uiverse.io](https://uiverse.io/elements)) за считанные минуты, не жертвуя реактивностью.
*   **Полная автоматизация:** Просто создайте файл компонента — и он готов к использованию. Никаких ручных импортов или сложной настройки.
*   **Встроенный DevServer:** Запустите одну команду и начните творить. Сервер автоматически пересобирает ваше приложение при каждом обновлении страницы.
*   **Легковесная и мощная реактивность:** Меняйте ваш объект состояния, созданный с помощью `Proxy`, и интерфейс обновится сам.

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
✅ SlightUI Fluent DevServer запущен на http://localhost:3000
```
**Откройте в браузере адрес `http://localhost:3000`**, и вы увидите работающее демонстрационное приложение.

---

## 🛠️ Практическое руководство

### 1. Основы: Fluent API и состояние

В `app.js` вы работаете с главным объектом `UI`, который собирается сервером. Все начинается с создания реактивного состояния.

```javascript
// Файл: app.js
const state = UI.createReactive({
    counter: 0,
    userName: "Гость"
});

const AppView = (s) => (
    // Создаем вертикальный контейнер
    UI.stack().gap(15).children(
        // Создаем текст и делаем его жирным
        UI.text(`Пользователь: ${s.userName}`).bold(),
        // Создаем ряд с элементами
        UI.row().gap(10).align('center').children(
            UI.text(`Счетчик: ${s.counter}`),
            UI.button("+1").onClick(() => s.counter++)
        ),
        // Создаем поле ввода с двусторонней привязкой
        UI.input()
            .value(s.userName)
            .onInput(e => s.userName = e.target.value)
    )
);

UI.create({
    target: document.getElementById('app'),
    view: () => AppView(state)
});
```

### 2. Логические компоненты: `UI.if()` и `UI.for()`

Используйте логические компоненты для управления потоком рендеринга.

**Условный рендеринг с `UI.if()`:**
```javascript
UI.if(state.showPanel).then(() =>
    UI.text("Эта панель видна только если showPanel === true")
)
```

**Рендеринг списков с `UI.for()`:**
**Важно:** всегда используйте `key` для списков, чтобы VDOM мог эффективно обновлять элементы.
```javascript
const AppView = (s) => (
    UI.stack().gap(5).children(
        UI.button("Добавить").onClick(() => {
            const id = s.items.length + 1;
            s.items.push({ id, name: `Элемент ${id}` });
            s.items = [...s.items]; // Триггер реактивности
        }),
        // UI.for возвращает фрагмент, который рендерер обработает
        UI.for({
            each: s.items,
            key: 'id', // Ключ для оптимизации VDOM
            as: (item) => UI.text(item.name).key(item.id)
        })
    )
);
```

### 3. Создание своего "нативного" компонента

Вы можете легко расширять `SlightUI`, создавая собственные компоненты-строители.

**Шаг 1: Создайте файл `components/Card.js`**
Компонент должен возвращать `vNode` правильной структуры: `{ type, props, children }`.

```javascript
// Файл: components/Card.js

// Этот компонент не требует `require`, он самодостаточен.
function CardBuilder() {
    this.headerBuilder = null;
    this.bodyBuilder = null;
}

// Методы для установки "слотов", принимающие другие строители
CardBuilder.prototype.header = function(headerBuilder) { this.headerBuilder = headerBuilder; return this; };
CardBuilder.prototype.body = function(bodyBuilder) { this.bodyBuilder = bodyBuilder; return this; };

// Финальный метод, который собирает vNode
CardBuilder.prototype.toJSON = function() {
    const children = [];

    if (this.headerBuilder) {
        children.push({
            type: 'CardHeader',
            props: { tag: 'div', style: { padding: '15px 20px', borderBottom: '1px solid #eee' } },
            children: [this.headerBuilder] // Передаем строитель как дочерний элемент
        });
    }
    if (this.bodyBuilder) {
        children.push({
            type: 'CardBody',
            props: { tag: 'div', style: { padding: '20px' } },
            children: [this.bodyBuilder] // Передаем строитель как дочерний элемент
        });
    }

    return {
        type: 'Card',
        props: {
            tag: 'div',
            style: {
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }
        },
        children: children
    };
};

module.exports = () => new CardBuilder();
```
**Шаг 2: Перезагрузите страницу в браузере.**
Сервер автоматически найдет `Card.js` и добавит `UI.Card` в ваш API.

**Шаг 3: Используйте в `app.js`**
```javascript
// app.js
const AppView = (s) => (
    UI.Card()
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
          .replace('{{TEXT}}', `Нажато: ${s.counter} раз`) // Управляем текстом
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
├── core/                # Ядро фреймворка (VDOM рендерер, реактивность)
├── helpers/             # Папка для логических компонентов (if.js, for.js)
├── app.js               # Ваше демонстрационное приложение
├── server.js            # Локальный сервер для разработки
└── test.html            # HTML-обертка для приложения
```

---

## 🔮 Что дальше?

*   **Пополняйте библиотеку `hybrid-components`:** Найдите красивые инпуты, переключатели, карточки и "адаптируйте" их для своего проекта.
*   **Создавайте сложные "нативные" компоненты:** Попробуйте создать `Tabs` или `Modal` в виде Fluent-строителей.
*   **Изучите ядро:** Загляните в `core/renderer.js`, чтобы увидеть, как работает VDOM "под капотом".
*   **Напишите тесты** для ядра (`reactive.js`, `renderer.js`), чтобы гарантировать его стабильность при дальнейших доработках.
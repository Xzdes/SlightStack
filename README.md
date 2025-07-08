# SlightStack — Реактивный UI-фреймворк с CSS-подобным API


**SlightStack** — это легковесный JavaScript-фреймворк, который объединяет простоту HTML-компонентов с мощью декларативного JS API. Забудьте о сложных CSS-in-JS библиотеках. Вместо этого описывайте стили, состояния и адаптивность прямо в свойствах компонентов, используя интуитивный синтаксис, вдохновленный Tailwind CSS и CSS-псевдоклассами.

Он сочетает простоту классических шаблонов, удобный **JS Builder API** для их сборки и высокопроизводительный **"keyed" Virtual DOM** для молниеносных обновлений.

**Ключевые особенности:**

*   🧱 **HTML как компонент:** Ваш главный инструмент — это HTML. Создайте папку, положите в нее `component.html` и `component.css` — и новый компонент готов.
*   ✨ **CSS-подобный API в JS:** Управляйте стилями, состояниями (`:hover`) и адаптивностью (`sm:`) прямо в JavaScript. Декларативно, интуитивно и в одном месте.
*   🎨 **Изоляция стилей "из коробки":** CSS для компонентов автоматически скоупится с помощью `data-` атрибутов, предотвращая глобальные конфликты.
*   🚀 **Производительный Virtual DOM:** Молниеносные обновления списков и интерфейса благодаря эффективному "keyed" алгоритму сравнения (diff/patch), который минимизирует манипуляции с DOM.
*   🔗 **Двустороннее связывание:** Используйте `.model()` для легкой синхронизации состояния с полями ввода (`input`, `checkbox`).
*   ⚡ **Нулевая конфигурация:** Никаких сложных сборщиков. Просто создайте папку для компонента и начните творить.
*   🖥️ **Встроенный DevServer:** Одна команда для запуска демо-проекта.

---

## 🚀 Быстрый старт: Использование в вашем проекте

SlightStack спроектирован для легкой интеграции.

### 1. Установка

```bash
npm install slightstack
```

### 2. Структура проекта

Создайте в вашем проекте следующую структуру:

```
my-project/
├── hybrid-components/   # Здесь будут жить ваши HTML/CSS компоненты
│   └── button/
│       ├── component.html
│       └── component.css
├── public/
│   ├── index.html
│   └── bundle.js        # Сюда будет собран ваш код
├── src/
│   └── app.js           # Ваш основной файл приложения
├── package.json
└── server.js            # Простой DevServer для разработки
```

### 3. Настройка DevServer и сборщика

Создайте файл `server.js` (или используйте любой другой сборщик, например, Vite или Webpack, настроив его соответствующим образом).

```javascript
// server.js
const express = require('express');
const browserify = require('browserify');
const path = require('path');
const stream = require('stream');
const slightUI = require('slightstack'); // Установленный пакет

const app = express();
const PORT = 3000;

function escapePath(p) { return p.replace(/\\/g, '\\\\'); }

// Роут для сборки вашего JS-кода на лету
app.get('/bundle.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    
    // 1. Получаем пути к файлам ядра SlightStack
    const coreFiles = slightUI.builderAPI.getCoreFilePaths();
    
    // 2. Указываем путь к вашим гибридным компонентам
    const componentsPath = path.resolve(__dirname, 'hybrid-components');
    const hybridData = slightUI.builderAPI.getHybridComponentData(componentsPath);
    
    // 3. Создаем точку входа для Browserify
    const entryPointContent = `
        const { createReactive } = require('${escapePath(coreFiles.reactivityReactive)}');
        const { createEffect } = require('${escapePath(coreFiles.reactivityEffect)}');
        const { createUI } = require('${escapePath(coreFiles.api)}');
        
        const hybridComponentData = ${JSON.stringify(hybridData, null, 2)};
        const UI = createUI(hybridComponentData, { createReactive, createEffect });
        
        const appCode = require('${escapePath(path.resolve(__dirname, 'src', 'app.js'))}');
        appCode(UI);
    `;

    const b = browserify();
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(entryPointContent);
    readable.push(null);
    b.add(readable, { basedir: __dirname });
    
    b.bundle().pipe(res);
});

// Роут для отдачи HTML
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
```

### 4. Создание приложения

**`public/index.html`**
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>My SlightStack App</title>
</head>
<body>
    <div id="app"></div>
    <script src="/bundle.js"></script>
</body>
</html>
```

**`src/app.js`**
```javascript
// Ваш код приложения
module.exports = function(UI) {
    const AppView = () => 
        UI.stack({ padding: 20, gap: 10 }).children(
            UI.text({ tag: 'h1', text: 'Привет, SlightStack!' }),
            UI.button({ text: 'Нажми меня', onclick: () => alert('Работает!') })
        );
        
    UI.create({
        target: document.getElementById('app'),
        view: AppView
    });
};
```

### 5. Запуск
```bash
node server.js
```
Откройте `http://localhost:3000` и наслаждайтесь результатом!

---

## 🛠️ API и концепции

### 1. Компонент — это папка
(Этот раздел остается прежним)

### 2. Декларативное API

Описывайте внешний вид и поведение компонентов прямо в их свойствах.

#### Базовые стили и атрибуты
```javascript
UI.button({
    text: 'Кнопка',
    id: 'my-button',
    background: '#6366f1', // Будет применен как инлайн-стиль
    padding: '10px 20px',
    color: 'white',
    onclick: () => console.log('Клик!')
})
```

#### Адаптивность (`sm:`, `md:`, `lg:`)
Настройте брейкпойнты один раз и используйте префиксы.
```javascript
UI.config({
    breakpoints: { sm: 768, md: 1024 }
});

UI.stack({
    flexDirection: 'column',
    'sm:flexDirection': 'row' // На экранах > 768px станет рядом
})
```

#### Состояния (`:hover:`, `:focus:`)
```javascript
UI.input({
    border: '1px solid #ccc',
    ':focus:borderColor': '#6366f1'
})
```

#### Продвинутые модификаторы
Используйте всю мощь CSS декларативно!

*   **Псевдо-классы для детей:**
    ```javascript
    UI.item({
        borderBottom: '1px solid #eee',
        ':last:borderBottom': 'none' // Убираем рамку у последнего
    })
    ```
*   **Псевдо-элементы:**
    ```javascript
    UI.label({
        text: 'Имя',
        ':after:content': '"*"' // Добавляем звездочку
    })
    ```
*   **Групповой ховер:**
    ```javascript
    UI.row({ group: true }).children( // Помечаем родителя
        UI.text({ text: 'Наведи на меня' }),
        UI.icon({ 
            opacity: 0,
            ':group-hover:opacity': 1 // Иконка появляется при ховере на весь row
        })
    )
    ```

#### Умный `className`
`className` принимает строки, массивы и объекты для удобного управления классами.
```javascript
const isActive = true;
UI.button({
    className: [
        'base-class',
        { 'active-class': isActive },
        !isActive && 'inactive-class'
    ]
})
```

### 3. Реактивность и состояние
(Этот раздел остается прежним)

### 4. Рендеринг списков (`UI.for`)
(Этот раздел остается прежним)

### 5. Двустороннее связывание (`.model()`)
(Этот раздел остается прежним)

---

## 📂 Структура ядра

`SlightStack` спроектирован для простоты и ясности. Ядро фреймворка полностью модульное.

```
core/
├── dom/                #   - Взаимодействие с DOM (создание, патчинг)
├── reactivity/         #   - Реактивность (Proxy, эффекты)
├── renderer/           #   - Логика VDOM (mount, unmount, patch)
├── vdom/               #   - Структура VNode (создание, нормализация)
├── api.js              #   - Публичный JS Builder API (UI.button и т.д.)
├── create-app.js       #   - Главная функция сборки приложения
└── state-manager.js    #   - Управление состоянием окна и брейкпойнтами
```

---

## 🔮 Философия и что дальше?

**SlightStack** доказывает, что современные, реактивные интерфейсы можно создавать, не отказываясь от простоты и мощи чистого HTML. Он создан для быстрой разработки, прототипирования и для тех, кто ценит прозрачность и контроль над своим кодом.

Вы можете легко расширять библиотеку, создавая новые компоненты в `hybrid-components/`, или исследовать ядро, чтобы понять, как работают современные фреймворки "под капотом".
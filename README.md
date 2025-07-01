```markdown
# SlightUI — Легковесный Реактивный UI-фреймворк

SlightUI — это простой, но мощный JavaScript-фреймворк для создания пользовательских интерфейсов. Его философия — максимальное удобство для разработчика и предсказуемость. Вы описываете интерфейс как результат вашего состояния, а фреймворк берет на себя всю работу по отрисовке и обновлениям.

**Ключевые особенности:**
*   **Декларативный подход:** UI — это функция от состояния.
*   **Реактивность "из коробки":** Просто меняйте ваш объект состояния, и интерфейс обновится автоматически.
*   **Встроенная библиотека компонентов:** Поставляется с готовым набором базовых элементов (`Layout`, `Button`, `Input` и т.д.).
*   **Никакого HTML/CSS:** Весь интерфейс описывается на чистом JavaScript.
*   **Простота:** Минимальный API, который легко изучить за 10 минут.

---

## 🚀 Быстрый старт

### 1. Требования

*   [Node.js](https://nodejs.org/)
*   Инструмент для сборки CommonJS-модулей (например, [Browserify](http://browserify.org/))

### 2. Установка

Проект находится в разработке и пока не опубликован в npm. Чтобы использовать его, скопируйте папку с фреймворком (`core`, `components`, `helpers`, `index.js`) в свой проект.

### 3. Пример использования

Создайте два файла: `index.html` и `app.js`.

**`index.html`**
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>SlightUI App</title>
</head>
<body>
    <div id="app"></div>
    <script src="bundle.js"></script>
</body>
</html>
```

**`app.js`**
```javascript
// Подключаем все необходимое из SlightUI
const { UI, Layout, Text, Button, Input } = require('./slight-ui'); // Укажите правильный путь к index.js

// 1. Описываем начальное состояние
const initialState = {
  userName: 'Гость',
  counter: 0,
};

// 2. Создаем "чертеж" нашего приложения
function AppView(state) {
  return Layout({
    gap: 15,
    children: [
      Text({ value: `Привет, ${state.userName}!`, size: 'large' }),
      Input({
        id: 'name-input',
        bindTo: state,
        key: 'userName',
      }),
      Layout({
        direction: 'horizontal',
        gap: 10,
        children: [
          Button({
            label: `Счетчик: ${state.counter}`,
            onClick: () => state.counter++,
          }),
        ],
      }),
    ],
  });
}

// 3. Запускаем приложение
UI.create({
  target: document.getElementById('app'),
  view: AppView,
  state: initialState,
});
```

**4. Сборка проекта**

Установите Browserify и соберите ваш `app.js` в `bundle.js`:
```bash
npm install browserify --save-dev
npx browserify app.js -o bundle.js
```

Теперь откройте `index.html` в браузере!

---

## 🛠️ Как это работает и как добавлять новые элементы

### Основная концепция

Каждый компонент в SlightUI — это простая JavaScript-функция, которая принимает объект со свойствами (`props`) и возвращает стандартизированный JS-объект, который мы называем "виртуальный узел" (`vNode`).

Этот `vNode` описывает, каким должен быть DOM-элемент: его тег, стили, дочерние элементы и обработчики событий. Рендерер SlightUI затем использует эти `vNode` для построения и обновления реального DOM.

### Как добавить новый компонент (на примере `Checkbox`)

Предположим, мы хотим создать компонент `Checkbox`.

**1. Создайте новый файл `components/checkbox.js`:**
```javascript
// Файл: components/checkbox.js

const Layout = require('./layout'); // Мы можем использовать другие компоненты!
const Text = require('./text');

function Checkbox(props) {
  const { label = '', bindTo, key, id } = props;

  if (!bindTo || typeof key !== 'string') {
    console.error('Checkbox требует props "bindTo" и "key".');
    return null;
  }
  
  const onInput = (event) => {
    // Обновляем состояние на основе состояния чекбокса
    bindTo[key] = event.target.checked;
  };

  // Чекбокс - это сложный компонент, состоящий из input и label.
  // Мы можем скомпоновать его с помощью Layout!
  return Layout({
    direction: 'horizontal',
    gap: 8,
    props: {
        // Мы можем добавить пользовательский класс для стилизации если захотим
        className: 'checkbox-wrapper'
    },
    children: [
      {
        type: 'CheckboxInput',
        props: {
          tag: 'input',
          type: 'checkbox',
          id: id,
          // `checked` - специальный атрибут для чекбоксов
          checked: !!bindTo[key],
          onInput: onInput,
        }
      },
      Text({ value: label })
    ]
  });
}

module.exports = Checkbox;
```

**2. Добавьте его в `index.js`:**

Откройте `index.js` и добавьте новую строку в `module.exports`, чтобы компонент стал доступен пользователям.

```javascript
// index.js (фрагмент)
module.exports = {
  // ... другие компоненты
  Input: require('./components/input'),
  Checkbox: require('./components/checkbox'), // <-- Наша новая строка

  // ... хелперы
};
```

**3. Используйте в приложении:**

Теперь в `app.js` вы можете использовать новый компонент:
```javascript
// app.js (фрагмент)
const { UI, ..., Checkbox } = require('./slight-ui');

const initialState = {
    // ...
    isConfirmed: false
};

function AppView(state) {
    return Layout({
        children: [
            // ...
            Checkbox({
                id: 'confirm-checkbox',
                label: 'Я согласен с условиями',
                bindTo: state,
                key: 'isConfirmed'
            }),
            If({
                condition: state.isConfirmed,
                then: () => Text({ value: 'Спасибо за подтверждение!' })
            })
        ]
    });
}
```

Этот подход позволяет создавать как простые компоненты (возвращающие один `vNode`), так и сложные, композитные компоненты, которые используют другие компоненты SlightUI для своей структуры.

---

## 🔮 Что дальше? (План развития)

SlightUI — молодой проект с большим потенциалом. Вот что можно было бы улучшить:

1.  **Оптимизация рендеринга списков:** Текущий рендерер полностью перерисовывает DOM. Для большинства приложений этого достаточно, но для очень больших списков можно внедрить более умный `patch`-алгоритм с поддержкой ключей (`key`), чтобы избежать пересоздания элементов.
2.  **Расширение библиотеки компонентов:** Добавить `Select`, `Modal`, `Tabs`, `Table` и другие часто используемые элементы.
3.  **Улучшение CSS-стилизации:** Сейчас стили вшиты в компоненты. Можно разработать механизм для их более гибкой кастомизации.
4.  **Написание тестов:** Покрыть ядро и компоненты юнит-тестами для обеспечения стабильности при дальнейших изменениях.
5.  **Публикация в npm:** Упаковать фреймворк как настоящий npm-пакет.
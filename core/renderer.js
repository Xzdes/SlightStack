// Файл: core/renderer.js (Финальная версия с поддержкой гибридных компонентов)

const { createReactive, createEffect } = require('./reactive');

/**
 * "Распаковывает" объект-строитель (builder), чтобы получить чистый vNode.
 */
function unwrap(builder) {
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    if (Array.isArray(builder)) {
        return builder.map(unwrap);
    }
    return builder;
}

/**
 * Рекурсивно создает и монтирует DOM-элементы на основе vNode.
 */
function mount(builder, container) {
    const vNode = unwrap(builder);

    if (vNode === null || vNode === undefined || vNode === false) {
        container.appendChild(document.createComment('placeholder'));
        return;
    }
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        container.appendChild(document.createTextNode(String(vNode)));
        return;
    }
    if (Array.isArray(vNode)) {
        vNode.forEach(child => mount(child, container));
        return;
    }

    const { type, props = {} } = vNode;

    // --- ОБРАБОТКА ГИБРИДНЫХ КОМПОНЕНТОВ ---
    if (type === 'HybridComponent') {
        const { innerHTML, inlineStyle, replacements, listeners, componentName } = props;

        // 1. Добавляем стили в <head>, если их там еще нет
        const styleId = `hybrid-style-${componentName}`;
        if (inlineStyle && !document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = inlineStyle;
            document.head.appendChild(styleEl);
        }

        // 2. Создаем временный контейнер для парсинга HTML
        const tempContainer = document.createElement('div');
        let finalHTML = innerHTML || '';

        // 3. Заменяем плейсхолдеры на реальные значения
        for (const key in replacements) {
            finalHTML = finalHTML.replace(new RegExp(key, 'g'), String(replacements[key]));
        }
        tempContainer.innerHTML = finalHTML;

        // 4. Навешиваем обработчики событий
        for (const selector in listeners) {
            const targetElement = tempContainer.querySelector(selector);
            if (targetElement) {
                for (const event in listeners[selector]) {
                    targetElement.addEventListener(event, listeners[selector][event]);
                }
            }
        }
        
        // 5. Находим корневой узел компонента (он должен быть один)
        const rootHybridEl = tempContainer.firstElementChild;
        if (rootHybridEl) {
             container.appendChild(rootHybridEl);
             if (props.onMount) props.onMount(rootHybridEl);
        } else {
             // Если HTML пустой, вставляем заглушку
             container.appendChild(document.createComment(`hybrid-placeholder-${componentName}`));
        }
        return;
    }

    // --- ОБРАБОТКА ОБЫЧНЫХ КОМПОНЕНТОВ ---
    const el = document.createElement(props.tag || 'div');

    for (const key in props) {
        if (key.startsWith('on')) {
            el.addEventListener(key.substring(2).toLowerCase(), props[key]);
        } else if (key === 'children') {
            mount(props.children, el); // mount рекурсивно вызовет unwrap для детей
        } else if (key === 'style') {
            Object.assign(el.style, props[key]);
        } else if (key !== 'tag' && key !== 'key' && key !== 'innerHTML' && key !== 'inlineStyle' && key !== 'replacements' && key !== 'listeners' && key !== 'componentName') {
            el.setAttribute(key, props[key]);
            if (key === 'value' || key === 'checked') {
                el[key] = props[key];
            }
        }
    }

    container.appendChild(el);
    if (props.onMount) props.onMount(el);
}

/**
 * Главная функция рендеринга.
 */
function render(viewFn, state, targetElement) {
    createEffect(() => {
        const activeElement = document.activeElement;
        const activeElementId = activeElement?.id;
        const selectionStart = activeElement?.selectionStart;

        const builder = viewFn(state);
        
        targetElement.innerHTML = '';
        mount(builder, targetElement);
        
        if (activeElementId) {
            const newActiveElement = document.getElementById(activeElementId);
            if (newActiveElement) {
                newActiveElement.focus();
                if (typeof selectionStart === 'number') {
                    newActiveElement.setSelectionRange(selectionStart, selectionStart);
                }
            }
        }
    });
}

module.exports = { render };
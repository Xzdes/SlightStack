// Файл: core/renderer.js (Обновленная, пуленепробиваемая версия)

const { createReactive, createEffect } = require('./reactive');

/**
 * Вспомогательная функция для создания DOM-элемента с сообщением об ошибке.
 * @param {string} message - Сообщение об ошибке.
 * @param {string} details - Детали ошибки (например, stack trace).
 * @returns {HTMLElement} - Готовый DOM-узел для вставки.
 */
function createErrorElement(message, details = '') {
    const errorEl = document.createElement('div');
    errorEl.style.border = '2px solid red';
    errorEl.style.backgroundColor = '#fff0f0';
    errorEl.style.color = 'black';
    errorEl.style.padding = '10px';
    errorEl.style.margin = '5px 0';
    errorEl.innerHTML = `<strong>Ошибка рендеринга:</strong> ${message}<br><pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; color: #555;">${details}</pre>`;
    return errorEl;
}

/**
 * "Распаковывает" объект-строитель (builder), чтобы получить чистый vNode.
 * В случае ошибки возвращает vNode ошибки.
 */
function unwrap(builder) {
    try {
        if (builder && typeof builder.toJSON === 'function') {
            return builder.toJSON();
        }
        if (Array.isArray(builder)) {
            return builder.map(unwrap);
        }
        return builder;
    } catch (e) {
        console.error("Ошибка в методе .toJSON() компонента:", e);
        // Возвращаем специальный тип vNode, который будет обработан в mount
        return { 
            type: 'RuntimeError', 
            props: { message: `Ошибка в .toJSON()`, details: e.stack } 
        };
    }
}


/**
 * Рекурсивно создает и монтирует DOM-элементы на основе vNode.
 */
function mount(builder, container) {
    let vNode;
    // --- ИЗМЕНЕНИЕ 2: Безопасное "разворачивание" строителя ---
    try {
        vNode = unwrap(builder);
    } catch (e) {
        console.error("Ошибка при разворачивании компонента:", e);
        container.appendChild(createErrorElement("Ошибка при обработке компонента", e.stack));
        return;
    }

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

    // --- ИЗМЕНЕНИЕ 3: Перехват ошибок на уровне рендеринга одного узла ---
    try {
        // Если unwrap уже вернул ошибку, обрабатываем ее
        if (vNode.type === 'RuntimeError') {
             container.appendChild(createErrorElement(vNode.props.message, vNode.props.details));
             return;
        }

        const { type, props = {} } = vNode;
        
        // Обработка гибридных компонентов (уже довольно безопасна, но добавим try/catch для хуков)
        if (type === 'HybridComponent') {
            const { innerHTML, inlineStyle, replacements, listeners, componentName, onMount } = props;
            const styleId = `hybrid-style-${componentName}`;
            if (inlineStyle && !document.getElementById(styleId)) {
                const styleEl = document.createElement('style');
                styleEl.id = styleId;
                styleEl.textContent = inlineStyle;
                document.head.appendChild(styleEl);
            }
            const tempContainer = document.createElement('div');
            let finalHTML = innerHTML || '';
            for (const key in replacements) {
                finalHTML = finalHTML.replace(new RegExp(key, 'g'), String(replacements[key]));
            }
            tempContainer.innerHTML = finalHTML;
            for (const selector in listeners) {
                const targetElement = tempContainer.querySelector(selector);
                if (targetElement) {
                    for (const event in listeners[selector]) {
                        targetElement.addEventListener(event, listeners[selector][event]);
                    }
                }
            }
            const rootHybridEl = tempContainer.firstElementChild;
            if (rootHybridEl) {
                 container.appendChild(rootHybridEl);
                 if (onMount) {
                     try { onMount(rootHybridEl); } catch (e) { console.error(`Ошибка в onMount гибридного компонента ${componentName}:`, e); }
                 }
            } else {
                 container.appendChild(document.createComment(`hybrid-placeholder-${componentName}`));
            }
            return;
        }

        // Обработка обычных компонентов
        const el = document.createElement(props.tag || 'div');

        for (const key in props) {
            if (key.startsWith('on')) {
                el.addEventListener(key.substring(2).toLowerCase(), props[key]);
            } else if (key === 'children') {
                mount(props.children, el);
            } else if (key === 'style') {
                Object.assign(el.style, props[key]);
            } else if (key !== 'tag' && key !== 'key' && key !== 'innerHTML' && key !== 'inlineStyle' && key !== 'replacements' && key !== 'listeners' && key !== 'componentName' && key !== 'onMount') {
                el.setAttribute(key, props[key]);
                if (key === 'value' || key === 'checked') { el[key] = props[key]; }
            }
        }

        container.appendChild(el);
        if (props.onMount) {
            try { props.onMount(el); } catch (e) { console.error(`Ошибка в хуке onMount для элемента <${el.tagName}>:`, e); }
        }

    } catch (e) {
        console.error("Произошла ошибка во время монтирования vNode:", vNode, e);
        container.appendChild(createErrorElement(`Не удалось смонтировать компонент.`, e.stack));
    }
}

/**
 * Главная функция рендеринга.
 */
function render(viewFn, state, targetElement) {
    createEffect(() => {
        const activeElement = document.activeElement;
        const activeElementId = activeElement?.id;
        const selectionStart = activeElement?.selectionStart;

        // --- ИЗМЕНЕНИЕ 4: Защита от ошибок в главной функции вида ---
        try {
            const builder = viewFn(state);
            targetElement.innerHTML = '';
            mount(builder, targetElement);
        } catch (e) {
            console.error("Критическая ошибка в функции view:", e);
            targetElement.innerHTML = '';
            targetElement.appendChild(createErrorElement("Критическая ошибка в главной функции рендеринга (view). Приложение остановлено.", e.stack));
        }
        
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
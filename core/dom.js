// Файл: core/dom.js (CommonJS, финальная версия)

function createDOMElement(vNode) {
    // Для VNode от UI.text() или любого другого, у кого есть тег
    if (vNode.props.tag) {
        // Создаем ПУСТОЙ элемент. За его наполнение
        // будет отвечать рекурсивный вызов mount в renderer.js
        return document.createElement(vNode.props.tag);
    }
    
    // Для "чистых" текстовых VNode, которые являются детьми других узлов
    if (vNode.type === 'text') {
        return document.createTextNode(vNode.children || '');
    }

    if (vNode.type === 'Fragment') {
        return document.createDocumentFragment();
    }
    
    if (vNode.type === 'HybridComponent') {
        return createHybridElement(vNode);
    }
    
    return document.createComment('unknown vnode type');
}

function createHybridElement(vNode) {
    const { componentName, innerHTML, inlineStyle, replacements, attrs } = vNode.props;
    const styleId = `slight-style-${componentName}`;
    if (inlineStyle && !document.getElementById(styleId)) {
        const styleEl = document.createElement('style'); styleEl.id = styleId; styleEl.textContent = inlineStyle; document.head.appendChild(styleEl);
    }
    
    let finalHTML = innerHTML || '';

    // Сначала заменяем плейсхолдеры для атрибутов
    if (attrs) {
        for(const key in attrs) {
            const placeholder = `{{${key.toUpperCase()}}}`;
            if (finalHTML.includes(placeholder)) {
                 finalHTML = finalHTML.replace(new RegExp(placeholder, 'g'), attrs[key]);
            }
        }
    }

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = finalHTML;
    const rootEl = tempContainer.firstElementChild;

    if (rootEl) {
        // Применяем атрибуты к самому элементу
        if (attrs) {
            for (const key in attrs) {
                rootEl.setAttribute(key, attrs[key]);
            }
        }

        // Применяем замены текста
        if (replacements) {
            let currentHTML = rootEl.innerHTML;
            for (const placeholder in replacements) {
                currentHTML = currentHTML.replace(new RegExp(placeholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), String(replacements[placeholder]));
            }
            rootEl.innerHTML = currentHTML;
        }
        
        // Обрабатываем слот
        let slotHTML = rootEl.innerHTML;
        rootEl.innerHTML = slotHTML.replace(/{{SLOT}}/g, '<div data-slight-slot></div>');
    }
    
    return rootEl || document.createComment(`hybrid-placeholder-for-${componentName}`);
}

function applyProps(el, oldProps = {}, newProps = {}) {
    if (el.nodeType !== 1) return;
    const allProps = { ...oldProps, ...newProps };
    for (const key in allProps) {
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        if (newValue === oldValue) continue;
        if (key.startsWith('on')) { const eventName = key.slice(2).toLowerCase(); if (oldValue) el.removeEventListener(eventName, oldValue); if (newValue) el.addEventListener(eventName, newValue); } else if (key === 'style') { for (const styleKey in newValue) el.style[styleKey] = newValue[styleKey]; if (oldValue) { for (const styleKey in oldValue) if (!(styleKey in newValue)) el.style[styleKey] = ''; } } else if (key === 'attrs') { for (const attrKey in newValue) el.setAttribute(attrKey, newValue[attrKey]); if (oldValue) { for (const attrKey in oldValue) if (!(attrKey in newValue)) el.removeAttribute(attrKey); } } else if (['value', 'checked', 'disabled'].includes(key)) { el[key] = newValue; }
    }
}
module.exports = { createDOMElement, applyProps };
// Файл: core/dom.js (ФИНАЛЬНАЯ, ИСПРАВЛЕННАЯ ВЕРСИЯ)

function createDOMElement(vNode) {
    // Для VNode от UI.text() или любого другого, у кого есть тег
    if (vNode.props.tag) {
        // Просто создаем пустой элемент. За его наполнение
        // будет отвечать рекурсивный вызов mount.
        const el = document.createElement(vNode.props.tag);
        return el;
    }
    
    // Для "чистых" текстовых VNode
    if (vNode.type === 'text') {
        // Здесь vNode.children - это уже строка, а не массив
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
    const { componentName, innerHTML, inlineStyle, replacements } = vNode.props;
    const styleId = `slight-style-${componentName}`;
    if (inlineStyle && !document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = inlineStyle;
        document.head.appendChild(styleEl);
    }
    
    let finalHTML = innerHTML || '';
    if (replacements) {
        for (const placeholder in replacements) {
            const regex = new RegExp(placeholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g');
            finalHTML = finalHTML.replace(regex, String(replacements[placeholder]));
        }
    }
    
    finalHTML = finalHTML.replace(/{{SLOT}}/g, '<div data-slight-slot></div>');
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = finalHTML;
    
    return tempContainer.firstElementChild || document.createComment(`hybrid-placeholder-for-${componentName}`);
}

function applyProps(el, oldProps = {}, newProps = {}) {
    if (el.nodeType !== 1) return;

    const allProps = { ...oldProps, ...newProps };
    
    for (const key in allProps) {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        if (newValue === oldValue) continue;
        
        if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            if (oldValue) el.removeEventListener(eventName, oldValue);
            if (newValue) el.addEventListener(eventName, newValue);
        } else if (key === 'style') {
            for (const styleKey in newValue) el.style[styleKey] = newValue[styleKey];
            if (oldValue) {
               for (const styleKey in oldValue) if (!(styleKey in newValue)) el.style[styleKey] = '';
            }
        } else if (key === 'attrs') {
            for (const attrKey in newValue) el.setAttribute(attrKey, newValue[attrKey]);
             if (oldValue) {
                for (const attrKey in oldValue) if (!(attrKey in newValue)) el.removeAttribute(attrKey);
            }
        } else if (['value', 'checked', 'disabled'].includes(key)) {
            el[key] = newValue;
        }
    }
}

module.exports = {
    createDOMElement,
    applyProps
};
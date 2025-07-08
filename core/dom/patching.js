// Файл: core/dom/patching.js (Финальная и правильная версия)

const VALID_PROPS = new Set(['id', 'className', 'value', 'checked', 'disabled', 'placeholder', 'src', 'alt', 'href', 'target', 'type', 'key', 'ref']);
const IS_EVENT = key => key.startsWith('on');
const IS_INTERNAL = key => ['children', 'model', 'listeners', 'tag', 'componentName', 'inlineStyle', 'innerHTML', 'replacements', 'attrs'].includes(key);

function applyPlainProps(el, oldProps = {}, newProps = {}, vnode) {
    if (el.nodeType !== 1) { // Для текстовых узлов
        const newText = newProps.text !== undefined ? String(newProps.text) : '';
        if (el.textContent !== newText) { el.textContent = newText; }
        return;
    }
    
    // Для GenericTextElement (UI.text) устанавливаем textContent
    if (vnode.type === 'GenericTextElement') {
        if (newProps.text !== undefined && el.textContent !== String(newProps.text)) {
            el.textContent = String(newProps.text);
        }
    }
    
    // TreeWalker и любая другая логика для гибридов отсюда УДАЛЕНА.
    // Она больше не нужна, т.к. createDOMElement делает всю работу.

    // Применяем атрибуты, стили и события
    const allProps = { ...oldProps, ...newProps };
    for (const key in allProps) {
        // Пропускаем все пропсы, которые являются частью шаблона или внутренними.
        if (IS_INTERNAL(key) || (vnode.type === 'HybridComponent' && vnode.props.innerHTML.includes(`{{${key.toUpperCase()}}}`))) {
            continue;
        }

        const oldValue = oldProps[key];
        const newValue = newProps[key];
        
        if (newValue === oldValue) continue;

        if (IS_EVENT(key)) {
            const eventName = key.slice(2).toLowerCase();
            if (oldValue) el.removeEventListener(eventName, oldValue);
            if (newValue) el.addEventListener(eventName, newValue);
        } else if (key === 'style' && typeof newValue === 'object') {
            el.style.cssText = '';
            for (const styleKey in newValue) { el.style[styleKey] = newValue[styleKey]; }
        } else if (VALID_PROPS.has(key)) {
             if (el[key] !== newValue) {
                el[key] = newValue;
             }
        } else {
             if (el.style[key] !== undefined) {
                el.style[key] = newValue;
             } else {
                 if (newValue == null || newValue === false) {
                     el.removeAttribute(key);
                 } else {
                     el.setAttribute(key, String(newValue));
                 }
             }
        }
    }
}


function applyProps(el, vnode, oldResolvedProps = {}) {
    if (!vnode) return;
    
    applyPlainProps(el, oldResolvedProps, vnode.resolvedProps, vnode);
}

module.exports = { applyProps };
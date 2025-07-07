// Файл: core/dom.js (CommonJS, финальная исправленная версия)

const { resolveProps } = require('./props-resolver.js');
const { stateContainer } = require('./state-manager.js');

function createDOMElement(vnode) {
    // Создаем "пустой" каркас, вся логика будет в applyProps.
    if (vnode.type === 'HybridComponent') {
        const tempContainer = document.createElement('div');
        const rawHTML = (vnode.props.innerHTML || '').replace(/{{SLOT}}/g, '<div data-slight-slot></div>');
        tempContainer.innerHTML = rawHTML;
        return tempContainer.firstElementChild || document.createComment(`hybrid-placeholder-for-${vnode.props.componentName}`);
    }
    if (vnode.type === 'GenericTextElement') {
        return document.createElement(vnode.props.tag || 'p');
    }
    if (vnode.type === 'text') { return document.createTextNode(''); }
    if (vnode.type === 'Fragment') { return document.createDocumentFragment(); }
    return document.createComment(`unknown vnode type: ${vnode.type}`);
}


const VALID_PROPS = new Set(['id', 'className', 'value', 'checked', 'disabled', 'placeholder', 'src', 'alt', 'href', 'target', 'type', 'key', 'ref']);
const IS_EVENT = key => key.startsWith('on');
const IS_INTERNAL = key => ['children', 'model', 'listeners', 'tag', 'componentName', 'inlineStyle', 'innerHTML', 'replacements', 'attrs'].includes(key);

function applyPlainProps(el, oldProps = {}, newProps = {}, vnode) {
    if (el.nodeType !== 1) { // Для текстовых узлов
        const newText = newProps.text !== undefined ? String(newProps.text) : '';
        if (el.textContent !== newText) { el.textContent = newText; }
        return;
    }
    
    // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
    // Мы больше не используем сложный TreeWalker.
    // Если есть проп 'text', мы просто устанавливаем textContent элемента.
    // Это корректно заменит плейсхолдер {{TEXT}} для кнопок и контент для UI.text().
    if (newProps.text !== undefined && el.textContent !== String(newProps.text)) {
        el.textContent = String(newProps.text);
    }

    const allProps = { ...oldProps, ...newProps };
    for (const key in allProps) {
        // 'text' уже обработан, пропускаем.
        if (IS_INTERNAL(key) || key === 'text') continue;

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
    
    // Этот вызов здесь ОСТАЕТСЯ, так как он нужен для patch
    applyPlainProps(el, oldResolvedProps, vnode.resolvedProps, vnode);
}

module.exports = { createDOMElement, applyProps };
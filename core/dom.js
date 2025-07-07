// Файл: core/dom.js (CommonJS, финальная исправленная версия)

const { resolveProps } = require('./props-resolver.js');
const { stateContainer } = require('./state-manager.js');

function createDOMElement(vnode) {
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
    
    if (vnode.type === 'GenericTextElement' && newProps.text !== undefined) {
        if (el.textContent !== String(newProps.text)) {
            el.textContent = String(newProps.text);
        }
    }
    
    if (vnode.type === 'HybridComponent') {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while(node = walker.nextNode()) {
            const placeholderMatch = node.nodeValue.match(/{{([A-Z_]+)}}/);
            if (placeholderMatch) {
                const propKey = placeholderMatch[1].toLowerCase();
                const newValue = newProps[propKey];
                if (newValue !== undefined && node.nodeValue !== String(newValue)) {
                    node.nodeValue = String(newValue);
                }
            }
        }
    }

    const allProps = { ...oldProps, ...newProps };
    for (const key in allProps) {
        if (IS_INTERNAL(key) || key.toLowerCase() === 'text') continue;

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


function applyProps(el, vnode) {
    if (!vnode) return;
    if (!vnode._internal) vnode._internal = { vnode: vnode };

    const rawProps = { ...vnode.props };
    const componentState = vnode._internal.state || {};
    
    if (rawProps.model && Array.isArray(rawProps.model)) {
        const [stateObject, propertyName] = rawProps.model;
        const isCheckbox = typeof stateObject[propertyName] === 'boolean';
        if (isCheckbox) {
            rawProps.type = 'checkbox';
            rawProps.checked = stateObject[propertyName];
            rawProps.onchange = e => stateObject[propertyName] = e.target.checked;
        } else {
            if (!rawProps.type) {
                rawProps.type = 'text';
            }
            rawProps.value = stateObject[propertyName];
            rawProps.oninput = e => stateObject[propertyName] = e.target.value;
        }
    }
    
    const finalProps = resolveProps(rawProps, stateContainer, componentState);
    const oldFinalProps = vnode._internal.lastAppliedProps || {};
    
    applyPlainProps(el, oldFinalProps, finalProps, vnode);

    vnode._internal.lastAppliedProps = finalProps;
}

module.exports = { createDOMElement, applyProps };
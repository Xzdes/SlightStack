// Файл: core/dom/patching.js

const VALID_PROPS = new Set(['id', 'value', 'checked', 'disabled', 'placeholder', 'src', 'alt', 'href', 'target', 'type', 'key', 'ref']);
const IS_EVENT = key => key.startsWith('on');
const IS_INTERNAL = key => ['children', 'model', 'listeners', 'tag', 'componentName', 'inlineStyle', 'innerHTML', 'replacements', 'attrs', 'group'].includes(key);

function processClassName(base, additions) {
    const classList = new Set(base.split(' ').filter(Boolean));
    
    if (typeof additions === 'string') {
        additions.split(' ').filter(Boolean).forEach(c => classList.add(c));
    } else if (Array.isArray(additions)) {
        additions.flat().forEach(item => {
            if (typeof item === 'string') {
                classList.add(item);
            } else if (typeof item === 'object' && item !== null) {
                for (const key in item) {
                    if (item[key]) {
                        classList.add(key);
                    } else {
                        classList.delete(key);
                    }
                }
            }
        });
    } else if (typeof additions === 'object' && additions !== null) {
        for (const key in additions) {
            if (additions[key]) {
                classList.add(key);
            } else {
                classList.delete(key);
            }
        }
    }
    
    return Array.from(classList).join(' ');
}

function applyPlainProps(el, oldProps = {}, newProps = {}, vnode) {
    if (el.nodeType !== 1) { 
        const newText = newProps.text !== undefined ? String(newProps.text) : '';
        if (el.textContent !== newText) { el.textContent = newText; }
        return;
    }
    
    if (vnode.type === 'GenericTextElement') {
        if (newProps.text !== undefined && el.textContent !== String(newProps.text)) {
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

    const scopeId = vnode.props.scopeId;
    if (scopeId) {
        const dynamicRules = newProps.dynamicRules || [];
        const styleId = `dynamic-style-${scopeId}`;
        let styleEl = document.getElementById(styleId);

        if (dynamicRules.length > 0) {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            const finalCSS = dynamicRules
                .join(' ')
                .replace(/\[data-v-scope-id\]/g, `[${scopeId}]`);

            if (styleEl.textContent !== finalCSS) {
                styleEl.textContent = finalCSS;
            }
        } else {
            if (styleEl) {
                styleEl.remove();
            }
        }
    }

    // --- 1. Удаление старых пропсов, которых нет в новых ---
    for (const key in oldProps) {
        if (!(key in newProps)) {
            if (IS_EVENT(key)) {
                el.removeEventListener(key.slice(2).toLowerCase(), oldProps[key]);
            } else if (key === 'style') {
                el.style.cssText = '';
            } else if (VALID_PROPS.has(key)) {
                el[key] = '';
            } else if (typeof el.style[key] !== 'undefined') {
                el.style[key] = '';
            } else {
                el.removeAttribute(key);
            }
        }
    }

    // --- 2. Добавление / Обновление новых пропсов ---
    for (const key in newProps) {
        if (IS_INTERNAL(key) || key === 'text' || key === 'dynamicRules') continue;
        
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        
        if (newValue === oldValue) continue;

        if (key === 'className') {
            const baseClass = vnode.el.className.baseVal ?? vnode.el.className;
            const finalClass = processClassName(baseClass, newValue);
            if (el.className !== finalClass) el.className = finalClass;
        } else if (IS_EVENT(key)) {
            if (oldValue) el.removeEventListener(key.slice(2).toLowerCase(), oldValue);
            el.addEventListener(key.slice(2).toLowerCase(), newValue);
        } else if (key === 'style') {
            Object.assign(el.style, newValue);
        } else if (VALID_PROPS.has(key)) {
            if (el[key] !== newValue) el[key] = newValue;
        } else {
            // Если это не стандартный атрибут, считаем его CSS-свойством
            if (typeof el.style[key] !== 'undefined') {
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
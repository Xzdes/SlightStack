// Файл: core/renderer/mount.js

const { createDOMElement } = require('../dom/creation.js');
const { applyProps } = require('../dom/patching.js');
const { attachInteractiveState } = require('../state-manager.js');

/**
 * Преобразует CSS-строку, добавляя к селекторам уникальный атрибут для изоляции стилей.
 * @param {string} css - Исходный CSS.
 * @param {string} scopeId - Уникальный атрибут (например, 'data-slight-v-a1b2c3d4').
 * @returns {string} - Преобразованный CSS.
 */
function scopeCSS(css, scopeId) {
    // Эта регулярка ищет селекторы, но не трогает @-правила (например, @keyframes)
    // и псевдо-элементы, которые должны быть в конце.
    return css.replace(/(^|}|,)\s*([^{},]+)/g, (match, prefix, selector) => {
        if (selector.trim().startsWith('@')) {
            return match; // Оставляем @-правила без изменений
        }
        
        // Добавляем атрибут к каждому селектору в группе (например, h1, h2)
        const scopedSelector = selector
            .split(',')
            .map(s => {
                const trimmedSelector = s.trim();
                // Находим псевдо-элементы (::before, ::after) и вставляем атрибут перед ними
                const pseudoMatch = trimmedSelector.match(/::?[\w-]+/);
                if (pseudoMatch) {
                    const baseSelector = trimmedSelector.slice(0, pseudoMatch.index);
                    const pseudoSelector = trimmedSelector.slice(pseudoMatch.index);
                    return `${baseSelector}[${scopeId}]${pseudoSelector}`;
                }
                return `${trimmedSelector}[${scopeId}]`;
            })
            .join(', ');
            
        return `${prefix} ${scopedSelector}`;
    });
}

function mount(vNode, container, anchor = null) {
    if (!vNode) return;
    
    if (vNode.type === 'Fragment') {
        vNode.anchor = document.createComment('fragment-anchor');
        if (container) {
            container.insertBefore(vNode.anchor, anchor);
        }
    }
    
    // Логика инъекции стилей теперь использует scopeId
    if (vNode.type === 'HybridComponent') {
        const { componentName, inlineStyle, scopeId } = vNode.props;
        const styleId = `slight-style-${componentName}`;

        if (inlineStyle && !document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            // Скоупим CSS перед вставкой
            styleEl.textContent = scopeCSS(inlineStyle, scopeId);
            document.head.appendChild(styleEl);
        }
    }
    
    const el = createDOMElement(vNode);
    vNode.el = el;
    
    // Добавляем scopeId как атрибут к элементу
    if (vNode.type === 'HybridComponent' && vNode.props.scopeId) {
        el.setAttribute(vNode.props.scopeId, '');
    }

    applyProps(el, vNode, {}); 
    attachInteractiveState(vNode);
    
    if (vNode.type === 'HybridComponent' && vNode.props.listeners) { 
        for (const selector in vNode.props.listeners) { 
            const elements = selector === 'root' ? [vNode.el] : vNode.el.querySelectorAll(selector); 
            elements.forEach(targetEl => { 
                for (const eventName in vNode.props.listeners[selector]) { 
                    const handler = vNode.props.listeners[selector][eventName]; 
                    targetEl.addEventListener(eventName, handler); 
                } 
            }); 
        } 
    }
    
    if (el.nodeType === 1 || el.nodeType === 11) {
        const children = vNode.resolvedProps?.children || vNode.children;
        if (children && children.length > 0) {
            const mountContainer = vNode.type === 'Fragment' ? container : (vNode.el.querySelector('[data-slight-slot]') || vNode.el);
            const childAnchor = vNode.type === 'Fragment' ? vNode.anchor : null;
            children.forEach(child => mount(child, mountContainer, childAnchor));
        }
    }
    
    if (container && vNode.type !== 'Fragment') {
        container.insertBefore(el, vNode.anchor || anchor);
    }

    if (vNode.props?.ref) vNode.props.ref.current = vNode.el;
}

function unmount(vNode) {
    if (!vNode) return;
    
    if (vNode.type === 'Fragment') {
        if (vNode.anchor && vNode.anchor.parentNode) {
            vNode.anchor.parentNode.removeChild(vNode.anchor);
        }
        const children = vNode.resolvedProps?.children || vNode.children || [];
        children.forEach(unmount);
        return;
    }

    if (vNode.props?.ref) vNode.props.ref.current = null;
    const parent = vNode.el.parentNode;
    if (parent) {
        parent.removeChild(vNode.el);
    }
}

module.exports = { mount, unmount };
// Файл: core/renderer/mount.js

const { createDOMElement } = require('../dom/creation.js');
const { applyProps } = require('../dom/patching.js');
const { attachInteractiveState } = require('../state-manager.js');

function mount(vNode, container, anchor = null) {
    if (!vNode) return;
    
    if (vNode.type === 'Fragment') {
        vNode.anchor = document.createComment('fragment-anchor');
        if (container) {
            container.insertBefore(vNode.anchor, anchor);
        }
    }
    
    if (vNode.type === 'HybridComponent') {
        const { componentName, inlineStyle } = vNode.props;
        const styleId = `slight-style-${componentName}`;
        if (inlineStyle && !document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = inlineStyle;
            document.head.appendChild(styleEl);
        }
    }
    
    const el = createDOMElement(vNode);
    vNode.el = el;

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
            // [ИЗМЕНЕНИЕ] Для детей фрагмента мы передаем его собственный якорь.
            // Для детей обычного элемента якорь не нужен (null), они просто добавляются в конец.
            const childAnchor = vNode.type === 'Fragment' ? vNode.anchor : null;
            children.forEach(child => mount(child, mountContainer, childAnchor));
        }
    }
    
    if (container && vNode.type !== 'Fragment') {
        container.insertBefore(el, anchor);
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
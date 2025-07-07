// Файл: core/renderer.js (CommonJS, окончательная версия)

const { createDOMElement, applyProps } = require('./dom.js');
const { normalize } = require('./normalize.js');

function mount(vNode, container) {
    if (!vNode) return;

    const el = createDOMElement(vNode);
    vNode.el = el;
    
    applyProps(el, {}, vNode.props);
    
    if (vNode.type === 'HybridComponent' && vNode.props.listeners) {
         for (const selector in vNode.props.listeners) {
            const elements = selector === 'root' ? [el] : el.querySelectorAll(selector);
            elements.forEach(targetEl => {
                for (const eventName in vNode.props.listeners[selector]) {
                    const handler = vNode.props.listeners[selector][eventName];
                    targetEl.addEventListener(eventName, handler);
                }
            });
        }
    }

    if (el.nodeType === 1) { 
        const children = vNode.type === 'HybridComponent' ? vNode.props.children : vNode.children;
        if (children && children.length > 0) {
            const mountContainer = el.querySelector('[data-slight-slot]') || el;
            children.forEach(child => mount(child, mountContainer));
        }
    }

    if (container) container.appendChild(el);
    if (vNode.props?.ref) vNode.props.ref.current = el;
    if (vNode.props?.onMount) vNode.props.onMount(el);
}

function unmount(vNode) {
    if (!vNode) return;
    if (vNode.props?.onUnmount) vNode.props.onUnmount(vNode.el);
    if (vNode.props?.ref) vNode.props.ref.current = null;
    const parent = vNode.el.parentNode;
    if (parent) parent.removeChild(vNode.el);
}

function patch(n1, n2) {
    if (n1.type !== n2.type || (n1.props.tag && n1.props.tag !== n2.props.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    const el = (n2.el = n1.el);
    
    if (n1.type === 'HybridComponent') {
        if (JSON.stringify(n1.props.replacements) !== JSON.stringify(n2.props.replacements)) {
            const parent = n1.el.parentNode;
            unmount(n1);
            mount(n2, parent);
            return;
        }
    }
    
    applyProps(el, n1.props, n2.props);

    if (n1.props.tag) {
        // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
        // Извлекаем текст из дочернего VNode, а не сам VNode.
        const oldText = n1.children[0] ? n1.children[0].children : '';
        const newText = n2.children[0] ? n2.children[0].children : '';
        
        if (oldText !== newText) {
            el.textContent = newText;
        }
    } 
    else if (n1.type === 'HybridComponent') {
        const container = el.querySelector('[data-slight-slot]') || el;
        patchChildren(container, n1.props.children, n2.props.children);
    }
}

function patchChildren(container, oldCh, newCh) {
    const oldLen = oldCh.length;
    const newLen = newCh.length;
    const commonLen = Math.min(oldLen, newLen);

    for (let i = 0; i < commonLen; i++) {
        patch(oldCh[i], newCh[i]);
    }
    
    if (newLen > oldLen) {
        for (let i = commonLen; i < newLen; i++) {
            mount(newCh[i], container);
        }
    } else if (oldLen > newLen) {
        for (let i = commonLen; i < oldLen; i++) {
            unmount(oldCh[i]);
        }
    }
}

function createRender(createEffect) {
    return function render(viewFn, targetElement) {
        let oldVNode = null;
        createEffect(() => {
            const newVNode = normalize(viewFn());
            if (!oldVNode) {
                targetElement.innerHTML = '';
                mount(newVNode, targetElement);
            } else {
                patch(oldVNode, newVNode);
            }
            oldVNode = newVNode;
        });
    };
}

module.exports = {
    createRender
};
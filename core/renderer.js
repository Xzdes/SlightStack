// Файл: core/renderer.js (ФИНАЛЬНАЯ, РАБОЧАЯ ВЕРСИЯ)

const { createEffect } = require('./reactive');

/**
 * "Нормализатор" VNode. Превращает все, что угодно (строители, строки, числа)
 * в стандартизированный объект vNode.
 */
function unwrap(builder) {
    // --- ГЛАВНОЕ ИЗМЕНЕНИЕ: Оборачиваем примитивы в vNode ---
    if (typeof builder === 'string' || typeof builder === 'number') {
        return { type: 'text', children: [String(builder)] };
    }
    if (builder && typeof builder.toJSON === 'function') {
        return builder.toJSON();
    }
    if (Array.isArray(builder)) {
        return builder.map(unwrap).flat();
    }
    return builder; // null, undefined или уже готовый vNode
}

/**
 * Создает DOM-дерево с нуля на основе vNode.
 * Теперь он всегда получает на вход ТОЛЬКО объекты vNode или null.
 */
function mount(vNode) {
    if (!vNode) {
        return document.createComment('empty vNode');
    }

    // --- Логика стала проще, так как мы больше не ожидаем сырых строк ---
    const { type, props = {}, children = [] } = vNode;
    let el;

    if (type === 'text') {
        el = document.createTextNode(children[0] || '');
    } else if (type === 'Fragment') {
        const fragment = document.createDocumentFragment();
        vNode.children.forEach(child => {
            fragment.appendChild(mount(unwrap(child)));
        });
        vNode.el = fragment;
        return fragment;
    } else if (type === 'HybridComponent') {
        el = mountHybrid(vNode);
    } else {
        el = document.createElement(props.tag || 'div');
        patchProps(el, {}, props);
        const unwrappedChildren = unwrap(children);
        for (const child of unwrappedChildren) {
            el.appendChild(mount(child));
        }
    }

    vNode.el = el;
    if (props.onMount) {
        props.onMount(el);
    }
    return el;
}

// ... mountHybrid не меняется ...
function mountHybrid(vNode) {
    const { props } = vNode;
    const { innerHTML, inlineStyle, replacements, listeners, componentName } = props;
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
    const rootHybridEl = tempContainer.firstElementChild;
    if (rootHybridEl) {
        for (const selector in listeners) {
            const targetElement = rootHybridEl.querySelector(selector);
            if (targetElement) {
                for (const event in listeners[selector]) {
                    targetElement.addEventListener(event, listeners[selector][event]);
                }
            }
        }
        return rootHybridEl;
    }
    return document.createComment(`hybrid-placeholder-${componentName}`);
}

/**
 * Сравнивает два vNode и точечно обновляет DOM.
 * Теперь он всегда получает на вход ТОЛЬКО объекты vNode или null.
 */
function patch(n1, n2) {
    if (!n1 || !n2 || n1.type !== n2.type || (n1.props?.tag !== n2.props?.tag)) {
        const parent = n1.el.parentNode;
        parent.replaceChild(mount(n2), n1.el);
        return;
    }

    if (n1.type === 'Fragment') {
        patchChildren(n1.el.parentNode, n1.children, n2.children, n1.el.nextSibling);
        n2.el = n1.el;
        return;
    }

    const el = n2.el = n1.el;

    // --- Логика сравнения текста стала безопасной и простой ---
    if (n1.type === 'text') {
        if (n1.children[0] !== n2.children[0]) {
            el.textContent = n2.children[0];
        }
        return;
    }

    if (n1.type === 'HybridComponent') {
        if (JSON.stringify(n1.props) !== JSON.stringify(n2.props)) {
            const parent = el.parentNode;
            parent.replaceChild(mount(n2), el);
        }
        return;
    }

    patchProps(el, n1.props || {}, n2.props || {});
    patchChildren(el, n1.children || [], n2.children || []);
}

// ... остальная часть файла (patchProps, patchChildren, render) НЕ МЕНЯЕТСЯ ...
function patchProps(el, oldProps, newProps) {
    for (const key in newProps) {
        if (key !== 'children' && newProps[key] !== oldProps[key]) {
            if (key.startsWith('on')) {
                const eventName = key.substring(2).toLowerCase();
                if (oldProps[key]) el.removeEventListener(eventName, oldProps[key]);
                el.addEventListener(eventName, newProps[key]);
            } else if (key === 'style') {
                for(const styleKey in newProps[key]) { el.style[styleKey] = newProps[key][styleKey]; }
                for(const styleKey in oldProps[key]) { if(!(styleKey in newProps[key])) { el.style[styleKey] = ''; }}
            } else if (key === 'value' || key === 'checked') {
                el[key] = newProps[key];
            } else if (key !== 'tag' && key !== 'key') {
                el.setAttribute(key, newProps[key]);
            }
        }
    }
    for (const key in oldProps) {
        if (!(key in newProps) && key !== 'children' && key !== 'key') {
            if (key.startsWith('on')) {
                el.removeEventListener(key.substring(2).toLowerCase(), oldProps[key]);
            } else if (key !== 'style' && key !== 'tag') {
                el.removeAttribute(key);
            }
        }
    }
}

function patchChildren(container, oldCh, newCh, anchor) {
    const oldChildren = unwrap(oldCh).flat();
    const newChildren = unwrap(newCh).flat();

    let oldStartIdx = 0, newStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1, newEndIdx = newChildren.length - 1;
    let oldStartVNode = oldChildren[0], newStartVNode = newChildren[0];
    let oldEndVNode = oldChildren[oldEndIdx], newEndVNode = newChildren[newEndIdx];
    let oldKeyToIdx;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (!oldStartVNode) {
            oldStartVNode = oldChildren[++oldStartIdx];
        } else if (!oldEndVNode) {
            oldEndVNode = oldChildren[--oldEndIdx];
        } else if (isSameVNodeType(oldStartVNode, newStartVNode)) {
            patch(oldStartVNode, newStartVNode);
            oldStartVNode = oldChildren[++oldStartIdx];
            newStartVNode = newChildren[++newStartIdx];
        } else if (isSameVNodeType(oldEndVNode, newEndVNode)) {
            patch(oldEndVNode, newEndVNode);
            oldEndVNode = oldChildren[--oldEndIdx];
            newEndVNode = newChildren[--newEndIdx];
        } else if (isSameVNodeType(oldStartVNode, newEndVNode)) {
            patch(oldStartVNode, newEndVNode);
            container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling);
            oldStartVNode = oldChildren[++oldStartIdx];
            newEndVNode = newChildren[--newEndIdx];
        } else if (isSameVNodeType(oldEndVNode, newStartVNode)) {
            patch(oldEndVNode, newStartVNode);
            container.insertBefore(oldEndVNode.el, oldStartVNode.el);
            oldEndVNode = oldChildren[--oldEndIdx];
            newStartVNode = newChildren[++newStartIdx];
        } else {
            if (!oldKeyToIdx) oldKeyToIdx = createKeyToOldIdx(oldChildren, oldStartIdx, oldEndIdx);
            const idxInOld = newStartVNode && newStartVNode.props ? oldKeyToIdx[newStartVNode.props.key] : null;
            if (idxInOld == null) {
                container.insertBefore(mount(newStartVNode), oldStartVNode ? oldStartVNode.el : anchor);
            } else {
                const vnodeToMove = oldChildren[idxInOld];
                patch(vnodeToMove, newStartVNode);
                oldChildren[idxInOld] = undefined;
                container.insertBefore(vnodeToMove.el, oldStartVNode.el);
            }
            newStartVNode = newChildren[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) {
        const refEl = newEndIdx + 1 < newChildren.length ? newChildren[newEndIdx + 1].el : anchor;
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            container.insertBefore(mount(newChildren[i]), refEl);
        }
    } else if (newStartIdx > newEndIdx) {
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
            if (oldChildren[i] && oldChildren[i].el) container.removeChild(oldChildren[i].el);
        }
    }
}

function isSameVNodeType(n1, n2) {
    if (!n1 || !n2) return false;
    return n1.type === n2.type && (n1.props?.key === n2.props?.key);
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
    const map = {};
    for (let i = beginIdx; i <= endIdx; i++) {
        const child = children[i];
        if (child && typeof child === 'object') {
            const key = child.props?.key;
            if (key != null) map[key] = i;
        }
    }
    return map;
}

function render(viewFn, state, targetElement) {
    let oldVNode = null;
    createEffect(() => {
        const newVNode = unwrap(viewFn(state));
        if (!oldVNode) {
            targetElement.innerHTML = '';
            targetElement.appendChild(mount(newVNode));
        } else {
            patch(oldVNode, newVNode);
        }
        oldVNode = newVNode;
    });
}

module.exports = { render };
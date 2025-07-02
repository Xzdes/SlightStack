// Файл: core/renderer.js (ПОСЛЕДНЯЯ, ОКОНЧАТЕЛЬНАЯ, ПОБЕДНАЯ ВЕРСИЯ)

const { createEffect } = require('./reactive');

// --- 1. Нормализация ---

function createTextVNode(text) {
    return { type: 'text', props: {}, children: [String(text)] };
}

function normalize(node) {
    if (node == null || node === false) return null;
    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
        return createTextVNode(node);
    }
    if (typeof node.toJSON === 'function') {
        return normalize(node.toJSON());
    }
    if (Array.isArray(node)) {
        return { type: 'Fragment', props: {}, children: node.map(normalize).flat().filter(Boolean) };
    }
    if (node.children) {
        const normalizedChildren = normalize(node.children);
        node.children = normalizedChildren ? (normalizedChildren.children || []) : [];
    }
    return node;
}

// --- 2. Монтирование, Размонтирование ---

function unmount(vNode) {
    if (vNode.type === 'Fragment') {
        vNode.children.forEach(unmount);
        // Удаляем якоря фрагмента
        vNode.el.parentNode.removeChild(vNode.el);
        vNode.endAnchor.parentNode.removeChild(vNode.endAnchor);
        return;
    }
    if (vNode.props && vNode.props.onUnmount) {
        vNode.props.onUnmount(vNode.el);
    }
    const parent = vNode.el.parentNode;
    if (parent) parent.removeChild(vNode.el);
}

function mount(vNode, container) {
    if (!vNode) return;

    const { type, props = {}, children = [] } = vNode;
    let el;

    if (type === 'Fragment') {
        el = document.createComment('fragment-start');
        vNode.el = el;
        container.appendChild(el);
        const endAnchor = document.createComment('fragment-end');
        vNode.endAnchor = endAnchor;
        children.forEach(child => mount(child, container));
        container.appendChild(endAnchor);
        return;
    }
    if (type === 'text') {
        el = document.createTextNode(children[0] || '');
    } else if (type === 'HybridComponent') {
        el = mountHybrid(vNode);
    } else {
        el = document.createElement(props.tag || 'div');
        children.forEach(child => mount(child, el));
    }

    vNode.el = el;
    patchProps(el, {}, props);
    if (container) container.appendChild(el);
    if (props.onMount) props.onMount(el);
}

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

// --- 3. Сравнение и обновление ---

function patch(n1, n2) {
    if (n1.type !== n2.type || (n1.props?.tag !== n2.props?.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    const el = n2.el = n1.el;

    if (n1.type === 'Fragment') {
        n2.endAnchor = n1.endAnchor;
        patchChildren(el.parentNode, n1.children, n2.children, n1.endAnchor);
        return;
    }
    if (n1.type === 'text') {
        if (n1.children[0] !== n2.children[0]) el.textContent = n2.children[0];
        return;
    }
    if (n1.type === 'HybridComponent') {
        if (JSON.stringify(n1.props) !== JSON.stringify(n2.props)) {
            const parent = el.parentNode;
            unmount(n1);
            mount(n2, parent);
        }
        return;
    }

    patchProps(el, n1.props || {}, n2.props || {});
    patchChildren(el, n1.children, n2.children);
}

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
    let oldStartIdx = 0, newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1, newEndIdx = newCh.length - 1;
    let oldStartVNode = oldCh[0], newStartVNode = newCh[0];
    let oldEndVNode = oldCh[oldEndIdx], newEndVNode = newCh[newEndIdx];
    let oldKeyToIdx;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (oldStartVNode == null) oldStartVNode = oldCh[++oldStartIdx];
        else if (oldEndVNode == null) oldEndVNode = oldCh[--oldEndIdx];
        else if (newStartVNode == null) newStartVNode = newCh[++newStartIdx];
        else if (newEndVNode == null) newEndVNode = newCh[--newEndIdx];
        else if (isSameVNodeType(oldStartVNode, newStartVNode)) {
            patch(oldStartVNode, newStartVNode);
            oldStartVNode = oldCh[++oldStartIdx];
            newStartVNode = newCh[++newStartIdx];
        } else if (isSameVNodeType(oldEndVNode, newEndVNode)) {
            patch(oldEndVNode, newEndVNode);
            oldEndVNode = oldCh[--oldEndIdx];
            newEndVNode = newCh[--newEndIdx];
        } else if (isSameVNodeType(oldStartVNode, newEndVNode)) {
            patch(oldStartVNode, newEndVNode);
            container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling);
            oldStartVNode = oldCh[++oldStartIdx];
            newEndVNode = newCh[--newEndIdx];
        } else if (isSameVNodeType(oldEndVNode, newStartVNode)) {
            patch(oldEndVNode, newStartVNode);
            container.insertBefore(oldEndVNode.el, oldStartVNode.el);
            oldEndVNode = oldCh[--oldEndIdx];
            newStartVNode = newCh[++newStartIdx];
        } else {
            if (!oldKeyToIdx) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
            const idxInOld = newStartVNode.props ? oldKeyToIdx[newStartVNode.props.key] : null;
            if (idxInOld == null) {
                mount(newStartVNode, container);
                container.insertBefore(newStartVNode.el, oldStartVNode ? oldStartVNode.el : anchor);
            } else {
                const vnodeToMove = oldCh[idxInOld];
                patch(vnodeToMove, newStartVNode);
                oldCh[idxInOld] = undefined;
                container.insertBefore(vnodeToMove.el, oldStartVNode.el);
            }
            newStartVNode = newCh[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) {
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            if(newCh[i]) {
                mount(newCh[i], container);
                container.insertBefore(newCh[i].el, anchor);
            }
        }
    } else if (newStartIdx > newEndIdx) {
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
            if (oldCh[i]) unmount(oldCh[i]);
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
        if (child) {
            const key = child.props?.key;
            if (key != null) map[key] = i;
        }
    }
    return map;
}

// --- 4. Точка входа ---
function render(viewFn, state, targetElement) {
    let oldVNode = null;
    createEffect(() => {
        const newVNode = normalize(viewFn(state));
        if (!oldVNode) {
            targetElement.innerHTML = '';
            mount(newVNode, targetElement);
        } else {
            patch(oldVNode, newVNode);
        }
        oldVNode = newVNode;
    });
}

module.exports = { render };
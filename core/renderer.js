// Файл: core/renderer.js

const { createEffect } = require('./reactive');
const { normalize } = require('./vdom');

// --- 1. Жизненный цикл: Монтирование, Обновление, Размонтирование ---

function mount(vNode, container) {
    if (!vNode) return;

    const { type, props = {}, children = [] } = vNode;
    let el;

    if (type === 'Fragment') {
        children.forEach(child => mount(child, container));
        vNode.el = container;
        return;
    } 
    if (type === 'text') {
        // ИЗМЕНЕНИЕ: Текст теперь хранится напрямую в `children` как строка.
        el = document.createTextNode(vNode.children || '');
    } else if (type === 'HybridComponent') {
        el = mountHybrid(vNode);
    } else {
        el = document.createElement(props.tag || 'div');
        children.forEach(child => mount(child, el));
    }
    
    vNode.el = el;
    if (props.ref) props.ref.current = el;
    patchProps(el, {}, props);
    if (container) container.appendChild(el);
    if (props.onMount) props.onMount(el);
}

function unmount(vNode) {
    if (!vNode) return;
    if (vNode.props && vNode.props.onUnmount) vNode.props.onUnmount(vNode.el);
    if (vNode.props && vNode.props.ref) vNode.props.ref.current = null;
    if (vNode.type === 'Fragment') {
        vNode.children.forEach(unmount);
        return;
    }
    const parent = vNode.el.parentNode;
    if (parent) parent.removeChild(vNode.el);
}

function patch(n1, n2) {
    if (n1.type !== n2.type || (n1.props?.tag !== n2.props?.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    const el = (n2.el = n1.el);

    if (n1.type === 'Fragment') {
        patchChildren(el, n1.children, n2.children);
        return;
    }
    if (n1.type === 'text') {
        // ИЗМЕНЕНИЕ: Сравниваем и обновляем текст напрямую.
        if (n1.children !== n2.children) {
            el.textContent = n2.children;
        }
        return;
    }
    if (n1.type === 'HybridComponent') {
        if (JSON.stringify(n1.props) !== JSON.stringify(n2.props)) {
            const parent = el.parentNode; unmount(n1); mount(n2, parent);
        }
        return;
    }
    
    patchProps(el, n1.props || {}, n2.props || {});
    patchChildren(el, n1.children, n2.children);
}

// --- 2. Вспомогательные функции для обновления ---

function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) return;
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in newProps) {
        if (key === 'children' || key === 'key' || key === 'ref') continue;
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        if (newValue !== oldValue) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (oldValue) el.removeEventListener(eventName, oldValue);
                el.addEventListener(eventName, newValue);
            } else if (key === 'style') {
                for (const styleKey in newValue) { el.style[styleKey] = newValue[styleKey]; }
                for (const styleKey in oldValue) { if (!(styleKey in newValue)) { el.style[styleKey] = ''; } }
            } else if (key === 'value' || key === 'checked') {
                if (el[key] !== newValue) el[key] = newValue;
            } else if (key !== 'tag') {
                if (newValue == null || newValue === false) el.removeAttribute(key);
                else el.setAttribute(key, newValue);
            }
        }
    }
    for (const key in oldProps) {
        if (key === 'children' || key === 'key' || key === 'ref' || key in newProps) continue;
        if (key.startsWith('on')) el.removeEventListener(key.slice(2).toLowerCase(), oldProps[key]);
        else if (key !== 'tag') el.removeAttribute(key);
    }
}

function patchChildren(container, oldCh, newCh) {
    let oldStartIdx = 0, newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1, newEndIdx = newCh.length - 1;
    let oldStartVNode = oldCh[0], newStartVNode = newCh[0];
    let oldEndVNode = oldCh[oldEndIdx], newEndVNode = newCh[newEndIdx];
    let keyToOldIdx;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (!oldStartVNode) oldStartVNode = oldCh[++oldStartIdx];
        else if (!oldEndVNode) oldEndVNode = oldCh[--oldEndIdx];
        else if (isSameVNodeType(oldStartVNode, newStartVNode)) {
            patch(oldStartVNode, newStartVNode); oldStartVNode = oldCh[++oldStartIdx]; newStartVNode = newCh[++newStartIdx];
        } else if (isSameVNodeType(oldEndVNode, newEndVNode)) {
            patch(oldEndVNode, newEndVNode); oldEndVNode = oldCh[--oldEndIdx]; newEndVNode = newCh[--newEndIdx];
        } else if (isSameVNodeType(oldStartVNode, newEndVNode)) {
            patch(oldStartVNode, newEndVNode); container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling); oldStartVNode = oldCh[++oldStartIdx]; newEndVNode = newCh[--newEndIdx];
        } else if (isSameVNodeType(oldEndVNode, newStartVNode)) {
            patch(oldEndVNode, newStartVNode); container.insertBefore(oldEndVNode.el, oldStartVNode.el); oldEndVNode = oldCh[--oldEndIdx]; newStartVNode = newCh[++newStartIdx];
        } else {
            if (!keyToOldIdx) keyToOldIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
            const idxInOld = newStartVNode.props?.key ? keyToOldIdx[newStartVNode.props.key] : null;
            if (newStartVNode.props?.key === undefined) console.warn('[SlightUI] Элемент в списке без "key".', newStartVNode);
            if (idxInOld == null) {
                mount(newStartVNode, container);
                container.insertBefore(newStartVNode.el, oldStartVNode ? oldStartVNode.el : null);
            } else {
                const vnodeToMove = oldCh[idxInOld];
                patch(vnodeToMove, newStartVNode); oldCh[idxInOld] = undefined;
                container.insertBefore(vnodeToMove.el, oldStartVNode.el);
            }
            newStartVNode = newCh[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) {
        const anchor = newCh[newEndIdx + 1] ? newCh[newEndIdx + 1].el : null;
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            mount(newCh[i], container); container.insertBefore(newCh[i].el, anchor);
        }
    } else if (newStartIdx > newEndIdx) {
        for (let i = oldStartIdx; i <= oldEndIdx; i++) if (oldCh[i]) unmount(oldCh[i]);
    }
}

function isSameVNodeType(n1, n2) { return n1.type === n2.type && n1.props?.key === n2.props?.key; }
function createKeyToOldIdx(children, beginIdx, endIdx) { const map = {}; for (let i = beginIdx; i <= endIdx; i++) { const child = children[i]; if (child && child.props && child.props.key != null) map[child.props.key] = i; } return map; }
function mountHybrid(vNode) { const { props } = vNode; const { innerHTML, inlineStyle, replacements, listeners, componentName } = props; const styleId = `hybrid-style-${componentName}`; if (inlineStyle && !document.getElementById(styleId)) { const styleEl = document.createElement('style'); styleEl.id = styleId; styleEl.textContent = inlineStyle; document.head.appendChild(styleEl); } const tempContainer = document.createElement('div'); let finalHTML = innerHTML || ''; if (replacements) { for (const placeholder in replacements) { finalHTML = finalHTML.replace(new RegExp(placeholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), String(replacements[placeholder])); } } tempContainer.innerHTML = finalHTML; const rootHybridEl = tempContainer.firstElementChild; if (rootHybridEl && listeners) { for (const selector in listeners) { const targetElement = selector === 'root' ? rootHybridEl : rootHybridEl.querySelector(selector); if (targetElement) { for (const event in listeners[selector]) targetElement.addEventListener(event, listeners[selector][event]); } } } return rootHybridEl || document.createComment(`hybrid-placeholder-${componentName}`); }


// --- 3. Точка входа в рендерер ---

function render(viewFn, targetElement) {
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
}

module.exports = { render };
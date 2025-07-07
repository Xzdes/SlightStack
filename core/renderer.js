// Файл: core/renderer.js (CommonJS, финальная версия)

const { createDOMElement, applyProps } = require('./dom.js');
const { normalize } = require('./normalize.js');

function mount(vNode, container) {
    if (!vNode) return;
    const el = createDOMElement(vNode);
    vNode.el = el;
    applyProps(el, {}, vNode.props);
    if (vNode.type === 'HybridComponent' && vNode.props.listeners) { for (const selector in vNode.props.listeners) { const elements = selector === 'root' ? [el] : el.querySelectorAll(selector); elements.forEach(targetEl => { for (const eventName in vNode.props.listeners[selector]) { const handler = vNode.props.listeners[selector][eventName]; targetEl.addEventListener(eventName, handler); } }); } }
    if (el.nodeType === 1 || el.nodeType === 11) { // 11 - DocumentFragment
        const children = vNode.type === 'HybridComponent' ? vNode.props.children : vNode.children;
        if (children && children.length > 0) {
            // Если монтируем фрагмент, его дети монтируются в родительский контейнер
            const mountContainer = vNode.type === 'Fragment' ? container : (el.querySelector('[data-slight-slot]') || el);
            children.forEach(child => mount(child, mountContainer));
        }
    }
    // Сам узел фрагмента не добавляем в DOM, только его детей
    if (container && vNode.type !== 'Fragment') container.appendChild(el);
    if (vNode.props?.ref) vNode.props.ref.current = el;
    if (vNode.props?.onMount) vNode.props.onMount(el);
}

function unmount(vNode) {
    if (!vNode) return;
    if (vNode.type === 'Fragment') {
        vNode.children.forEach(unmount);
        return;
    }
    if (vNode.props?.onUnmount) vNode.props.onUnmount(vNode.el);
    if (vNode.props?.ref) vNode.props.ref.current = null;
    const parent = vNode.el.parentNode;
    if (parent) parent.removeChild(vNode.el);
}

function patch(n1, n2) {
    if (!n1 || !n2) return;
    if (n1.type !== n2.type || (n1.props.tag && n1.props.tag !== n2.props.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    if (n1.type === 'Fragment') {
        // У фрагмента нет своего DOM-элемента, поэтому мы передаем родительский контейнер
        // Первого ребенка фрагмента, чтобы знать, где сравнивать детей
        const container = n1.children[0]?.el.parentNode;
        if (container) {
            patchChildren(container, n1.children, n2.children);
        }
        return;
    }

    const el = (n2.el = n1.el);
    if (n1.type === 'HybridComponent' && JSON.stringify(n1.props.replacements) !== JSON.stringify(n2.props.replacements)) {
        const parent = n1.el.parentNode; unmount(n1); mount(n2, parent); return;
    }
    applyProps(el, n1.props, n2.props);
    if (n1.props.tag) {
        const oldText = n1.children[0] ? n1.children[0].children : '';
        const newText = n2.children[0] ? n2.children[0].children : '';
        if (oldText !== newText) el.textContent = newText;
    } else if (n1.type === 'HybridComponent') {
        const container = el.querySelector('[data-slight-slot]') || el;
        patchChildren(container, n1.props.children, n2.props.children);
    }
}

function patchChildren(container, oldCh, newCh) {
    let oldStartIdx = 0, newStartIdx = 0; let oldEndIdx = oldCh.length - 1, newEndIdx = newCh.length - 1; let oldStartVNode = oldCh[0], newStartVNode = newCh[0]; let oldEndVNode = oldCh[oldEndIdx], newEndVNode = newCh[newEndIdx]; let keyToOldIdx;
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (!oldStartVNode) oldStartVNode = oldCh[++oldStartIdx]; else if (!oldEndVNode) oldEndVNode = oldCh[--oldEndIdx]; else if (isSameVNodeType(oldStartVNode, newStartVNode)) { patch(oldStartVNode, newStartVNode); oldStartVNode = oldCh[++oldStartIdx]; newStartVNode = newCh[++newStartIdx]; } else if (isSameVNodeType(oldEndVNode, newEndVNode)) { patch(oldEndVNode, newEndVNode); oldEndVNode = oldCh[--oldEndIdx]; newEndVNode = newCh[--newEndIdx]; } else if (isSameVNodeType(oldStartVNode, newEndVNode)) { patch(oldStartVNode, newEndVNode); container.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling); oldStartVNode = oldCh[++oldStartIdx]; newEndVNode = newCh[--newEndIdx]; } else if (isSameVNodeType(oldEndVNode, newStartVNode)) { patch(oldEndVNode, newStartVNode); container.insertBefore(oldEndVNode.el, oldStartVNode.el); oldEndVNode = oldCh[--oldEndIdx]; newStartVNode = newCh[++newStartIdx]; } else {
            if (!keyToOldIdx) keyToOldIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
            const idxInOld = newStartVNode.props?.key ? keyToOldIdx[newStartVNode.props.key] : null;
            if (newStartVNode.props?.key === undefined) console.warn('[SlightUI] Элемент в списке без "key".', newStartVNode);
            if (idxInOld == null) { mount(newStartVNode, container); container.insertBefore(newStartVNode.el, oldStartVNode ? oldStartVNode.el : null); } else { const vnodeToMove = oldCh[idxInOld]; if (vnodeToMove) { patch(vnodeToMove, newStartVNode); oldCh[idxInOld] = undefined; container.insertBefore(vnodeToMove.el, oldStartVNode.el); } }
            newStartVNode = newCh[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) { const anchor = newCh[newEndIdx + 1] ? newCh[newEndIdx + 1].el : null; for (let i = newStartIdx; i <= newEndIdx; i++) { mount(newCh[i], container); container.insertBefore(newCh[i].el, anchor); } } else if (newStartIdx > newEndIdx) { for (let i = oldStartIdx; i <= oldEndIdx; i++) if (oldCh[i]) unmount(oldCh[i]); }
}

function isSameVNodeType(n1, n2) { return n1 && n2 && n1.type === n2.type && n1.props?.key === n2.props?.key; }
function createKeyToOldIdx(children, beginIdx, endIdx) { const map = {}; for (let i = beginIdx; i <= endIdx; i++) { const child = children[i]; if (child && child.props && child.props.key != null) map[child.props.key] = i; } return map; }
function createRender(createEffect) { return function render(viewFn, targetElement) { let oldVNode = null; createEffect(() => { const newVNode = normalize(viewFn()); if (!oldVNode) { targetElement.innerHTML = ''; mount(newVNode, targetElement); } else { patch(oldVNode, newVNode); } oldVNode = newVNode; }); }; }

module.exports = { createRender };
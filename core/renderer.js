// Файл: core/renderer.js (Версия 4.1 - Финальные исправления)

const tracker = require('./tracker');
const { createReactive } = require('./reactive');

// --- Утилиты для обновления DOM ---
function setProp(el, key, value) {
    // Хуки жизненного цикла и обработчики событий - это свойства, а не атрибуты
    if (key.startsWith('on')) {
        const eventName = key.substring(2).toLowerCase();
        el.addEventListener(eventName, value);
    } else if (key === 'style') {
        Object.assign(el.style, value);
    } else if (key === 'value' || key === 'checked') {
        el[key] = value;
    } 
    // `children` и `key` - это служебные пропсы, их не нужно рендерить как атрибуты
    else if (key !== 'children' && key !== 'key' && key !== 'tag') {
        el.setAttribute(key, value);
    }
}

function removeProp(el, key, value) {
    if (key.startsWith('on')) {
        const eventName = key.substring(2).toLowerCase();
        el.removeEventListener(eventName, value);
    } else {
        el.removeAttribute(key);
    }
}

function updateProps(el, newProps, oldProps = {}) {
    const props = { ...oldProps, ...newProps };
    for (const key in props) {
        if (newProps[key] !== oldProps[key]) {
            if (newProps[key] === undefined) {
                removeProp(el, key, oldProps[key]);
            } else {
                setProp(el, key, newProps[key]);
            }
        }
    }
}

// --- Утилиты для создания и удаления узлов ---
function mount(vNode) {
    if (vNode === null || vNode === undefined) return document.createComment('placeholder');
    if (typeof vNode !== 'object') return document.createTextNode(String(vNode));

    const el = document.createElement(vNode.props.tag || 'div');
    vNode.el = el; // Сохраняем ссылку на реальный узел
    updateProps(el, vNode.props);
    (vNode.props.children || []).forEach(child => el.appendChild(mount(child)));

    // Вызываем хук после того, как все дети смонтированы
    if (vNode.props.onMount) vNode.props.onMount(el);
    return el;
}

function unmount(vNode) {
    if (!vNode || typeof vNode !== 'object') return;
    // Вызываем хук перед удалением
    if (vNode.props?.onUnmount) vNode.props.onUnmount(vNode.el);
    (vNode.props.children || []).forEach(unmount);
}

// --- Главный алгоритм Patch ---
function patch(parentEl, newChildren, oldChildren) {
    const oldKeyedChildren = new Map();
    (oldChildren || []).forEach(child => {
        if (child?.props?.key) oldKeyedChildren.set(child.props.key, child);
    });
    
    let lastPlacedNode = null;

    (newChildren || []).forEach((newChild, i) => {
        const key = newChild?.props?.key;
        const oldChild = oldKeyedChildren.get(key);

        if (oldChild) {
            patchNode(oldChild, newChild);
            oldKeyedChildren.delete(key);
            if (parentEl.childNodes[i] !== oldChild.el) {
                parentEl.insertBefore(oldChild.el, parentEl.childNodes[i]);
            }
        } else {
            const elToInsertBefore = parentEl.childNodes[i] || null;
            parentEl.insertBefore(mount(newChild), elToInsertBefore);
        }
    });

    oldKeyedChildren.forEach(oldChild => {
        unmount(oldChild);
        parentEl.removeChild(oldChild.el);
    });
    
     // Простая очистка для неключевых списков, если они остались
    while (parentEl.childNodes.length > newChildren.length) {
        unmount({ props: {} }); // Приблизительно
        parentEl.removeChild(parentEl.lastChild);
    }
}


function patchNode(oldVNode, newVNode) {
    const el = newVNode.el = oldVNode.el;
    
    if (newVNode.type !== oldVNode.type) {
        parentEl.replaceChild(mount(newVNode), el);
        unmount(oldVNode);
        return;
    }

    if (typeof newVNode !== 'object') {
        if (el.textContent !== String(newVNode)) el.textContent = String(newVNode);
        return;
    }
    
    updateProps(el, newVNode.props, oldVNode.props);
    
    const newChildren = newVNode.props.children || [];
    const oldChildren = oldVNode.props.children || [];

    if (newChildren.length > 0 || oldChildren.length > 0) {
        patch(el, newChildren, oldChildren);
    }
}

function render(viewFn, initialState, targetElement) {
    const depMap = new Map();
    const state = createReactive(initialState, depMap);
    let oldVDom = null;
    let isUpdating = false;

    const update = () => {
        if (isUpdating) return;
        isUpdating = true;
        
        const activeElementId = document.activeElement?.id;
        
        tracker.startTracking(update);
        const newVDom = viewFn(state);
        tracker.stopTracking();

        if (oldVDom === null) {
            targetElement.innerHTML = '';
            targetElement.appendChild(mount(newVDom));
        } else {
            patchNode(oldVDom, newVDom);
        }
        oldVDom = newVDom;
        
        if (activeElementId) {
            document.getElementById(activeElementId)?.focus();
        }
        
        isUpdating = false;
    };
    update();
}

module.exports = { render, createReactive };
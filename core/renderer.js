// Файл: core/renderer.js (CommonJS, финальная исправленная версия)

const { createDOMElement, applyProps } = require('./dom.js');
const { normalize } = require('./normalize.js');
const { attachInteractiveState, stateContainer } = require('./state-manager.js');
const { resolveProps } = require('./props-resolver.js');

function mount(vNode, container) {
    if (!vNode) return;
    const el = createDOMElement(vNode);
    vNode.el = el;

    applyProps(el, vNode, {}); 
    attachInteractiveState(vNode);
    
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
    
    if (el.nodeType === 1 || el.nodeType === 11) {
        const children = vNode.resolvedProps?.children || vNode.children;
        if (children && children.length > 0) {
            const mountContainer = vNode.type === 'Fragment' ? container : (el.querySelector('[data-slight-slot]') || el);
            children.forEach(child => mount(child, mountContainer));
        }
    }
    if (container && vNode.type !== 'Fragment') container.appendChild(el);
    if (vNode.props?.ref) vNode.props.ref.current = el;
}

function unmount(vNode) {
    if (!vNode) return;
    if (vNode.type === 'Fragment') {
        vNode.children.forEach(unmount);
        return;
    }
    if (vNode.props?.ref) vNode.props.ref.current = null;
    const parent = vNode.el.parentNode;
    if (parent) parent.removeChild(vNode.el);
}

function shallowEqual(objA, objB) {
    if (objA === objB) return true;
    if (!objA || !objB) return false;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (typeof objA[key] === 'function' || key === 'children' || key === 'model') continue;
        if (objA[key] !== objB[key]) {
            if (key === 'style') {
                try {
                    if (JSON.stringify(objA[key]) !== JSON.stringify(objB[key])) return false;
                } catch (e) { return false; }
            } else { return false; }
        }
    }
    return true;
}

function patch(n1, n2) {
    if (!n1 || !n2) return;
    
    // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
    // Если типы узлов не совпадают, мы должны их полностью заменить.
    if (n1.type !== n2.type || (n1.props?.tag && n1.props.tag !== n2.props.tag)) {
        // Находим родительский DOM-узел, даже для фрагментов.
        // Для обычного узла это n1.el.parentNode.
        // Для фрагмента это родитель его первого дочернего элемента.
        const parent = n1.type === 'Fragment' 
            ? n1.children[0]?.el?.parentNode
            : n1.el?.parentNode;

        if (parent) {
            unmount(n1);
            mount(n2, parent);
        } else {
             console.error('[SlightUI] Не удалось найти родительский узел для замены.', n1);
        }
        return;
    }
    
    // Если мы здесь, типы совпадают.
    // Обрабатываем фрагменты отдельно.
    if (n1.type === 'Fragment') {
        // У фрагмента нет своего `el`, поэтому мы не можем его передать.
        // Мы просто патчим его детей в их общем контейнере.
        const container = n1.children[0]?.el.parentNode;
        if (container) {
            patchChildren(container, n1.children, n2.children);
        }
        return; // Завершаем обработку для фрагментов
    }
    
    // Для всех остальных типов узлов (у которых есть `el`)
    const el = (n2.el = n1.el);

    if (n1._internal) {
        n2._internal = n1._internal;
        n2._internal.vnode = n2;
    }
    
    if (!shallowEqual(n1.resolvedProps, n2.resolvedProps)) {
        applyProps(el, n2, n1.resolvedProps);
    }
    
    const oldCh = n1.resolvedProps?.children || [];
    const newCh = n2.resolvedProps?.children || [];
    const container = el.querySelector('[data-slight-slot]') || el;

    if (container) {
        patchChildren(container, oldCh, newCh);
    }
}


function isSameVNodeType(n1, n2) {
    return n1 && n2 && n1.type === n2.type && n1.props?.key === n2.props?.key;
}

function patchChildren(container, c1, c2) {
    const oldLength = c1.length;
    const newLength = c2.length;
    let i = 0;

    while (i < oldLength && i < newLength) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2);
        } else {
            break;
        }
        i++;
    }

    let oldEnd = oldLength - 1;
    let newEnd = newLength - 1;
    while (oldEnd >= i && newEnd >= i) {
        const n1 = c1[oldEnd];
        const n2 = c2[newEnd];
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2);
        } else {
            break;
        }
        oldEnd--;
        newEnd--;
    }

    if (i > oldEnd && i <= newEnd) {
        const anchorIndex = newEnd + 1;
        const anchor = anchorIndex < c2.length ? c2[anchorIndex].el : null;
        while (i <= newEnd) {
            mount(c2[i], container);
            container.insertBefore(c2[i].el, anchor);
            i++;
        }
    }
    else if (i > newEnd && i <= oldEnd) {
        while (i <= oldEnd) {
            unmount(c1[i]);
            i++;
        }
    }
    else {
        const oldStartIndex = i;
        const newStartIndex = i;
        const keyToNewIndexMap = new Map();

        for (i = newStartIndex; i <= newEnd; i++) {
            const child = c2[i];
            if (child.props?.key != null) {
                keyToNewIndexMap.set(child.props.key, i);
            }
        }

        let patched = 0;
        const toBePatched = newEnd - newStartIndex + 1;
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

        for (i = oldStartIndex; i <= oldEnd; i++) {
            const prevChild = c1[i];
            if (patched >= toBePatched) {
                unmount(prevChild);
                continue;
            }

            let newIndex;
            if (prevChild.props?.key != null) {
                newIndex = keyToNewIndexMap.get(prevChild.props.key);
            } else {
                for (let j = newStartIndex; j <= newEnd; j++) {
                    if (newIndexToOldIndexMap[j - newStartIndex] === 0 && isSameVNodeType(prevChild, c2[j])) {
                        newIndex = j;
                        break;
                    }
                }
            }

            if (newIndex === undefined) {
                unmount(prevChild);
            } else {
                newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1;
                patch(prevChild, c2[newIndex]);
                patched++;
            }
        }
        
        const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let j = increasingNewIndexSequence.length - 1;
        for (i = toBePatched - 1; i >= 0; i--) {
            const newIndex = newStartIndex + i;
            const newChild = c2[newIndex];
            const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;

            if (newIndexToOldIndexMap[i] === 0) {
                mount(newChild, container);
                container.insertBefore(newChild.el, anchor);
            } else {
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    container.insertBefore(newChild.el, anchor);
                } else {
                    j--;
                }
            }
        }
    }
}

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}


function createRender(createEffect) { 
    return function render(viewFn, targetElement) { 
        let oldVNode = null; 
        createEffect(() => { 
            let newVNode = normalize(viewFn());
            
            function traverseAndResolve(vnode) {
                if (!vnode) return;
                
                if (!vnode._internal) vnode._internal = { vnode };

                const rawProps = { ...vnode.props };
                 if (rawProps.model && Array.isArray(rawProps.model)) {
                    const [stateObject, propertyName] = rawProps.model;
                    const isCheckbox = typeof stateObject[propertyName] === 'boolean';
                    if (isCheckbox) {
                        rawProps.type = 'checkbox'; rawProps.checked = stateObject[propertyName];
                        rawProps.onchange = e => stateObject[propertyName] = e.target.checked;
                    } else {
                        if (!rawProps.type) { rawProps.type = 'text'; }
                        rawProps.value = stateObject[propertyName];
                        rawProps.oninput = e => stateObject[propertyName] = e.target.value;
                    }
                }
                
                vnode.resolvedProps = resolveProps(rawProps, stateContainer, vnode._internal.state || {});

                const children = vnode.resolvedProps.children || vnode.children;
                if (children && children.length > 0) {
                    children.forEach(traverseAndResolve);
                }
            }

            traverseAndResolve(newVNode);
            
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

module.exports = { createRender };
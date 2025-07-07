// Файл: core/renderer.js (CommonJS, финальная исправленная версия)

const { createDOMElement, applyProps } = require('./dom.js');
const { normalize } = require('./normalize.js');
const { attachInteractiveState } = require('./state-manager.js');

function mount(vNode, container) {
    if (!vNode) return;
    const el = createDOMElement(vNode);
    vNode.el = el;

    applyProps(el, vNode);
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
        const children = vNode.type === 'HybridComponent' ? vNode.props.children : vNode.children;
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

function patch(n1, n2) {
    if (!n1 || !n2) return;
    if (n1.type !== n2.type || (n1.props.tag && n1.props.tag !== n2.props.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    const el = (n2.el = n1.el);

    if (n1._internal) {
        n2._internal = n1._internal;
        n2._internal.vnode = n2;
    }
    
    // Для гибридных компонентов, если HTML-шаблон изменился (очень редкий случай, но для полноты)
    if (n1.type === 'HybridComponent' && n1.props.innerHTML !== n2.props.innerHTML) {
        const parent = n1.el.parentNode; 
        unmount(n1); 
        mount(n2, parent); 
        return;
    }

    applyProps(el, n2);
    
    const oldCh = n1.type === 'HybridComponent' ? n1.props.children : n1.children;
    const newCh = n2.type === 'HybridComponent' ? n2.props.children : n2.children;
    const container = n1.type === 'Fragment' 
        ? n1.children[0]?.el.parentNode
        : (el.querySelector('[data-slight-slot]') || el);

    if (container) {
        patchChildren(container, oldCh || [], newCh || []);
    }
}


function isSameVNodeType(n1, n2) {
    return n1 && n2 && n1.type === n2.type && n1.props?.key === n2.props?.key;
}

// [ИЗМЕНЕНИЕ] Полностью переписанный и более надежный алгоритм patchChildren
function patchChildren(container, c1, c2) {
    const oldLength = c1.length;
    const newLength = c2.length;
    let i = 0;

    // 1. Синхронизация префикса (общих узлов в начале)
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

    // 2. Синхронизация суффикса (общих узлов в конце)
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

    // 3. Обработка середины
    // Если остались только новые узлы, добавляем их
    if (i > oldEnd && i <= newEnd) {
        const anchorIndex = newEnd + 1;
        const anchor = anchorIndex < c2.length ? c2[anchorIndex].el : null;
        while (i <= newEnd) {
            mount(c2[i], container);
            container.insertBefore(c2[i].el, anchor);
            i++;
        }
    }
    // Если остались только старые узлы, удаляем их
    else if (i > newEnd && i <= oldEnd) {
        while (i <= oldEnd) {
            unmount(c1[i]);
            i++;
        }
    }
    // Самый сложный случай: середина изменилась
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
                // Обработка узлов без ключей (менее эффективно)
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
        
        // Перемещаем и монтируем оставшиеся узлы
        // Используем алгоритм LIS (Longest Increasing Subsequence) для минимизации перемещений
        const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let j = increasingNewIndexSequence.length - 1;
        for (i = toBePatched - 1; i >= 0; i--) {
            const newIndex = newStartIndex + i;
            const newChild = c2[newIndex];
            const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;

            if (newIndexToOldIndexMap[i] === 0) {
                // Монтируем новый узел
                mount(newChild, container);
                container.insertBefore(newChild.el, anchor);
            } else {
                // Перемещаем, если узел не в LIS
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    container.insertBefore(newChild.el, anchor);
                } else {
                    j--;
                }
            }
        }
    }
}

// Хелпер для нахождения самой длинной возрастающей подпоследовательности (LIS)
// Это стандартный алгоритм, используемый во Vue для оптимизации перемещений
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

module.exports = { createRender };
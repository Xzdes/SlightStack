// Файл: core/renderer/patch.js

const { applyProps } = require('../dom/patching.js');
const { mount, unmount } = require('./mount.js');
const { isSameVNodeType, getSequence } = require('./utils.js');

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

function patchChildren(container, c1, c2, anchor) {
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
        const nextAnchor = newEnd + 1 < c2.length ? c2[newEnd + 1].el : anchor;
        while (i <= newEnd) {
            mount(c2[i], container, nextAnchor);
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
            const nextAnchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : anchor;

            if (newIndexToOldIndexMap[i] === 0) {
                mount(newChild, container, nextAnchor);
            } else {
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    container.insertBefore(newChild.el, nextAnchor);
                } else {
                    j--;
                }
            }
        }
    }
}


function patch(n1, n2) {
    if (n1 === n2) return;
    
    if (n1 && n2 && !isSameVNodeType(n1, n2)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    if (!n1 || !n2) return;

    // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
    if (n1.type === 'Fragment') {
        // Передаем якорь, чтобы он не потерялся
        n2.anchor = n1.anchor;
        // Находим родителя через якорь
        const container = n1.anchor?.parentNode;
        
        // ВАЖНО: Мы передаем "сырых" детей, как в вашей рабочей версии.
        // `normalize` внутри `createRender` уже обработал их, вызвал toJSON и подписал на зависимости.
        patchChildren(
            container, 
            n1.children, 
            n2.children,
            n1.anchor
        );
        return;
    }
    
    const el = (n2.el = n1.el);

    if (n1._internal) {
        n2._internal = n1._internal;
        n2._internal.vnode = n2;
    }
    
    // Используем `shallowEqual` для всех, КРОМЕ фрагментов
    if (!shallowEqual(n1.resolvedProps, n2.resolvedProps)) {
        applyProps(el, n2, n1.resolvedProps);
    }
    
    const oldCh = n1.resolvedProps?.children || [];
    const newCh = n2.resolvedProps?.children || [];
    const container = el.querySelector('[data-slight-slot]') || el;

    patchChildren(container, oldCh, newCh, null);
}

module.exports = { patch };
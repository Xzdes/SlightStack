// Файл: core/renderer.js

const { createEffect } = require('./reactive');
const { normalize } = require('./vdom');

// --- 1. Жизненный цикл: Монтирование, Обновление, Размонтирование ---

/**
 * Монтирует VNode в реальный DOM и вставляет его в родительский контейнер.
 * @param {object} vNode - Виртуальный узел, который нужно смонтировать.
 * @param {HTMLElement} container - Родительский DOM-элемент.
 */
function mount(vNode, container) {
    if (!vNode) return;

    const { type, props = {}, children = [] } = vNode;
    let el;

    // Создание DOM-элемента в зависимости от типа VNode
    if (type === 'Fragment') {
        // Фрагменты не имеют собственного DOM-элемента, их дети монтируются напрямую в контейнер.
        children.forEach(child => mount(child, container));
        vNode.el = container; // Ссылаемся на родителя для будущего patch'а
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
    
    // Сохраняем ссылку на реальный DOM-элемент внутри VNode. Это ключевая связь.
    vNode.el = el;
    
    // УЛУЧШЕНИЕ: Реализация системы ref
    if (props.ref) {
        props.ref.current = el;
    }

    // Применяем все свойства (атрибуты, стили, обработчики событий)
    patchProps(el, {}, props);

    // Вставляем созданный элемент в родительский контейнер
    if (container) {
        container.appendChild(el);
    }
    
    // Вызываем хук onMount, если он есть
    if (props.onMount) {
        props.onMount(el);
    }
}

/**
 * Размонтирует VNode, удаляя его из DOM и выполняя очистку.
 * @param {object} vNode - Виртуальный узел для размонтирования.
 */
function unmount(vNode) {
    if (!vNode) return;

    if (vNode.type === 'Fragment') {
        vNode.children.forEach(unmount);
        return;
    }
    
    // УЛУЧШЕНИЕ: Вызываем хук onUnmount перед удалением
    if (vNode.props && vNode.props.onUnmount) {
        vNode.props.onUnmount(vNode.el);
    }
    
    // УЛУЧШЕНИЕ: Очищаем ref
    if (vNode.props && vNode.props.ref) {
        vNode.props.ref.current = null;
    }

    const parent = vNode.el.parentNode;
    if (parent) {
        parent.removeChild(vNode.el);
    }
}

/**
 * Сравнивает два VNode (старый и новый) и применяет разницу к реальному DOM.
 * @param {object} n1 - Старый VNode.
 * @param {object} n2 - Новый VNode.
 */
function patch(n1, n2) {
    // Если типы узлов не совпадают, старый узел полностью размонтируется, а новый монтируется на его место.
    if (n1.type !== n2.type || (n1.props?.tag !== n2.props?.tag)) {
        const parent = n1.el.parentNode;
        unmount(n1);
        mount(n2, parent);
        return;
    }

    // Если типы совпадают, мы переиспользуем существующий DOM-элемент.
    const el = (n2.el = n1.el);

    if (n1.type === 'Fragment') {
        patchChildren(el, n1.children, n2.children);
        return;
    }
    if (n1.type === 'text') {
        if (n1.children[0] !== n2.children[0]) {
            el.textContent = n2.children[0];
        }
        return;
    }
    if (n1.type === 'HybridComponent') {
        // Гибридные компоненты пока обновляются "грубо" - полным перемонтированием,
        // так как их внутренняя структура может быть сложной.
        if (JSON.stringify(n1.props) !== JSON.stringify(n2.props)) {
            const parent = el.parentNode;
            unmount(n1);
            mount(n2, parent);
        }
        return;
    }
    
    // Обновляем свойства и сравниваем дочерние элементы.
    patchProps(el, n1.props || {}, n2.props || {});
    patchChildren(el, n1.children, n2.children);
}


// --- 2. Вспомогательные функции для обновления ---

/**
 * Обновляет свойства DOM-элемента.
 */
function patchProps(el, oldProps, newProps) {
    // Применяем новые и измененные свойства
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
                for (const styleKey in oldValue) { if (!(styleKey in newValue)) { el.style[styleKey] = ''; }}
            } else if (key === 'value' || key === 'checked') { // Для элементов форм
                if (el[key] !== newValue) {
                   el[key] = newValue;
                }
            } else if (key !== 'tag') {
                if (newValue == null || newValue === false) {
                    el.removeAttribute(key);
                } else {
                    el.setAttribute(key, newValue);
                }
            }
        }
    }
    // Удаляем старые свойства, которых нет в новых
    for (const key in oldProps) {
        if (key === 'children' || key === 'key' || key === 'ref') continue;
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                el.removeEventListener(key.slice(2).toLowerCase(), oldProps[key]);
            } else if (key !== 'tag') {
                el.removeAttribute(key);
            }
        }
    }
}

/**
 * Реализация "keyed" алгоритма сравнения дочерних элементов для высокой производительности.
 */
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
            if (!keyToOldIdx) keyToOldIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
            const idxInOld = newStartVNode.props?.key ? keyToOldIdx[newStartVNode.props.key] : null;
            
            // УЛУЧШЕНИЕ: Предупреждение об отсутствии ключа
            if (newStartVNode.props?.key === undefined) {
                console.warn('[SlightUI] Обнаружен элемент в списке без уникального "key". Это может привести к ошибкам рендеринга.', newStartVNode);
            }

            if (idxInOld == null) {
                mount(newStartVNode, container);
                container.insertBefore(newStartVNode.el, oldStartVNode.el);
            } else {
                const vnodeToMove = oldCh[idxInOld];
                patch(vnodeToMove, newStartVNode);
                oldCh[idxInOld] = undefined; // Помечаем как обработанный
                container.insertBefore(vnodeToMove.el, oldStartVNode.el);
            }
            newStartVNode = newCh[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) {
        const anchor = newCh[newEndIdx + 1] ? newCh[newEndIdx + 1].el : null;
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            mount(newCh[i], container);
            container.insertBefore(newCh[i].el, anchor);
        }
    } else if (newStartIdx > newEndIdx) {
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
            if (oldCh[i]) unmount(oldCh[i]);
        }
    }
}

function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.props?.key === n2.props?.key;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    const map = {};
    for (let i = beginIdx; i <= endIdx; i++) {
        const child = children[i];
        if (child && child.props && child.props.key != null) {
            map[child.props.key] = i;
        }
    }
    return map;
}

// --- 3. Вспомогательные функции для гибридных компонентов ---
// Файл: core/renderer.js (ТОЛЬКО ФУНКЦИЯ mountHybrid)
// ... остальной код рендерера без изменений ...

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
    
    // ИСПРАВЛЕНИЕ: Правильный цикл замены.
    if (replacements) {
        for (const placeholder in replacements) {
            // new RegExp(placeholder, 'g') создаст, например, /{{TEXT}}/g
            finalHTML = finalHTML.replace(new RegExp(placeholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), String(replacements[placeholder]));
        }
    }
    
    tempContainer.innerHTML = finalHTML;
    const rootHybridEl = tempContainer.firstElementChild;
    if (rootHybridEl && listeners) {
        for (const selector in listeners) {
            const targetElement = selector === 'root' ? rootHybridEl : rootHybridEl.querySelector(selector);
            if (targetElement) {
                for (const event in listeners[selector]) {
                    targetElement.addEventListener(event, listeners[selector][event]);
                }
            }
        }
    }
    return rootHybridEl || document.createComment(`hybrid-placeholder-${componentName}`);
}

// ... остальной код рендерера без изменений ...

// --- 4. Точка входа в рендерер ---

/**
 * Главная функция, которая запускает рендеринг приложения.
 * Она создает эффект, который будет автоматически перезапускаться при изменении состояния.
 * @param {Function} viewFn - Функция, возвращающая VDOM-дерево (например, AppView).
 * @param {HTMLElement} targetElement - Корневой DOM-элемент для монтирования.
 */
function render(viewFn, targetElement) {
    let oldVNode = null;

    createEffect(() => {
        // На каждом запуске эффекта мы заново строим виртуальное дерево
        const newVNode = normalize(viewFn());
        
        if (!oldVNode) {
            // Первоначальное монтирование
            targetElement.innerHTML = ''; // Очищаем контейнер на всякий случай
            mount(newVNode, targetElement);
        } else {
            // Последующие обновления
            patch(oldVNode, newVNode);
        }
        
        // Сохраняем новое дерево, чтобы оно стало "старым" при следующем обновлении
        oldVNode = newVNode;
    });
}

module.exports = { render };
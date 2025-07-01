// Файл: core/renderer.js
// Назначение: ВЕРСИЯ 1.0 - Полная перерисовка. Стабильная.

const tracker = require('./tracker');
const { createReactive } = require('./reactive');

function mount(vNode, container) {
  if (vNode === null || vNode === undefined || vNode === false) {
    return;
  }
  if (typeof vNode === 'string' || typeof vNode === 'number') {
    container.appendChild(document.createTextNode(vNode.toString()));
    return;
  }

  const { type, props = {} } = vNode;

  if (type === 'Fragment') {
    (props.children || []).forEach(child => mount(child, container));
    return;
  }

  const el = document.createElement(props.tag || 'div');

  for (const key in props) {
    if (key.startsWith('on')) {
      const eventName = key.substring(2).toLowerCase();
      el.addEventListener(eventName, props[key]);
    } else if (key === 'children') {
      (props.children || []).forEach(child => mount(child, el));
    } else if (key === 'style') {
      Object.assign(el.style, props[key]);
    } else if (key !== 'tag' && key !== 'bindTo' && key !== 'key') {
      el.setAttribute(key, props[key]);
      if (el.tagName === 'INPUT' && key === 'value') {
        el.value = props[key];
      }
    }
  }

  container.appendChild(el);
}

function render(viewFn, initialState, targetElement) {
  const depMap = new Map();
  const state = createReactive(initialState, depMap);

  const update = () => {
    // --- 1. Сохраняем информацию об активном элементе ПЕРЕД перерисовкой ---
    const activeElement = document.activeElement;
    let activeElementId = null;
    let selectionStart, selectionEnd;

    // Запоминаем ID и позицию курсора, только если это инпут
    if (activeElement && activeElement.tagName === 'INPUT') {
        activeElementId = activeElement.id;
        selectionStart = activeElement.selectionStart;
        selectionEnd = activeElement.selectionEnd;
    }

    tracker.startTracking(update);
    const vDom = viewFn(state);
    tracker.stopTracking();

    // --- 2. Наша стандартная полная перерисовка ---
    targetElement.innerHTML = '';
    mount(vDom, targetElement);

    // --- 3. Восстанавливаем фокус и позицию курсора ПОСЛЕ перерисовки ---
    if (activeElementId) {
        const newActiveElement = document.getElementById(activeElementId);
        if (newActiveElement) {
            newActiveElement.focus();
            newActiveElement.setSelectionRange(selectionStart, selectionEnd);
        }
    }
  };

  update();
}

module.exports = {
  render,
};
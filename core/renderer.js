// Файл: core/renderer.js (Версия 1.0.2 - Финальная)

const tracker = require('./tracker');
const { createReactive, createEffect } = require('./reactive');

function mount(vNode, container, activeElement) {
  if (vNode === null || vNode === undefined || vNode === false) return;
  if (typeof vNode === 'string' || typeof vNode === 'number') { container.appendChild(document.createTextNode(String(vNode))); return; }
  if (Array.isArray(vNode)) { vNode.forEach(child => mount(child, container, activeElement)); return; }
  
  const { type, props = {} } = vNode;
  if (type === 'Fragment') { (props.children || []).forEach(child => mount(child, container, activeElement)); return; }
  
  const el = document.createElement(props.tag || 'div');

  for (const key in props) {
    if (key.startsWith('on')) { const eventName = key.substring(2).toLowerCase(); el.addEventListener(eventName, props[key]); }
    else if (key === 'children') { mount(props.children, el, activeElement); }
    else if (key === 'style') { Object.assign(el.style, props[key]); }
    else if (key !== 'tag' && key !== 'key') {
      // --- ВОТ ОНО, РЕШЕНИЕ ДЛЯ INPUT ---
      // Если мы рендерим инпут, и он сейчас в фокусе, НЕ устанавливаем его value.
      // Это предотвратит "прыжок" каретки.
      if (key === 'value' && el.tagName === 'INPUT' && activeElement === el) {
          // пропустить
      } else {
          el.setAttribute(key, props[key]);
          if (key === 'value' || key === 'checked') { el[key] = props[key]; }
      }
    }
  }
  container.appendChild(el);
  if (props.onMount) props.onMount(el);
}


function render(viewFn, state, targetElement) {
    createEffect(() => {
        const activeElement = document.activeElement;
        let activeElementId = null;
        let selectionStart, selectionEnd;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElementId = activeElement.id;
            selectionStart = activeElement.selectionStart;
            selectionEnd = activeElement.selectionEnd;
        }

        const vDom = viewFn(state);

        targetElement.innerHTML = '';
        // Передаем activeElement в mount
        mount(vDom, targetElement, activeElementId ? document.getElementById(activeElementId) : null);
        
        if (activeElementId) {
            const newActiveElement = document.getElementById(activeElementId);
            if (newActiveElement) {
                newActiveElement.focus();
                if(typeof selectionStart === 'number') {
                    newActiveElement.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
    });
}

module.exports = { render };
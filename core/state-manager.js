// Файл: core/state-manager.js (CommonJS, исправленная версия)

// Этот объект будет хранить наши брейкпойнты и их порядок
let configuredBreakpoints = {};
let breakpointOrder = [];

// [ИЗМЕНЕНИЕ] Создаем объект-контейнер, который будем экспортировать.
// Он будет хранить ссылку на реактивный объект screenState после его инициализации.
const stateContainer = {
    screenState: null
};

/**
 * Инициализирует глобальный реактивный объект screenState.
 * Должен быть вызван один раз при создании UI.
 * @param {Function} createReactiveFn - Ссылка на функцию UI.createReactive.
 */
function initScreenState(createReactiveFn) {
    if (stateContainer.screenState) return; // Защита от повторной инициализации

    // [ИЗМЕНЕНИЕ] Присваиваем значение свойству в контейнере, а не глобальной переменной.
    stateContainer.screenState = createReactiveFn({
        width: window.innerWidth,
        height: window.innerHeight,
        breakpoint: 'base' // sm, md, lg...
    });

    window.addEventListener('resize', updateScreenBreakpoint, { passive: true });
    updateScreenBreakpoint(); // Первоначальный вызов для установки значения
}

/**
 * Устанавливает кастомные брейкпойнты.
 * @param {Object} newBreakpoints - Объект вида { sm: 640, md: 768, lg: 1024 }
 */
function setBreakpoints(newBreakpoints) {
    configuredBreakpoints = newBreakpoints;
    // Сортируем ключи по убыванию значения, чтобы проверка шла от большего к меньшему
    breakpointOrder = Object.keys(configuredBreakpoints).sort((a, b) => {
        return configuredBreakpoints[b] - configuredBreakpoints[a];
    });
    updateScreenBreakpoint(); // Сразу обновляем брейкпойнт после новой конфигурации
}

/**
 * Вычисляет и обновляет текущий брейкпойнт в screenState.
 */
function updateScreenBreakpoint() {
    // [ИЗМЕНЕНИЕ] Проверяем и используем свойство из контейнера.
    if (!stateContainer.screenState) return;

    const width = window.innerWidth;
    stateContainer.screenState.width = width;
    stateContainer.screenState.height = window.innerHeight;

    let currentBreakpoint = 'base';
    // Идем по отсортированному списку (lg, md, sm)
    for (const key of breakpointOrder) {
        if (width >= configuredBreakpoints[key]) {
            currentBreakpoint = key;
            break; // Нашли самый большой подходящий, выходим
        }
    }
    stateContainer.screenState.breakpoint = currentBreakpoint;
}

/**
 * Пересчитывает и применяет пропсы для конкретного VNode.
 * Используется как callback для слушателей событий (hover, focus).
 * @param {Object} vnode - VNode, для которого нужно обновить пропсы.
 */
function recalculateAndApplyProps(vnode) {
    // ВАЖНО: Мы используем require() внутри функции, чтобы избежать
    // циклической зависимости при загрузке модулей (state-manager -> dom -> state-manager).
    // Это стандартный и безопасный прием в CommonJS.
    const { applyProps } = require('./dom.js');
    if (vnode && vnode.el) {
        applyProps(vnode.el, vnode);
    }
}

// Карта состояний и соответствующих им DOM-событий
const interactiveStates = {
    hover: { on: 'mouseenter', off: 'mouseleave', prop: 'isHovering' },
    focus: { on: 'focusin', off: 'focusout', prop: 'isFocused' }
};

/**
 * Проверяет VNode на наличие "интерактивных" пропсов (hover:, focus:)
 * и вешает на его DOM-элемент соответствующие слушатели.
 * @param {Object} vnode
 */
function attachInteractiveState(vnode) {
    const props = vnode.props || {};
    let needsAttachment = false;

    // 1. Проверяем, нужны ли вообще слушатели для этого элемента
    for (const key in props) {
        if (key.includes(':hover:') || key.includes(':focus:')) {
            needsAttachment = true;
            break;
        }
    }

    if (!needsAttachment) return;

    // 2. Инициализируем внутреннее хранилище, если его нет
    if (!vnode._internal) {
        vnode._internal = { vnode: vnode };
    }
    if (!vnode._internal.state) {
        vnode._internal.state = {};
    }
    
    // 3. Вешаем слушатели для каждого нужного состояния
    for (const stateName in interactiveStates) {
        const stateConfig = interactiveStates[stateName];
        const propIdentifier = `:${stateName}:`;
        
        if (Object.keys(props).some(p => p.includes(propIdentifier)) && !vnode._internal.state[`has${stateName}Listener`]) {
            
            vnode.el.addEventListener(stateConfig.on, () => {
                vnode._internal.state[stateConfig.prop] = true;
                recalculateAndApplyProps(vnode);
            });

            vnode.el.addEventListener(stateConfig.off, () => {
                vnode._internal.state[stateConfig.prop] = false;
                recalculateAndApplyProps(vnode);
            });

            vnode._internal.state[`has${stateName}Listener`] = true;
        }
    }
}


module.exports = {
    // Для конфигурации из api.js
    initScreenState,
    setBreakpoints,
    // [ИЗМЕНЕНИЕ] Экспортируем сам контейнер.
    stateContainer,
    // Для renderer.js
    attachInteractiveState
};
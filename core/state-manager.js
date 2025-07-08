// Файл: core/state-manager.js

const stateContainer = {
    screenState: null
};
let configuredBreakpoints = {};
let breakpointOrder = [];

function initScreenState(createReactiveFn) {
    if (stateContainer.screenState) return;
    stateContainer.screenState = createReactiveFn({
        width: window.innerWidth,
        height: window.innerHeight,
        breakpoint: 'base'
    });
    window.addEventListener('resize', updateScreenBreakpoint, { passive: true });
    updateScreenBreakpoint();
}

function setBreakpoints(newBreakpoints) {
    configuredBreakpoints = newBreakpoints;
    breakpointOrder = Object.keys(configuredBreakpoints).sort((a, b) => {
        return configuredBreakpoints[b] - configuredBreakpoints[a];
    });
    updateScreenBreakpoint();
}

function updateScreenBreakpoint() {
    if (!stateContainer.screenState) return;
    const width = window.innerWidth;
    stateContainer.screenState.width = width;
    stateContainer.screenState.height = window.innerHeight;
    let currentBreakpoint = 'base';
    for (const key of breakpointOrder) {
        if (width >= configuredBreakpoints[key]) {
            currentBreakpoint = key;
            break;
        }
    }
    stateContainer.screenState.breakpoint = currentBreakpoint;
}

function recalculateAndApplyProps(vnode) {
    const { applyProps } = require('./dom/patching.js'); // Обновленный путь
    const { resolveProps } = require('./vdom/props-resolver.js');
    if (vnode && vnode.el) {
        const oldResolvedProps = vnode.resolvedProps;
        vnode.resolvedProps = resolveProps(vnode.props, stateContainer, vnode._internal.state || {});
        applyProps(vnode.el, vnode, oldResolvedProps);
    }
}

const interactiveStates = {
    hover: { on: 'mouseenter', off: 'mouseleave', prop: 'isHovering' },
    focus: { on: 'focusin', off: 'focusout', prop: 'isFocused' }
};

function attachInteractiveState(vnode) {
    const props = vnode.props || {};
    let needsAttachment = false;
    for (const key in props) {
        if (key.includes(':hover:') || key.includes(':focus:')) {
            needsAttachment = true;
            break;
        }
    }
    if (!needsAttachment) return;
    if (!vnode._internal) vnode._internal = { vnode: vnode };
    if (!vnode._internal.state) vnode._internal.state = {};
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
    initScreenState,
    setBreakpoints,
    stateContainer,
    attachInteractiveState
};
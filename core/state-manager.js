// Файл: core/state-manager.js

const stateContainer = {
    screenState: null
};
let configuredBreakpoints = {};
let breakpointOrder = [];

let mainRenderEffect = null;

function setMainRenderEffect(effect) {
    mainRenderEffect = effect;
}

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
    
    if (!needsAttachment && !props.group) return;

    if (!vnode._internal) vnode._internal = { vnode: vnode };
    if (!vnode._internal.state) vnode._internal.state = {};
    
    if (props.group && !vnode._internal.state.hasGroupListener) {
        vnode.el.addEventListener('mouseenter', () => {
            vnode.el.setAttribute('data-group-hover', 'true');
        });
        vnode.el.addEventListener('mouseleave', () => {
            vnode.el.removeAttribute('data-group-hover');
        });
        vnode._internal.state.hasGroupListener = true;
    }

    for (const stateName in interactiveStates) {
        const stateConfig = interactiveStates[stateName];
        const propIdentifier = `:${stateName}:`;
        if (Object.keys(props).some(p => p.includes(propIdentifier)) && !vnode._internal.state[`has${stateName}Listener`]) {
            
            const createHandler = (isEntering) => () => {
                if (vnode._internal.state[stateConfig.prop] !== isEntering) {
                    vnode._internal.state[stateConfig.prop] = isEntering;
                    if (mainRenderEffect) {
                        mainRenderEffect();
                    }
                }
            };

            vnode.el.addEventListener(stateConfig.on, createHandler(true));
            vnode.el.addEventListener(stateConfig.off, createHandler(false));

            vnode._internal.state[`has${stateName}Listener`] = true;
        }
    }
}

module.exports = {
    initScreenState,
    setBreakpoints,
    stateContainer,
    attachInteractiveState,
    setMainRenderEffect
};
// Файл: core/api.js

const { createHybridVNode, createComponentVNode, createTextVNode, createFragmentVNode } = require('./vdom/vnode.js');
const { createRender } = require('./create-app.js');
const stateManager = require('./state-manager.js');

function createComponentBuilder(componentName, hybridData, initialProps = {}) {
    const data = hybridData[componentName];
    if (!data) { return { toJSON: function() { throw new Error(`[SlightUI] Компонент "${componentName}" не найден.`); } }; }
    
    // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
    // Передаем все данные из гибридного компонента в его VNode!
    const vNode = createHybridVNode(componentName, { 
        innerHTML: data.html, 
        inlineStyle: data.css,
        scopeId: data.scopeId // Вот она, потерянная часть!
    });

    const builder = {
        vNode: vNode,
        props: function(propsObject) {
            Object.assign(this.vNode.props, propsObject);
            return this;
        },
        on: function(eventName, handler, selector = 'root') {
            if (selector === 'root') {
                this.vNode.props['on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)] = handler;
            } else {
                if (!this.vNode.props.listeners) this.vNode.props.listeners = {};
                if (!this.vNode.props.listeners[selector]) {
                    this.vNode.props.listeners[selector] = {};
                }
                this.vNode.props.listeners[selector][eventName] = handler;
            }
            return this;
        },
        children: function(...childBuilders) {
            this.vNode.props.children = childBuilders;
            return this;
        },
        key: function(k) { this.vNode.props.key = k; return this; },
        ref: function(r) { this.vNode.props.ref = r; return this; },
        model: function(stateObject, propertyName) {
            this.vNode.props.model = [stateObject, propertyName];
            return this;
        },
        toJSON: function() { return this.vNode; }
    };

    if (Object.keys(initialProps).length > 0) {
        builder.props(initialProps);
    }
    return builder;
}

function createUI(hybridData, reactiveFns) {
    const UI = {};
    
    UI._config = {};
    UI.config = (options) => {
        Object.assign(UI._config, options);
    };
    
    for (const componentName in hybridData) { 
        UI[componentName] = (initialPropsOrText = {}) => { 
            const initialProps = typeof initialPropsOrText === 'string' 
                ? { text: initialPropsOrText } 
                : initialPropsOrText;
            return createComponentBuilder(componentName, hybridData, initialProps); 
        }; 
    }

    UI.text = (initialContentOrProps = {}) => {
        const isProps = typeof initialContentOrProps === 'object' && initialContentOrProps !== null;
        const text = isProps ? (initialContentOrProps.text || '') : String(initialContentOrProps);
        const initialProps = isProps ? initialContentOrProps : {};
        if (!isProps) {
            initialProps.text = text;
        }

        const vNode = {
            type: 'GenericTextElement',
            props: { tag: 'p', ...initialProps },
            children: []
        };
        
        const textBuilder = { 
            vNode: vNode, 
            props: function(propsObject) { 
                Object.assign(this.vNode.props, propsObject);
                return this;
            }, 
            key: function(k) { this.vNode.props.key = k; return this; }, 
            toJSON: function() { return this.vNode; }
        };

        return textBuilder;
    };

    UI.component = (componentFn, props, ...children) => { return { toJSON: function() { return createComponentVNode(componentFn, props, children); } }; };
    UI.if = (conditionFn) => { let thenBranch, elseBranch; const ifBuilder = { then: function(builder) { thenBranch = builder; return ifBuilder; }, else: function(builder) { elseBranch = builder; return ifBuilder; }, toJSON: function() { const branch = conditionFn() ? thenBranch : elseBranch; return branch; } }; return ifBuilder; };
    UI.for = (config) => { if (!config || typeof config.each !== 'function' || !config.key || typeof config.as !== 'function') { console.error('[SlightUI.for] требует объект с полями: each (ФУНКЦИЯ, возвращающая массив), key (строка), as (функция).'); return { toJSON: () => createFragmentVNode([]) }; } return { toJSON: function() { const items = config.each(); const children = items.map((item, index) => { const builder = config.as(item, index); if (builder && typeof builder.key === 'function') { const keyValue = item[config.key]; if (keyValue === undefined) { console.warn(`[SlightUI.for] Ключ "${config.key}" не найден в элементе:`, item); } builder.key(keyValue); } return builder; }); return createFragmentVNode(children); } }; };
    
    const render = createRender(reactiveFns);
    
    UI.createReactive = reactiveFns.createReactive;
    
    UI.create = (options) => { 
        if (!options.target || !options.view) { throw new Error("SlightUI.create требует 'target' и 'view' опции."); } 
        render(options.view, options.target, UI._config); 
    };
    
    return UI;
}

module.exports = { createUI };
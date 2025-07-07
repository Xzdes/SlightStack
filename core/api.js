// Файл: core/api.js (ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)

const { createHybridVNode, createComponentVNode, createTextVNode } = require('./vnode.js');
const { createRender } = require('./renderer.js');

function createComponentBuilder(componentName, hybridData, initialProps = {}) {
    const data = hybridData[componentName];
    if (!data) {
        return {
            toJSON: function() {
                throw new Error(`[SlightUI] Компонент "${componentName}" не найден.`);
            }
        };
    }

    const vNode = createHybridVNode(componentName, {
        innerHTML: data.html,
        inlineStyle: data.css
    });

    const builder = {
        vNode: vNode,
        props: function(propsObject) {
            for (const key in propsObject) {
                const value = propsObject[key];
                if (key === 'className' || key.startsWith('data-')) {
                    this.vNode.props.attrs[key] = value;
                } else if (key === 'style') {
                    this.vNode.props.style = { ...this.vNode.props.style, ...value };
                } else if (['value', 'checked', 'disabled'].includes(key)) {
                    this.vNode.props[key] = value;
                } else {
                    this.vNode.props.replacements['{{' + key.toUpperCase() + '}}'] = value;
                }
            }
            return this;
        },
        on: function(eventName, handler, selector = 'root') {
            if (!this.vNode.props.listeners[selector]) {
                this.vNode.props.listeners[selector] = {};
            }
            this.vNode.props.listeners[selector][eventName] = handler;
            return this;
        },
        children: function(...childBuilders) {
            this.vNode.props.children = childBuilders;
            return this;
        },
        key: function(k) {
            this.vNode.props.key = k;
            return this;
        },
        ref: function(r) {
            this.vNode.props.ref = r;
            return this;
        },
        toJSON: function() {
            return this.vNode;
        }
    };

    if (Object.keys(initialProps).length > 0) {
        builder.props(initialProps);
    }

    return builder;
}

function createUI(hybridData, reactiveFns) {
    const UI = {};

    for (const componentName in hybridData) {
        UI[componentName] = (...args) => {
            const initialProps = {};
            if (args.length > 0) {
                if (typeof args[0] === 'string') {
                    initialProps.TEXT = args[0];
                } else if (typeof args[0] === 'object' && args[0] !== null) {
                    Object.assign(initialProps, args[0]);
                }
            }
            return createComponentBuilder(componentName, hybridData, initialProps);
        };
    }

    UI.text = (initialContent = '') => {
        const vNode = {
            type: 'p',
            props: { tag: 'p', style: {} },
            children: [String(initialContent)]
        };

        const textBuilder = {
            vNode: vNode,
            props: function(propsObject) {
                if (propsObject.TEXT !== undefined) {
                    this.vNode.children = [String(propsObject.TEXT)];
                }
                if (propsObject.style) {
                    this.vNode.props.style = { ...this.vNode.props.style, ...propsObject.style };
                }
                if (propsObject.tag) {
                    this.vNode.props.tag = propsObject.tag;
                }
                return this;
            },
            key: function(k) {
                this.vNode.props.key = k;
                return this;
            },
            toJSON: function() {
                return this.vNode;
            }
        };

        return textBuilder;
    };
    
    UI.component = (componentFn, props, ...children) => {
        return {
            toJSON: function() {
                return createComponentVNode(componentFn, props, children);
            }
        };
    };

    UI.if = (conditionFn) => {
        let thenBranch, elseBranch;
        const ifBuilder = {
            then: function(builder) {
                thenBranch = builder;
                return ifBuilder;
            },
            else: function(builder) {
                elseBranch = builder;
                return ifBuilder;
            },
            toJSON: function() {
                const branch = conditionFn() ? thenBranch : elseBranch;
                return branch;
            }
        };
        return ifBuilder;
    };

    UI.createReactive = reactiveFns.createReactive;
    const render = createRender(reactiveFns.createEffect);
    
    UI.create = (options) => {
        if (!options.target || !options.view) {
            throw new Error("SlightUI.create требует 'target' и 'view' опции.");
        }
        render(options.view, options.target);
    };

    return UI;
}

module.exports = {
    createUI
};
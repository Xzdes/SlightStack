// Файл: core/vnode.js (CommonJS версия)

function createTextVNode(content = '') {
    return {
        type: 'text',
        children: String(content),
        props: {}
    };
}

function createFragmentVNode(children = []) {
    return {
        type: 'Fragment',
        children: children,
        props: {}
    };
}

function createHybridVNode(componentName, props = {}, children = []) {
    return {
        type: 'HybridComponent',
        props: {
            componentName,
            replacements: {},
            listeners: {},
            attrs: {},
            ...props,
            children
        },
        children: []
    };
}

function createComponentVNode(componentFn, props = {}, children = []) {
    return {
        type: componentFn,
        props,
        children
    };
}

// Заменяем 'export' на 'module.exports'
module.exports = {
    createTextVNode,
    createFragmentVNode,
    createHybridVNode,
    createComponentVNode
};
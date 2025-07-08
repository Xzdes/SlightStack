// Файл: core/vdom/vnode.js

function createTextVNode(content = '') {
    return { type: 'text', children: String(content), props: {} };
}

function createFragmentVNode(children = []) {
    return { type: 'Fragment', children: children, props: {} };
}

function createHybridVNode(componentName, props = {}, children = []) {
    return {
        type: 'HybridComponent',
        props: { componentName, ...props, children },
        children: []
    };
}

function createComponentVNode(componentFn, props = {}, children = []) {
    return { type: componentFn, props, children };
}

module.exports = {
    createTextVNode,
    createFragmentVNode,
    createHybridVNode,
    createComponentVNode
};
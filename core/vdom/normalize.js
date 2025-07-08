// Файл: core/vdom/normalize.js

const { createTextVNode, createFragmentVNode } = require('./vnode.js');

function normalize(node, context) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return null;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        const vnode = { type: 'GenericTextElement', props: { text: String(node), tag: 'span' }, children: [] };
        if (context) {
            vnode.resolvedProps = context.resolveProps(vnode.props, context.stateContainer, {});
        }
        return vnode;
    }
    if (node && typeof node.toJSON === 'function') {
        return normalize(node.toJSON(), context);
    }
    if (Array.isArray(node)) {
        return createFragmentVNode(node.map(child => normalize(child, context)).filter(Boolean));
    }

    if (typeof node === 'object' && node.type) {
        if (typeof node.type === 'function') {
            const propsWithChildren = { ...node.props, children: node.children };
            const resolvedNode = node.type(propsWithChildren);
            return normalize(resolvedNode, context);
        }

        if (context) {
            if (!node._internal) node._internal = { vnode: node };
            const rawProps = { ...node.props };
            if (rawProps.model && Array.isArray(rawProps.model)) {
                const [stateObject, propertyName] = rawProps.model;
                const isCheckbox = typeof stateObject[propertyName] === 'boolean';
                if (isCheckbox) {
                    rawProps.type = 'checkbox'; rawProps.checked = stateObject[propertyName];
                    rawProps.onchange = e => stateObject[propertyName] = e.target.checked;
                } else {
                    if (!rawProps.type) { rawProps.type = 'text'; }
                    rawProps.value = stateObject[propertyName];
                    rawProps.oninput = e => stateObject[propertyName] = e.target.value;
                }
            }
            node.resolvedProps = context.resolveProps(rawProps, context.stateContainer, node._internal.state || {});
        }

        // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
        // Мы берем детей из resolvedProps, если они там есть.
        const childrenSource = node.resolvedProps?.children || node.props?.children || node.children;
        
        // Если детей нет или это не массив, создаем пустой массив
        const childrenToNormalize = Array.isArray(childrenSource) ? childrenSource : [];
        
        const normalizedChildren = childrenToNormalize.map(child => normalize(child, context)).filter(Boolean);
        
        // `normalizedChildren` теперь всегда массив VNode, а не один Fragment.
        const finalChildren = [].concat(...normalizedChildren.map(c => c.type === 'Fragment' ? c.children : c));


        if (node.type === 'HybridComponent') {
            node.props.children = finalChildren;
            if(node.resolvedProps) node.resolvedProps.children = finalChildren;
        } else {
            node.children = finalChildren;
        }
        
        return node;
    }

    console.warn('[SlightUI-Normalize] Не удалось нормализовать узел, он будет проигнорирован:', node);
    return null;
}

module.exports = { normalize };
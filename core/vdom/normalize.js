// Файл: core/vdom/normalize.js

const { createTextVNode, createFragmentVNode } = require('./vnode.js');

function normalize(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return null;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        // Заворачиваем голый текст в GenericTextElement для единообразия
        return { type: 'GenericTextElement', props: { text: String(node), tag: 'span' }, children: [] };
    }
    if (node && typeof node.toJSON === 'function') {
        return normalize(node.toJSON());
    }
    if (Array.isArray(node)) {
        return createFragmentVNode(node.map(normalize).filter(Boolean));
    }
    if (typeof node === 'object' && node.type) {
        if (typeof node.type === 'function') {
            const propsWithChildren = { ...node.props, children: node.children };
            const resolvedNode = node.type(propsWithChildren);
            return normalize(resolvedNode);
        }
        const childrenSource = node.props?.children || node.children;
        const normalizedChildren = normalize(childrenSource);
        if (node.type === 'HybridComponent') {
            node.props.children = normalizedChildren ? (normalizedChildren.type === 'Fragment' ? normalizedChildren.children : [normalizedChildren]) : [];
        } else if (node.type === 'GenericTextElement') {
            // У этого типа нет детей
        } else {
            node.children = normalizedChildren ? (normalizedChildren.type === 'Fragment' ? normalizedChildren.children : [normalizedChildren]) : [];
        }
        return node;
    }
    console.warn('[SlightUI-Normalize] Не удалось нормализовать узел, он будет проигнорирован:', node);
    return null;
}

module.exports = { normalize };
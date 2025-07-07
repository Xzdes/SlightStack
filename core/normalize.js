// Файл: core/normalize.js (CommonJS версия)

// Заменяем 'import' на 'require'
const { createTextVNode, createFragmentVNode } = require('./vnode.js');

function normalize(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return createTextVNode(node);
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

        if (node.type === 'HybridComponent') {
            const normalizedChildren = normalize(node.props.children);
            if (normalizedChildren && normalizedChildren.type === 'Fragment') {
                node.props.children = normalizedChildren.children;
            } else {
                node.props.children = normalizedChildren ? [normalizedChildren] : [];
            }
        } else {
             const normalizedChildren = normalize(node.children);
             if (normalizedChildren && normalizedChildren.type === 'Fragment') {
                 node.children = normalizedChildren.children;
             } else {
                 node.children = normalizedChildren ? [normalizedChildren] : [];
             }
        }
        
        return node;
    }

    console.warn('[SlightUI-Normalize] Не удалось нормализовать узел, он будет проигнорирован:', node);
    return null;
}

// Заменяем 'export' на 'module.exports'
module.exports = {
    normalize
};
// Файл: core/vdom.js (ПОСЛЕДНЯЯ, САМАЯ ВЕРНАЯ ВЕРСИЯ)

function createTextVNode(text) {
    // Текстовый узел - это особый тип. Его "ребенок" - это всегда строка.
    return {
        type: 'text',
        props: {},
        children: String(text) // children здесь - строка.
    };
}

function createFragmentVNode(children = []) {
    // Фрагмент хранит массив других VNode.
    return {
        type: 'Fragment',
        props: {},
        children: children
    };
}

function normalize(node) {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return createTextVNode(node);
    }
    
    if (typeof node.toJSON === 'function') {
        return normalize(node.toJSON());
    }

    if (Array.isArray(node)) {
        return createFragmentVNode(node.map(normalize).filter(Boolean));
    }

    if (typeof node === 'object' && node.type) {
        // Рекурсивно "разворачиваем" компонент-функцию
        if (typeof node.type === 'function') {
            const propsWithChildren = { ...node.props, children: node.children };
            const resolvedNode = node.type(propsWithChildren);
            return normalize(resolvedNode); // Возвращаем результат нормализации вызова компонента
        }

        // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
        // Для всех остальных узлов (тип - строка), мы обрабатываем их детей.
        // `children` может быть чем угодно: строкой, числом, другим строителем, массивом.
        // Мы просто передаем его в `normalize` и позволяем рекурсии сделать свою работу.
        const normalizedChildren = normalize(node.children);

        // `normalize` вернет либо null, либо VNode (текстовый или фрагмент).
        if (!normalizedChildren) {
            node.children = [];
        } else if (normalizedChildren.type === 'Fragment') {
            // Если дети обернуты во фрагмент, нам нужен сам массив детей.
            node.children = normalizedChildren.children;
        } else {
            // Если это один текстовый узел или другой, оборачиваем в массив.
            node.children = [normalizedChildren];
        }
        
        return node;
    }

    console.warn('[VDOM] Не удалось нормализовать узел:', node);
    return null;
}

module.exports = { normalize };
// Файл: core/vdom.js

/**
 * Создает VNode для текстового узла.
 * @param {string|number} text - Содержимое текстового узла.
 * @returns {object} VNode.
 */
function createTextVNode(text) {
    return {
        type: 'text',
        props: {},
        children: String(text) // children здесь - это всегда строка.
    };
}

/**
 * Создает VNode для фрагмента. Фрагмент - это контейнер без DOM-узла.
 * @param {Array<object>} children - Массив дочерних VNode.
 * @returns {object} VNode.
 */
function createFragmentVNode(children = []) {
    return {
        type: 'Fragment',
        props: {},
        children: children
    };
}

/**
 * Рекурсивная функция нормализации.
 * Преобразует любое значение в стандартизированный VNode или null.
 * @param {*} node - Входное значение (строка, число, массив, строитель, VNode).
 * @returns {object|null} Нормализованный VNode или null.
 */
function normalize(node) {
    // Шаг 1: Отсеиваем пустые значения.
    if (node === null || node === undefined || typeof node === 'boolean') {
        return null;
    }

    // Шаг 2: Примитивы преобразуем в текстовые VNode.
    if (typeof node === 'string' || typeof node === 'number') {
        return createTextVNode(node);
    }
    
    // Шаг 3: Если у объекта есть метод .toJSON(), это наш строитель.
    // Вызываем его, чтобы получить VNode, и нормализуем результат рекурсивно.
    if (typeof node.toJSON === 'function') {
        return normalize(node.toJSON());
    }

    // Шаг 4: Массивы преобразуем во фрагменты.
    // Рекурсивно нормализуем каждый элемент и отфильтровываем null.
    if (Array.isArray(node)) {
        return createFragmentVNode(node.map(normalize).filter(Boolean));
    }

    // Шаг 5: Обрабатываем уже существующие VNode или объекты, похожие на них.
    if (typeof node === 'object' && node.type) {
        // Если тип - это функция, это пользовательский компонент (например, UI.component(UserCard, ...)).
        // Выполняем его, чтобы получить VNode, и нормализуем результат.
        if (typeof node.type === 'function') {
            const propsWithChildren = { ...node.props, children: node.children };
            const resolvedNode = node.type(propsWithChildren);
            return normalize(resolvedNode);
        }

        // Для всех остальных VNode (тип - строка, например 'Row', 'Button')
        // мы рекурсивно нормализуем их дочерние элементы.
        const normalizedChildren = normalize(node.children);

        if (!normalizedChildren) {
            // Если детей нет, возвращаем пустой массив.
            node.children = [];
        } else if (normalizedChildren.type === 'Fragment') {
            // Если дети обернуты во фрагмент, нам нужен сам массив детей, а не фрагмент.
            node.children = normalizedChildren.children;
        } else {
            // Если это один узел (текстовый или другой), оборачиваем его в массив.
            node.children = [normalizedChildren];
        }
        
        return node;
    }

    console.warn('[VDOM] Не удалось нормализовать узел:', node);
    return null;
}

module.exports = { normalize };
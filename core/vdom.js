// Файл: core/vdom.js

/**
 * Создает стандартизированный виртуальный узел для текстового содержимого.
 * @param {string|number|boolean} text - Текст для отображения.
 * @returns {object} VNode текстового типа.
 */
function createTextVNode(text) {
    return {
        type: 'text',
        props: {},
        children: [String(text)] // Убеждаемся, что дочерний элемент всегда строка
    };
}

/**
 * Создает стандартизированный виртуальный узел для Фрагмента.
 * Фрагмент - это узел-контейнер, который не имеет собственного DOM-представления.
 * @param {Array<object>} children - Массив дочерних VNode.
 * @returns {object} VNode типа Фрагмент.
 */
function createFragmentVNode(children = []) {
    return {
        type: 'Fragment',
        props: {},
        children: children
    };
}

/**
 * Главная функция нормализации.
 * Принимает любой ввод от компонента-строителя (UI.text, UI.stack и т.д.)
 * и гарантированно возвращает либо стандартизированный VNode, либо null.
 * @param {*} node - Входные данные (может быть строкой, числом, объектом, массивом, null).
 * @returns {object|null} Нормализованный VNode или null.
 */
function normalize(node) {
    // 1. Обработка пустых или ложных значений. Они просто игнорируются.
    if (node === null || node === undefined || node === false || node === true) {
        return null;
    }

    // 2. Обработка примитивов: строки, числа. Превращаются в текстовые VNode.
    if (typeof node === 'string' || typeof node === 'number') {
        return createTextVNode(node);
    }
    
    // 3. Обработка результата вызова строителя (Fluent API).
    // У каждого нашего строителя есть метод .toJSON(), который возвращает "сырой" VNode.
    if (typeof node.toJSON === 'function') {
        return normalize(node.toJSON()); // Рекурсивно нормализуем результат.
    }

    // 4. Обработка массивов дочерних элементов.
    // Массив оборачивается во VNode типа 'Fragment'.
    // Каждый элемент массива также проходит через нормализацию.
    if (Array.isArray(node)) {
        const children = node.map(normalize).filter(Boolean); // .filter(Boolean) убирает все null
        return createFragmentVNode(children);
    }

    // 5. Обработка уже "сырого" VNode объекта.
    // Это основной путь после вызова .toJSON() или для внутренних рекурсивных вызовов.
    if (typeof node === 'object' && node.type) {
        // Главное действие здесь - рекурсивная нормализация дочерних элементов.
        if (node.children) {
            const normalizedChildren = normalize(node.children);
            // Результат нормализации детей сам может быть Фрагментом.
            // В этом случае нам нужны его дети, а не он сам.
            node.children = normalizedChildren ? (normalizedChildren.children || []) : [];
        } else {
            // Гарантируем, что у каждого узла есть массив children.
            node.children = [];
        }
        return node;
    }

    // Если мы дошли до сюда, значит тип данных неизвестен.
    console.warn('[VDOM] Не удалось нормализовать узел:', node);
    return null;
}

module.exports = {
    normalize
};
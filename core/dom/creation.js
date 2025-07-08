// Файл: core/dom/creation.js (Финальная и правильная версия)

function createDOMElement(vnode) {
    // Для гибридных компонентов мы создаем полностью готовый DOM-элемент здесь и сейчас.
    if (vnode.type === 'HybridComponent') {
        const tempContainer = document.createElement('div');
        
        // Берем "сырой" HTML-шаблон
        let html = vnode.props.innerHTML || '';

        // Заменяем все плейсхолдеры {{KEY}}, используя УЖЕ вычисленные resolvedProps
        html = html.replace(/{{([A-Z_]+)}}/g, (match, key) => {
            const propKey = key.toLowerCase();
            // Ищем значение в resolvedProps. Если его нет, оставляем плейсхолдер для отладки.
            return vnode.resolvedProps[propKey] !== undefined ? String(vnode.resolvedProps[propKey]) : match;
        });

        // Заменяем слот на маркер
        html = html.replace(/{{SLOT}}/g, '<div data-slight-slot></div>');
        
        tempContainer.innerHTML = html;
        return tempContainer.firstElementChild || document.createComment(`hybrid-placeholder-for-${vnode.props.componentName}`);
    }
    
    // Остальная логика без изменений
    if (vnode.type === 'GenericTextElement') {
        return document.createElement(vnode.props.tag || 'p');
    }
    if (vnode.type === 'text') { 
        return document.createTextNode(''); 
    }
    if (vnode.type === 'Fragment') { 
        return document.createDocumentFragment(); 
    }
    return document.createComment(`unknown vnode type: ${vnode.type}`);
}

module.exports = { createDOMElement };
// Файл: core/router.js

const { createReactive } = require('./reactivity/reactive.js');
const { createComponentVNode } = require('./vdom/vnode.js'); // Импортируем хелпер

let createReactiveFn;
const currentPathState = {
    value: window.location.hash.slice(1) || '/'
};
let pathReactive;

window.addEventListener('hashchange', () => {
    if (pathReactive) {
        pathReactive.value = window.location.hash.slice(1) || '/';
    }
});

/**
 * Компонент-роутер.
 */
function Router({ routes }) {
    // [ИЗМЕНЕНИЕ] Создаем функцию-компонент, которая будет рендерить нужную страницу
    const RouterComponent = () => {
        if (!pathReactive) {
            pathReactive = createReactiveFn(currentPathState);
        }
        const path = pathReactive.value;
        const PageComponent = routes[path] || routes['*'];
        
        return PageComponent ? PageComponent() : null;
    };

    // [ИЗМЕНЕНИЕ] Возвращаем стандартный VNode, где type - это наша функция-компонент
    return createComponentVNode(RouterComponent, { routes });
}


let UI_INSTANCE;

/**
 * Компонент-ссылка.
 */
function Link(props) {
    if (!UI_INSTANCE) {
        throw new Error('[SlightUI.Link] UI не был предоставлен.');
    }
    const { to, children, ...rest } = props;
    
    // В app.js мы создаем UI.text, поэтому здесь просто передаем пропсы
    return UI_INSTANCE.text({
        tag: 'a',
        href: `#${to}`,
        text: children, // Дети для ссылки - это ее текст
        ...rest
    });
}

/**
 * Внедряет зависимости.
 */
function provideRouterDeps(dependencies) {
    UI_INSTANCE = dependencies.UI;
    createReactiveFn = dependencies.createReactiveFn;
}

module.exports = { Router, Link, provideRouterDeps };
// Файл: components/Tabs.js (Версия с НЕ-ленивым рендерингом)

function Tabs(props) {
    const { items = [], activeTab = 0, onTabChange } = props;

    if (typeof onTabChange !== 'function') {
        console.error('<Tabs> требует пропс "onTabChange" (функция).');
        return null;
    }

    return {
        type: 'TabsWrapper',
        props: {
            tag: 'div',
            children: [
                { // Панель с кнопками-вкладками
                    type: 'TabList',
                    props: { /* ... без изменений ... */ }
                },
                { // Контейнер для ВСЕХ вкладок
                    type: 'TabContentWrapper',
                    props: {
                        tag: 'div',
                        children: items.map((item, index) => ({
                            type: 'TabContent',
                            props: {
                                tag: 'div',
                                key: item.key || `tab-content-${index}`,
                                // Скрываем неактивные вкладки через CSS, а не убираем из DOM
                                style: { display: activeTab === index ? 'block' : 'none' },
                                children: [item.content()] // Рендерим ВСЕГДА
                            }
                        }))
                    }
                }
            ]
        }
    };
}
// P.S. Код для TabList props я сократил, он остается таким же, как был.
// Я перепишу его полностью для ясности.

function RefactoredTabs(props) {
    const { items = [], activeTab = 0, onTabChange } = props;

    if (typeof onTabChange !== 'function') return null;

    return {
        type: 'TabsWrapper',
        props: {
            tag: 'div',
            children: [
                {
                    type: 'TabList',
                    props: {
                        tag: 'div',
                        style: { display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '15px' },
                        children: items.map((item, index) => ({
                            type: 'TabButton',
                            props: {
                                tag: 'button',
                                key: `tab-button-${index}`,
                                style: {
                                    padding: '10px 15px', border: 'none', cursor: 'pointer',
                                    background: activeTab === index ? '#eee' : 'transparent',
                                    borderBottom: activeTab === index ? '3px solid blue' : '3px solid transparent',
                                },
                                children: [item.label],
                                onClick: () => onTabChange(index),
                            }
                        }))
                    }
                },
                {
                    type: 'TabContentWrapper',
                    props: {
                        tag: 'div',
                        children: items.map((item, index) => ({
                            type: 'TabContent',
                            props: {
                                tag: 'div',
                                key: item.key || `tab-content-${index}`,
                                style: { display: activeTab === index ? 'block' : 'none' },
                                children: [item.content()]
                            }
                        }))
                    }
                }
            ]
        }
    };
}


module.exports = RefactoredTabs;
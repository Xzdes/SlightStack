// Файл: components/Table.js (Финальная версия с явной зависимостью)

const For = require('../helpers/for.js');

function Table(props) {
    const { headers = [], rows = [], renderCell, key } = props;

    // --- ВОТ ОНО! РЕШЕНИЕ! ---
    // Мы явно читаем свойство .length у массива rows, который пришел в пропсах.
    // Так как rows - это наш appState.tasks, то во время рендеринга этой таблицы
    // наш Proxy увидит это чтение и подпишет текущий `update` на изменения `tasks`.
    const dependencyTrigger = rows.length;

    const renderHeader = () => ({
        type: 'TableHeader',
        props: {
            tag: 'thead',
            children: [{
                type: 'HeaderRow',
                props: {
                    tag: 'tr',
                    children: headers.map(header => ({
                        type: 'HeaderCell',
                        props: {
                            tag: 'th',
                            style: { textAlign: header.align || 'left' },
                            children: [header.label]
                        }
                    }))
                }
            }]
        }
    });

    const renderBody = () => ({
        type: 'TableBody',
        props: {
            tag: 'tbody',
            children: For({
                each: rows,
                key: 'id',
                as: (row) => ({
                    type: 'BodyRow',
                    props: {
                        key: row.id,
                        tag: 'tr',
                        children: headers.map(header => ({
                            type: 'BodyCell',
                            props: {
                                tag: 'td',
                                style: { textAlign: header.align || 'left' },
                                children: [
                                    typeof renderCell === 'function' 
                                        ? renderCell(header.key, row) 
                                        : row[header.key]
                                ]
                            }
                        }))
                    }
                })
            })
        }
    });

    return {
        type: 'Table',
        props: {
            tag: 'table',
            key: key,
            children: [renderHeader(), renderBody()]
        }
    };
}

module.exports = Table;
// Файл: components/Table.js (Исправленная версия)

const For = require('../helpers/for.js');

function Table(props) {
    const { headers = [], rows = [], renderCell, key } = props;

    // --- ИСПРАВЛЕНИЕ: Определяем функции до их использования ---
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
                key: 'id', // Ключ для For-компонента
                as: (row) => ({
                    type: 'BodyRow',
                    props: {
                        key: row.id, // Ключ для самого tr
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
            key: key, // Пробрасываем ключ, если он есть
            children: [renderHeader(), renderBody()]
        }
    };
}

module.exports = Table;
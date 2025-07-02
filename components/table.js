// Файл: components/table.js (Финальная, правильная версия)

// Напрямую импортируем хелпер, от которого зависим.
// Не используем глобальный UI!
const For = require('../helpers/for.js');

/**
 * "Строитель" для компонента таблицы.
 */
function TableBuilder() {
    this.props = {
        headers: [],
        rows: [],
        key: null,
        onUnmount: null
    };
    this.renderCellFn = null;
}

// --- Методы-конфигураторы ---
TableBuilder.prototype.headers = function(headerArray) { this.props.headers = headerArray; return this; };
TableBuilder.prototype.rows = function(dataArray) { this.props.rows = dataArray; return this; };
TableBuilder.prototype.renderCell = function(renderFn) { this.renderCellFn = renderFn; return this; };
TableBuilder.prototype.key = function(k) { this.props.key = k; return this; };
TableBuilder.prototype.onUnmount = function(handler) { this.props.onUnmount = handler; return this; };

// --- Финальный метод ---
TableBuilder.prototype.toJSON = function() {
    const { headers, rows, key, onUnmount } = this.props;

    const renderHeader = () => ({
        type: 'TableHeader', props: { tag: 'thead', children: [{
            type: 'HeaderRow', props: { tag: 'tr', children: headers.map(h => ({
                type: 'HeaderCell', props: { tag: 'th', style: { padding: '12px', border: '1px solid #ddd', textAlign: 'left' }, children: [h.label] }
            }))}
        }]}
    });

    const renderBody = () => ({
        type: 'TableBody', props: { tag: 'tbody', children: For({
            each: rows,
            key: 'id',
            as: (row) => ({
                type: 'BodyRow', props: { tag: 'tr', key: row.id, children: headers.map(h => ({
                    type: 'BodyCell', props: { tag: 'td', style: { padding: '12px', border: '1px solid #ddd' }, children: [
                        this.renderCellFn ? this.renderCellFn(h.key, row) : row[h.key]
                    ]}
                }))}
            })
        })}
    });

    return {
        type: 'Table',
        props: {
            tag: 'table',
            key: key,
            onUnmount: onUnmount,
            style: { width: '100%', borderCollapse: 'collapse' },
            children: [unwrap(renderHeader()), unwrap(renderBody())]
        }
    };
};

// Утилита, чтобы избежать ошибок "UI is not defined" внутри компонента
function unwrap(builder) {
    return builder && builder.toJSON ? builder.toJSON() : builder;
}

module.exports = () => new TableBuilder();
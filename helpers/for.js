// Файл: helpers/for.js

function For(props) {
  const { each: items, key, as: renderFn } = props;
  
  if (!Array.isArray(items)) {
    console.error('Prop "each" в компоненте For должен быть массивом. Получено:', items);
    return { type: 'Fragment', props: {}, children: [] };
  }
  if (typeof renderFn !== 'function') {
    console.error('Prop "as" в компоненте For должен быть функцией.');
    return { type: 'Fragment', props: {}, children: [] };
  }

  const children = items.map((item, index) => {
    const builder = renderFn(item, index);
    const vNode = builder && typeof builder.toJSON === 'function' ? builder.toJSON() : builder;

    if (vNode && vNode.props && key && item[key] !== undefined && vNode.props.key === undefined) {
        vNode.props.key = item[key];
    }

    return vNode;
  });

  return {
      type: 'Fragment',
      props: {},
      children: children
  };
}

module.exports = For;
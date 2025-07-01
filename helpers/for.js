function For(props) {
  const { each: items, key, as: renderFn } = props;
  if (!Array.isArray(items) || !key) return null;

  return items.map((item, index) => {
    const vNode = renderFn(item, index);
    if (vNode && vNode.props) vNode.props.key = item[key];
    return vNode;
  });
}
// For остается таким же, так как он используется внутри других компонентов.
module.exports = For;
// Файл: helpers/if.js

function If(props) {
  const { condition, then: thenFn, else: elseFn } = props;
  if (condition) {
    return typeof thenFn === 'function' ? thenFn() : null;
  } else {
    return typeof elseFn === 'function' ? elseFn() : null;
  }
}

module.exports = If;
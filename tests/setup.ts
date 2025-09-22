import React from 'react';

Object.defineProperty(document, 'readyState', {
  configurable: true,
  value: 'complete',
});

(globalThis as typeof globalThis & {
  React: typeof React;
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).React = React;

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

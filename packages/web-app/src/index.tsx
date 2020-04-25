import { hot } from 'react-hot-loader/root';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app';

// eslint-disable-next-line no-console
console.info('Starting web-app');

const root = document.getElementById('root');

if (root === null) {
  throw new Error("Unable to find HTML elment with id 'root'");
}

const HotApp = hot(App);

ReactDOM.render(<HotApp />, root);

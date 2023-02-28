import { proxy } from "proxy";
import { render } from 'preact';
import App from './App'

proxy();

const root = document.createElement('div')
render(<App />, root);
if (document.body) {
  document.body.prepend(root)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(root)
  })
}
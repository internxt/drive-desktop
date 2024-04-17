import { render } from 'react-dom';
import App from './App';
import { initSentry } from './utils/sentry';
initSentry();

render(<App />, document.getElementById('root'));

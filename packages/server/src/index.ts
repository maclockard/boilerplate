import { logSomething } from '@bp/api';
import { createApp } from './app';

console.log(`Starting server`);

logSomething();

const port = 5000;
const app = createApp();

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

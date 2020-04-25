import React, { useEffect, memo, useState } from 'react';
import { PingPongPayload, logSomething } from '@bp/api';

import classes from './app.module.css';

export const App = memo(function App() {
  const [response, setResponse] = useState<PingPongPayload | undefined>();

  useEffect(() => {
    logSomething();
    fetch(`${BACKEND_URL}/ping`)
      .then((r) => r.json())
      .then((r) => setResponse(r));
  }, []);

  return (
    <div className={classes.content}>
      <h1>Hello World!</h1>
      <p>response from server: {response?.ping}</p>
    </div>
  );
});

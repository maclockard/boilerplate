import express from 'express';
import cors from "cors";
import { PingPongPayload } from '@bp/api/src';

export const createApp = (): express.Application => {
  const app = express();

  app.use(cors() as any);

  app.get('/ping', async (req, res, next) => {
    const response: PingPongPayload = {
      ping: 'pong',
    };
    res.json(response);
  });

  return app;
};

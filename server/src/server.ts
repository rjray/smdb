/**
 * Core file of the Express server.
 */

import { Express } from "express";
import http from "http";

import createApp from "./app";

const httpPort: number = Number(process.env.HTTP_PORT) || 3001;

async function createServer(
  app: Express
): Promise<
  http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
> {
  const server = http.createServer(app);
  return server;
}

createApp()
  .then((app) =>
    createServer(app).then((server) => {
      server.listen(httpPort);
      console.log(`Listening on port ${httpPort}`);
    })
  )
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });

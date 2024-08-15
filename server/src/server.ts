/**
 * Core file of the Express server.
 */

import * as path from "node:path";
import express, { Express, Response } from "express";
import http from "http";
import compression from "compression";
import helmet from "helmet";
import * as exegesisExpress from "exegesis-express";

const httpPort: number = Number(process.env.HTTP_PORT) || 3001;
const { dirname } = import.meta;

async function createServer() {
  const app: Express = express();

  app.disable("x-powered-by");
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(compression());
  // app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
  app.use(helmet());

  app.use(
    await exegesisExpress.middleware(path.resolve(dirname, "openapi.yaml"), {
      controllers: path.resolve(dirname, "controllers"),
      controllersPattern: "**/*.@(ts|js)",
      onResponseValidationError: (result) => {
        console.warn(JSON.stringify(result.errors, null, 2));
      },
      allErrors: true,
      strictValidation: true,
      allowMissingControllers: true,
      treatReturnedJsonAsPure: true,
    })
  );

  app.use((_, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });

  const server = http.createServer(app);
  return server;
}

createServer()
  .then((server) => {
    server.listen(httpPort);
    console.log(`Listening on port ${httpPort}`);
  })
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });

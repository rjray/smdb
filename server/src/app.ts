/**
 * The application object containing the Express application and the Exegesis
 * middleware.
 */

import * as path from "node:path";
import express, { Express, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import * as exegesisExpress from "exegesis-express";

export default async function createApp(): Promise<express.Express> {
  const app: Express = express();
  const { dirname } = import.meta;

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

  return app;
}

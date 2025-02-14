/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import passport from 'passport';
import pinoMiddleware from 'pino-http';
import { assetsRouter } from './assets.router';
import { authenticateApiKey, fabricAPIKeyStrategy } from './auth';
import { healthRouter } from './health.router';
import { jobsRouter } from './jobs.router';
import { transactionsRouter } from './transactions.router';
import { sensorsRouter } from './sensors.router'; // Updated to use SensorsOrg router
import cors from 'cors';

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;

export const createServer = async (): Promise<Application> => {
  const app = express();

  app.use(
      pinoMiddleware({
        logger,
        customLogLevel: function customLogLevel(res, err) {
          if (
              res.statusCode >= BAD_REQUEST &&
              res.statusCode < INTERNAL_SERVER_ERROR
          ) {
            return 'warn';
          }

          if (res.statusCode >= INTERNAL_SERVER_ERROR || err) {
            return 'error';
          }

          return 'debug';
        },
      })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Define passport strategy
  passport.use(fabricAPIKeyStrategy);

  // Initialize passport.js
  app.use(passport.initialize());

  if (process.env.NODE_ENV === 'development') {
    app.use(cors());
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
  }

  // Health check endpoints
  app.use('/', healthRouter);

  // Main API routes
  app.use('/api/assets', authenticateApiKey, assetsRouter);
  app.use('/api/jobs', authenticateApiKey, jobsRouter);
  app.use('/api/transactions', authenticateApiKey, transactionsRouter);

  // SensorsOrg unified router
  app.use('/api/sensors', authenticateApiKey, sensorsRouter);

  // For everything else (404 Handler)
  app.use((_req, res) =>
      res.status(NOT_FOUND).json({
        status: getReasonPhrase(NOT_FOUND),
        timestamp: new Date().toISOString(),
      })
  );

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};
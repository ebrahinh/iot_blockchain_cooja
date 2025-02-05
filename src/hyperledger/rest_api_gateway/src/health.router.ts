/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { getBlockHeight } from './fabric';
import { logger } from './logger';
import * as config from './config';
import { Queue } from 'bullmq';
import { getJobCounts } from './jobs';

const { SERVICE_UNAVAILABLE, OK } = StatusCodes;

export const healthRouter = express.Router();

/*
 * Readiness check - Basic response to indicate the server is ready.
 */
healthRouter.get('/ready', (_req, res: Response) =>
    res.status(OK).json({
      status: getReasonPhrase(OK),
      timestamp: new Date().toISOString(),
    })
);

/*
 * Liveness check - Ensures all organizations are responding properly.
 */
healthRouter.get('/live', async (req: Request, res: Response) => {
  logger.debug(req.body, 'Liveness request received');

  try {
    const submitQueue = req.app.locals.jobq as Queue;

    // Fetch contracts from all organizations
    const qsccContracts: Contract[] = [
      req.app.locals[config.mspIdOrg1]?.qsccContract as Contract,
      req.app.locals[config.mspIdOrg2]?.qsccContract as Contract,
      req.app.locals[config.mspIdOrg3]?.qsccContract as Contract,
      req.app.locals[config.mspIdOrg4]?.qsccContract as Contract,
      req.app.locals[config.mspIdOrg5]?.qsccContract as Contract,
      req.app.locals[config.mspIdSensorsOrg]?.qsccContract as Contract, // SensorsOrg contract
    ].filter(Boolean); // Remove any undefined contracts

    // Run checks for all organizations
    await Promise.all([
      ...qsccContracts.map((contract) => getBlockHeight(contract)),
      getJobCounts(submitQueue),
    ]);
  } catch (err) {
    logger.error({ err }, 'Error processing liveness request');

    return res.status(SERVICE_UNAVAILABLE).json({
      status: getReasonPhrase(SERVICE_UNAVAILABLE),
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(OK).json({
    status: getReasonPhrase(OK),
    timestamp: new Date().toISOString(),
  });
});
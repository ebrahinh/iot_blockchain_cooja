/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { authenticateApiKey } from './auth';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

export const sensorsRouter = express.Router();

// Fetch network mobility data
sensorsRouter.get('/network-mobility', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const mobilityContract = req.app.locals.SensorsOrg?.assetContract as Contract;
    const result = await mobilityContract.evaluateTransaction('QueryAllMobilityData');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});

// Fetch security data
sensorsRouter.get('/security', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const securityContract = req.app.locals.SensorsOrg?.assetContract as Contract;
    const result = await securityContract.evaluateTransaction('QueryAllSecurityData');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});

// Fetch availability data
sensorsRouter.get('/availability', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const availabilityContract = req.app.locals.SensorsOrg?.assetContract as Contract;
    const result = await availabilityContract.evaluateTransaction('QueryAllAvailabilityData');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});
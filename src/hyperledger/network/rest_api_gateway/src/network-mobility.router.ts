/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { authenticateApiKey } from './auth';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

export const networkMobilityRouter = express.Router();

// Fetch mobility and network records
networkMobilityRouter.get('/', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const mobilityContract = req.app.locals.NetworkMobilityOrg?.assetContract as Contract;
    const result = await mobilityContract.evaluateTransaction('QueryAllMobilityData');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});

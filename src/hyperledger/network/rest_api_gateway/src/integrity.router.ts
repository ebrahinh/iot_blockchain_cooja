/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { authenticateApiKey } from './auth';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

export const integrityRouter = express.Router();

// Fetch integrity records
integrityRouter.get('/', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const integrityContract = req.app.locals.IntegrityOrg?.assetContract as Contract;
    const result = await integrityContract.evaluateTransaction('QueryAllIntegrityRecords');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});

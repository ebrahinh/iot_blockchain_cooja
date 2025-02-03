/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { authenticateApiKey } from './auth';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

export const securityRouter = express.Router();

// Fetch security data
securityRouter.get('/', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const securityContract = req.app.locals.SecurityOrg?.assetContract as Contract;
    const result = await securityContract.evaluateTransaction('QueryAllSecurityData');

    res.status(OK).json({ data: JSON.parse(result.toString()) });
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR).json({
      error: getReasonPhrase(INTERNAL_SERVER_ERROR),
      message: err.message,
    });
  }
});

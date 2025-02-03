/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { getTransactionValidationCode } from './fabric';
import { logger } from './logger';
import { TransactionNotFoundError } from './errors';

const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } = StatusCodes;

export const transactionsRouter = express.Router();

// Fetch transaction validation code
transactionsRouter.get('/:transactionId', async (req: Request, res: Response) => {
  const mspId = req.user as string;
  const transactionId = req.params.transactionId;

  logger.debug('Read request received for transaction ID %s', transactionId);

  try {
    // 🛠️ ✅ Support All Organizations
    const qsccContract = req.app.locals[mspId]?.qsccContract as Contract;

    if (!qsccContract) {
      return res.status(UNAUTHORIZED).json({
        status: getReasonPhrase(UNAUTHORIZED),
        message: `No valid contract found for organization: ${mspId}`,
        timestamp: new Date().toISOString(),
      });
    }

    // 🏆 Fetch transaction validation code
    const validationCode = await getTransactionValidationCode(qsccContract, transactionId);

    return res.status(OK).json({
      transactionId,
      validationCode,
    });

  } catch (err) {
    if (err instanceof TransactionNotFoundError) {
      return res.status(NOT_FOUND).json({
        status: getReasonPhrase(NOT_FOUND),
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error({ err }, 'Error processing transaction ID %s', transactionId);
      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
});

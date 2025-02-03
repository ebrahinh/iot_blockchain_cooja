/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Queue } from 'bullmq';
import { AssetNotFoundError } from './errors';
import { evatuateTransaction } from './fabric';
import { addSubmitTransactionJob } from './jobs';
import { logger } from './logger';

const { ACCEPTED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } =
  StatusCodes;

export const assetsRouter = express.Router();

/**
 * Get all assets from the ledger
 */
assetsRouter.get('/', async (req: Request, res: Response) => {
  logger.debug('Get all assets request received');
  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(contract, 'GetAllAssets');
    let assets = [];
    if (data.length > 0) {
      assets = JSON.parse(data.toString());
    }

    return res.status(OK).json(assets);
  } catch (err) {
    logger.error({ err }, 'Error processing get all assets request');
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Create a new asset
 */
assetsRouter.post(
  '/',
  body().isObject().withMessage('body must contain an asset object'),
  async (req: Request, res: Response) => {
    logger.debug(req.body, 'Create asset request received');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(BAD_REQUEST).json({
        status: getReasonPhrase(BAD_REQUEST),
        reason: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        timestamp: new Date().toISOString(),
        errors: errors.array(),
      });
    }

    const mspId = req.user as string;
    const submitQueue = req.app.locals.jobq as Queue;
    let jobId;

    try {
      switch (mspId) {
        case 'Org1MSP': 
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'CreateAsset',
            req.body.rid, req.body.availability, req.body.usage
          );
          break;

        case 'Org2MSP':
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'CreateAsset',
            req.body.rid, req.body.id, req.body.temperature
          );
          break;

        case 'Org3MSP':
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'CreateAsset',
            req.body.id, req.body.speed, req.body.acceleration, req.body.decelaration, req.body.steering
          );
          break;

        case 'Org4MSP':
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'CreateAsset',
            req.body.id, req.body.temperature, req.body.fuel, req.body.coolant, req.body.oilpressure
          );
          break;

        case 'Org5MSP':
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'CreateAsset',
            req.body.id, req.body.xco, req.body.yco, req.body.speed
          );m
          break;

        case 'SecurityOrgMSP': 
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'LogSecurityEvent',
            req.body.eventId, req.body.eventType, req.body.timestamp
          );
          break;

        case 'IntegrityOrgMSP': 
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'ValidateDataIntegrity',
            req.body.recordId, req.body.checksum, req.body.source
          );
          break;

        case 'NetworkMobilityOrgMSP': 
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'TrackDeviceMovement',
            req.body.deviceId, req.body.latitude, req.body.longitude, req.body.timestamp
          );
          break;

        case 'AvailabilitySensorMSP': 
          jobId = await addSubmitTransactionJob(
            submitQueue, mspId, 'ReportAvailability',
            req.body.sensorId, req.body.status, req.body.lastChecked
          );
          break;

        default:
          throw new Error('Unrecognized organization');
      }

      return res.status(ACCEPTED).json({
        status: getReasonPhrase(ACCEPTED),
        jobId: jobId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Error processing create asset request');

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Fetch a specific asset by ID
 */
assetsRouter.get('/:assetId', async (req: Request, res: Response) => {
  const assetId = req.params.assetId;
  logger.debug('Read asset request received for asset ID %s', assetId);

  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(contract, 'ReadAsset', assetId);
    const asset = JSON.parse(data.toString());

    return res.status(OK).json(asset);
  } catch (err) {
    logger.error({ err }, 'Error processing read asset request for asset ID %s', assetId);

    if (err instanceof AssetNotFoundError) {
      return res.status(NOT_FOUND).json({
        status: getReasonPhrase(NOT_FOUND),
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Delete an asset
 */
assetsRouter.delete('/:assetId', async (req: Request, res: Response) => {
  logger.debug(req.body, 'Delete asset request received');

  const mspId = req.user as string;
  const assetId = req.params.assetId;

  try {
    const submitQueue = req.app.locals.jobq as Queue;
    const jobId = await addSubmitTransactionJob(
      submitQueue, mspId, 'DeleteAsset', assetId
    );

    return res.status(ACCEPTED).json({
      status: getReasonPhrase(ACCEPTED),
      jobId: jobId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'Error processing delete asset request for asset ID %s', assetId);

    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

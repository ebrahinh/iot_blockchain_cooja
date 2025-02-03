/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This is the main entrypoint for the sample REST server, which is responsible
 * for connecting to the Fabric network and setting up a job queue for
 * processing submit transactions.
 */

import * as config from './config';
import {
  createGateway,
  createWallet,
  getContracts,
  getNetwork,
} from './fabric';
import {
  initJobQueue,
  initJobQueueScheduler,
  initJobQueueWorker,
} from './jobs';
import { logger } from './logger';
import { createServer } from './server';
import { isMaxmemoryPolicyNoeviction } from './redis';
import { Queue, QueueScheduler, Worker } from 'bullmq';

let jobQueue: Queue | undefined;
let jobQueueWorker: Worker | undefined;
let jobQueueScheduler: QueueScheduler | undefined;

async function main() {
  logger.info('Checking Redis config');
  if (!(await isMaxmemoryPolicyNoeviction())) {
    throw new Error(
      'Invalid redis configuration: redis instance must have the setting maxmemory-policy=noeviction'
    );
  }

  logger.info('Creating REST server');
  const app = await createServer();

  logger.info('Connecting to Fabric network with all organizations');
  const wallet = await createWallet();

  // Define all organizations and their respective chaincodes
  const orgs = [
    { name: 'Org1', configProfile: config.connectionProfileOrg1, mspId: config.mspIdOrg1, chaincode: 'easwar' },
    { name: 'Org2', configProfile: config.connectionProfileOrg2, mspId: config.mspIdOrg2, chaincode: 'nitin' },
    { name: 'SecurityOrg', configProfile: config.connectionProfileOrg3, mspId: config.mspIdSecurityOrg, chaincode: 'securitycc' },
    { name: 'IntegrityOrg', configProfile: config.connectionProfileOrg4, mspId: config.mspIdIntegrityOrg, chaincode: 'integritycc' },
    { name: 'NetworkMobility', configProfile: config.connectionProfileOrg5, mspId: config.mspIdNetworkMobilityOrg, chaincode: 'mobilitycc' },
    { name: 'AvailabilitySensor', configProfile: config.connectionProfileOrg5, mspId: config.mspIdAvailabilitySensor, chaincode: 'availabilitycc' },
  ];

  // Connect each organization
  for (const org of orgs) {
    logger.info(`Connecting to Fabric network with ${org.name} mspid`);
    const gateway = await createGateway(org.configProfile, org.mspId, wallet);
    const network = await getNetwork(gateway);
    const contracts = await getContracts(network, org.chaincode);

    app.locals[org.mspId] = contracts;
  }

  logger.info('Initializing submit job queue');
  jobQueue = initJobQueue();
  jobQueueWorker = initJobQueueWorker(app);

  if (config.submitJobQueueScheduler === true) {
    logger.info('Initializing submit job queue scheduler');
    jobQueueScheduler = initJobQueueScheduler();
  }

  app.locals.jobq = jobQueue;

  logger.info('Starting REST server');
  app.listen(config.port, () => {
    logger.info('REST server started on port: %d', config.port);
  });
}

main().catch(async (err) => {
  logger.error({ err }, 'Unexpected error');

  if (jobQueueScheduler != undefined) {
    logger.debug('Closing job queue scheduler');
    await jobQueueScheduler.close();
  }

  if (jobQueueWorker != undefined) {
    logger.debug('Closing job queue worker');
    await jobQueueWorker.close();
  }

  if (jobQueue != undefined) {
    logger.debug('Closing job queue');
    await jobQueue.close();
  }
});

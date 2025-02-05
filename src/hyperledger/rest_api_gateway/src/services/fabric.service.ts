/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Contract,
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  GatewayOptions,
  Network,
  Transaction,
  Wallet,
  Wallets,
} from 'fabric-network';
import * as protos from 'fabric-protos';
import Long from 'long';
import * as config from './config';
import { handleError } from './errors';
import { logger } from './logger';

/**
 * Creates an in-memory wallet to hold credentials for all organizations.
 */
export const createWallet = async (): Promise<Wallet> => {
  const wallet = await Wallets.newInMemoryWallet();

  const organizations = [
    { id: config.mspIdOrg1, cert: config.certificateOrg1, key: config.privateKeyOrg1 },
    { id: config.mspIdOrg2, cert: config.certificateOrg2, key: config.privateKeyOrg2 },
    { id: config.mspIdOrg3, cert: config.certificateOrg3, key: config.privateKeyOrg3 },
    { id: config.mspIdOrg4, cert: config.certificateOrg4, key: config.privateKeyOrg4 },
    { id: config.mspIdOrg5, cert: config.certificateOrg5, key: config.privateKeyOrg5 },
    { id: config.mspIdSensorsOrg, cert: config.certificateSensorsOrg, key: config.privateKeySensorsOrg }, // SensorsOrg unified
  ];

  for (const org of organizations) {
    if (org.cert && org.key) {
      const identity = {
        credentials: {
          certificate: org.cert,
          privateKey: org.key,
        },
        mspId: org.id,
        type: 'X.509',
      };
      await wallet.put(org.id, identity);
    }
  }

  return wallet;
};

/**
 * Create a Gateway connection for any organization.
 */
export const createGateway = async (
    connectionProfile: Record<string, unknown>,
    identity: string,
    wallet: Wallet
): Promise<Gateway> => {
  logger.debug({ connectionProfile, identity }, 'Configuring gateway');

  const gateway = new Gateway();

  const options: GatewayOptions = {
    wallet,
    identity,
    discovery: { enabled: true, asLocalhost: config.asLocalhost },
    eventHandlerOptions: {
      commitTimeout: config.commitTimeout,
      endorseTimeout: config.endorseTimeout,
      strategy: DefaultEventHandlerStrategies.PREFER_MSPID_SCOPE_ANYFORTX,
    },
    queryHandlerOptions: {
      timeout: config.queryTimeout,
      strategy: DefaultQueryHandlerStrategies.PREFER_MSPID_SCOPE_ROUND_ROBIN,
    },
  };

  await gateway.connect(connectionProfile, options);

  return gateway;
};

/**
 * Get the network which the asset transfer sample chaincode is running on.
 */
export const getNetwork = async (gateway: Gateway): Promise<Network> => {
  return await gateway.getNetwork(config.channelName);
};

/**
 * Get the asset transfer sample contract and the qscc system contract.
 */
export const getContracts = async (
    network: Network,
    chaincode: string
): Promise<{ assetContract: Contract; qsccContract: Contract }> => {
  return {
    assetContract: network.getContract(chaincode),
    qsccContract: network.getContract('qscc'),
  };
};

/**
 * Evaluate a transaction and handle any errors.
 */
export const evaluateTransaction = async (
    contract: Contract,
    transactionName: string,
    ...transactionArgs: string[]
): Promise<Buffer> => {
  const transaction = contract.createTransaction(transactionName);
  const transactionId = transaction.getTransactionId();
  logger.trace({ transaction }, 'Evaluating transaction');

  try {
    const payload = await transaction.evaluate(...transactionArgs);
    logger.trace(
        { transactionId, payload: payload.toString() },
        'Evaluate transaction response received'
    );
    return payload;
  } catch (err) {
    throw handleError(transactionId, err);
  }
};

/**
 * Submit a transaction and handle any errors.
 */
export const submitTransaction = async (
    transaction: Transaction,
    ...transactionArgs: string[]
): Promise<Buffer> => {
  logger.trace({ transaction }, 'Submitting transaction');
  const txnId = transaction.getTransactionId();

  try {
    const payload = await transaction.submit(...transactionArgs);
    logger.trace(
        { transactionId: txnId, payload: payload.toString() },
        'Submit transaction response received'
    );
    return payload;
  } catch (err) {
    throw handleError(txnId, err);
  }
};

/**
 * Get the validation code of the specified transaction.
 */
export const getTransactionValidationCode = async (
    qsccContract: Contract,
    transactionId: string
): Promise<string> => {
  const data = await evaluateTransaction(
      qsccContract,
      'GetTransactionByID',
      config.channelName,
      transactionId
  );

  const processedTransaction = protos.protos.ProcessedTransaction.decode(data);
  const validationCode =
      protos.protos.TxValidationCode[processedTransaction.validationCode];

  logger.debug({ transactionId }, 'Validation code: %s', validationCode);
  return validationCode;
};

/**
 * Get the current block height.
 */
export const getBlockHeight = async (qscc: Contract): Promise<number | Long> => {
  const data = await qscc.evaluateTransaction('GetChainInfo', config.channelName);
  const info = protos.common.BlockchainInfo.decode(data);
  const blockHeight = info.height;

  logger.debug('Current block height: %d', blockHeight);
  return blockHeight;
};
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains all the error handling for Fabric transactions, including
 * whether a transaction should be retried.
 */

import { TimeoutError, TransactionError } from 'fabric-network';
import { logger } from './logger';

/**
 * Base type for errors from the smart contract.
 *
 * These errors will not be retried.
 */
export class ContractError extends Error {
  transactionId: string;

  constructor(message: string, transactionId: string) {
    super(message);
    Object.setPrototypeOf(this, ContractError.prototype);

    this.name = 'TransactionError';
    this.transactionId = transactionId;
  }
}

/**
 * Represents the error which occurs when the transaction being submitted or
 * evaluated is not implemented in a smart contract.
 */
export class TransactionNotFoundError extends ContractError {
  constructor(message: string, transactionId: string) {
    super(message, transactionId);
    Object.setPrototypeOf(this, TransactionNotFoundError.prototype);

    this.name = 'TransactionNotFoundError';
  }
}

/**
 * Represents the error which occurs when an asset already exists.
 */
export class AssetExistsError extends ContractError {
  constructor(message: string, transactionId: string) {
    super(message, transactionId);
    Object.setPrototypeOf(this, AssetExistsError.prototype);

    this.name = 'AssetExistsError';
  }
}

/**
 * Represents the error which occurs when an asset does not exist.
 */
export class AssetNotFoundError extends ContractError {
  constructor(message: string, transactionId: string) {
    super(message, transactionId);
    Object.setPrototypeOf(this, AssetNotFoundError.prototype);

    this.name = 'AssetNotFoundError';
  }
}

/**
 * Enumeration of possible retry actions.
 */
export enum RetryAction {
  WithExistingTransactionId,
  WithNewTransactionId,
  None,
}

/**
 * Get the required transaction retry action for an error.
 */
export const getRetryAction = (err: unknown): RetryAction => {
  if (isDuplicateTransactionError(err) || err instanceof ContractError) {
    return RetryAction.None;
  } else if (err instanceof TimeoutError) {
    return RetryAction.WithExistingTransactionId;
  }

  return RetryAction.WithNewTransactionId;
};

/**
 * Type guard to make catching unknown errors easier
 */
export const isErrorLike = (err: unknown): err is Error => {
  return (
    err != undefined &&
    err != null &&
    typeof (err as Error).name === 'string' &&
    typeof (err as Error).message === 'string' &&
    ((err as Error).stack === undefined ||
      typeof (err as Error).stack === 'string')
  );
};

/**
 * Checks whether an error was caused by a duplicate transaction.
 */
export const isDuplicateTransactionError = (err: unknown): boolean => {
  logger.debug({ err }, 'Checking for duplicate transaction error');

  if (err === undefined || err === null) return false;

  let isDuplicate;
  if (typeof (err as TransactionError).transactionCode === 'string') {
    isDuplicate =
      (err as TransactionError).transactionCode === 'DUPLICATE_TXID';
  } else {
    const endorsementError = err as {
      errors: { endorsements: { details: string }[] }[];
    };

    isDuplicate = endorsementError?.errors?.some((err) =>
      err?.endorsements?.some((endorsement) =>
        endorsement?.details?.startsWith('duplicate transaction found')
      )
    );
  }

  return isDuplicate === true;
};

/**
 * Matches asset already exists error messages.
 */
const matchAssetAlreadyExistsMessage = (message: string): string | null => {
  const regex = /([tT]he )?[aA]sset \w* already exists/g;
  const match = message.match(regex);
  logger.debug({ message, result: match }, 'Checking for asset exists message');
  return match ? match[0] : null;
};

/**
 * Matches asset does not exist error messages.
 */
const matchAssetDoesNotExistMessage = (message: string): string | null => {
  const regex = /([tT]he )?[aA]sset \w* does not exist/g;
  const match = message.match(regex);
  logger.debug({ message, result: match }, 'Checking for asset not found');
  return match ? match[0] : null;
};

/**
 * Matches transaction does not exist error messages.
 */
const matchTransactionDoesNotExistMessage = (
  message: string
): string | null => {
  const regex =
    /Failed to get transaction with id [^,]*, error (?:(?:Entry not found)|(?:no such transaction ID \[[^\]]*\])) in index/g;
  const match = message.match(regex);
  logger.debug(
    { message: message, result: match },
    'Checking for transaction not found'
  );
  return match ? match[0] : null;
};

/**
 * Handles errors from evaluating and submitting transactions.
 */
export const handleError = (
  transactionId: string,
  err: unknown
): Error | unknown => {
  logger.debug({ transactionId, err }, 'Processing error');

  if (isErrorLike(err)) {
    const assetAlreadyExistsMatch = matchAssetAlreadyExistsMessage(err.message);
    if (assetAlreadyExistsMatch !== null) {
      return new AssetExistsError(assetAlreadyExistsMatch, transactionId);
    }

    const assetDoesNotExistMatch = matchAssetDoesNotExistMessage(err.message);
    if (assetDoesNotExistMatch !== null) {
      return new AssetNotFoundError(assetDoesNotExistMatch, transactionId);
    }

    const transactionDoesNotExistMatch = matchTransactionDoesNotExistMessage(
      err.message
    );
    if (transactionDoesNotExistMatch !== null) {
      return new TransactionNotFoundError(
        transactionDoesNotExistMatch,
        transactionId
      );
    }
  }

  return err;
};

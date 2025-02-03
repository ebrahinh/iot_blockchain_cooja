/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeoutError, TransactionError } from 'fabric-network';
import {
  AssetExistsError,
  AssetNotFoundError,
  TransactionNotFoundError,
  getRetryAction,
  handleError,
  isDuplicateTransactionError,
  isErrorLike,
  RetryAction,
} from './errors';

import { mock } from 'jest-mock-extended';

describe('Errors', () => {
  describe('isErrorLike', () => {
    it('returns false for null', () => {
      expect(isErrorLike(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isErrorLike(undefined)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isErrorLike({})).toBe(false);
    });

    it('returns false for string', () => {
      expect(isErrorLike('true')).toBe(false);
    });

    it('returns false for non-error object', () => {
      expect(isErrorLike({ size: 42 })).toBe(false);
    });

    it('returns false for invalid error object', () => {
      expect(isErrorLike({ name: 'MockError', message: 42 })).toBe(false);
    });

    it('returns false for error-like object with invalid stack', () => {
      expect(
        isErrorLike({ name: 'MockError', message: 'Fail', stack: false })
      ).toBe(false);
    });

    it('returns true for error-like object', () => {
      expect(isErrorLike({ name: 'MockError', message: 'Fail' })).toBe(true);
    });

    it('returns true for new Error', () => {
      expect(isErrorLike(new Error('Error'))).toBe(true);
    });
  });

  describe('isDuplicateTransactionError', () => {
    it('returns true for a TransactionError with a transaction code of DUPLICATE_TXID', () => {
      const mockDuplicateTransactionError = mock<TransactionError>();
      mockDuplicateTransactionError.transactionCode = 'DUPLICATE_TXID';

      expect(isDuplicateTransactionError(mockDuplicateTransactionError)).toBe(
        true
      );
    });

    it('returns false for other transaction codes', () => {
      const mockTransactionError = mock<TransactionError>();
      mockTransactionError.transactionCode = 'MVCC_READ_CONFLICT';

      expect(isDuplicateTransactionError(mockTransactionError)).toBe(false);
    });

    it('returns false for an undefined error', () => {
      expect(isDuplicateTransactionError(undefined)).toBe(false);
    });

    it('returns false for a null error', () => {
      expect(isDuplicateTransactionError(null)).toBe(false);
    });
  });

  describe('getRetryAction', () => {
    it('returns RetryAction.None for duplicate transaction errors', () => {
      const mockDuplicateTransactionError = {
        errors: [
          {
            endorsements: [{ details: 'duplicate transaction found' }],
          },
        ],
      };

      expect(getRetryAction(mockDuplicateTransactionError)).toBe(
        RetryAction.None
      );
    });

    it('returns RetryAction.None for a TransactionNotFoundError', () => {
      const error = new TransactionNotFoundError(
        'Transaction txn1 not found',
        'txn1'
      );
      expect(getRetryAction(error)).toBe(RetryAction.None);
    });

    it('returns RetryAction.WithExistingTransactionId for TimeoutError', () => {
      const error = new TimeoutError('Mock timeout');
      expect(getRetryAction(error)).toBe(RetryAction.WithExistingTransactionId);
    });

    it('returns RetryAction.WithNewTransactionId for other errors', () => {
      const error = new Error('Mock error');
      expect(getRetryAction(error)).toBe(RetryAction.WithNewTransactionId);
    });
  });

  describe('handleError', () => {
    it.each([
      'the asset NETWORK already exists',
      'Asset SECURITY already exists',
      'The asset INTEGRITY already exists',
    ])(
      'returns AssetExistsError for asset already exists message: %s',
      (msg) => {
        expect(handleError('txn1', new Error(msg))).toStrictEqual(
          new AssetExistsError(msg, 'txn1')
        );
      }
    );

    it.each([
      'the asset NETWORK does not exist',
      'Asset SECURITY does not exist',
      'The asset INTEGRITY does not exist',
    ])(
      'returns AssetNotFoundError for asset does not exist message: %s',
      (msg) => {
        expect(handleError('txn1', new Error(msg))).toStrictEqual(
          new AssetNotFoundError(msg, 'txn1')
        );
      }
    );

    it.each([
      'Failed to get transaction txn1, error Entry not found in index',
      'Failed to get transaction txn2, error no such transaction ID [txn2] in index',
    ])(
      'returns TransactionNotFoundError for transaction does not exist message: %s',
      (msg) => {
        expect(handleError('txn1', new Error(msg))).toStrictEqual(
          new TransactionNotFoundError(msg, 'txn1')
        );
      }
    );

    it('returns the original error for other messages', () => {
      expect(handleError('txn1', new Error('MOCK ERROR'))).toStrictEqual(
        new Error('MOCK ERROR')
      );
    });

    it('returns the original error for non-error types', () => {
      expect(handleError('txn1', 42)).toEqual(42);
    });
  });
});

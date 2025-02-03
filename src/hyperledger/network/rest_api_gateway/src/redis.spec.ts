/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { isMaxmemoryPolicyNoeviction } from './redis';

const mockRedisConfig = jest.fn();
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      config: mockRedisConfig,
      disconnect: jest.fn(),
    };
  });
});
jest.mock('./config');

describe('Redis Configuration Tests', () => {
  beforeEach(() => {
    mockRedisConfig.mockClear();
  });

  describe('isMaxmemoryPolicyNoeviction', () => {
    it('Returns true when maxmemory-policy is set to noeviction', async () => {
      mockRedisConfig.mockResolvedValue(['maxmemory-policy', 'noeviction']);
      await expect(isMaxmemoryPolicyNoeviction()).resolves.toBe(true);
    });

    it('Returns false when maxmemory-policy is not noeviction', async () => {
      mockRedisConfig.mockResolvedValue(['maxmemory-policy', 'allkeys-lru']);
      await expect(isMaxmemoryPolicyNoeviction()).resolves.toBe(false);
    });

    it('Returns false when Redis config cannot be retrieved', async () => {
      mockRedisConfig.mockRejectedValue(new Error('Mock Redis Error'));
      await expect(isMaxmemoryPolicyNoeviction()).resolves.toBe(false);
    });
  });
});

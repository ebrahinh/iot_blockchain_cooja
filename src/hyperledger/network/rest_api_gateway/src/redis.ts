/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample uses the BullMQ queue system, which is built on top of Redis
 */

import IORedis, { Redis, RedisOptions } from 'ioredis';
import * as config from './config';
import { logger } from './logger';

/**
 * Check whether the maxmemory-policy config is set to noeviction
 *
 * BullMQ requires this setting in redis
 * For details, see: https://docs.bullmq.io/guide/connections
 */
export const isMaxmemoryPolicyNoeviction = async (): Promise<boolean> => {
  let redis: Redis | undefined;

  const redisOptions: RedisOptions = {
    port: config.redisPort,
    host: config.redisHost,
    username: config.redisUsername,
    password: config.redisPassword,
  };

  try {
    redis = new IORedis(redisOptions);
    logger.info('🔄 Connecting to Redis...');

    const maxmemoryPolicyConfig = await redis.config('GET', 'maxmemory-policy');
    logger.debug({ maxmemoryPolicyConfig }, 'Got maxmemory-policy config');

    if (
      maxmemoryPolicyConfig.length == 2 &&
      maxmemoryPolicyConfig[0] === 'maxmemory-policy' &&
      maxmemoryPolicyConfig[1] === 'noeviction'
    ) {
      logger.info('✅ Redis maxmemory-policy is correctly set to noeviction');
      return true;
    } else {
      logger.warn('⚠️ Redis maxmemory-policy is NOT set to noeviction');
    }
  } catch (error) {
    logger.error({ error }, '❌ Error checking Redis maxmemory-policy');
  } finally {
    if (redis != undefined) {
      redis.disconnect();
      logger.info('🔌 Disconnected from Redis');
    }
  }

  return false;
};

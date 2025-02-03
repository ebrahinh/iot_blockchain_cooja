/*
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-var-requires */

describe('Config values', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('logLevel', () => {
    it('defaults to "info"', () => {
      const config = require('./config');
      expect(config.logLevel).toBe('info');
    });

    it('can be configured using the "LOG_LEVEL" environment variable', () => {
      process.env.LOG_LEVEL = 'debug';
      const config = require('./config');
      expect(config.logLevel).toBe('debug');
    });

    it('throws an error when the "LOG_LEVEL" environment variable has an invalid log level', () => {
      process.env.LOG_LEVEL = 'ludicrous';
      expect(() => {
        require('./config');
      }).toThrow();
    });
  });

  describe('Organizations MSP IDs', () => {
    it('defaults for all organizations', () => {
      const config = require('./config');
      expect(config.mspIdOrg1).toBe('Org1MSP');
      expect(config.mspIdOrg2).toBe('Org2MSP');
      expect(config.mspIdOrg3).toBe('Org3MSP');
      expect(config.mspIdOrg4).toBe('Org4MSP');
      expect(config.mspIdOrg5).toBe('Org5MSP');
      expect(config.mspIdSecurityOrg).toBe('SecurityOrgMSP');
      expect(config.mspIdIntegrityOrg).toBe('IntegrityOrgMSP');
      expect(config.mspIdNetworkMobilityOrg).toBe('NetworkMobilityOrgMSP');
      expect(config.mspIdAvailabilitySensor).toBe('AvailabilitySensorMSP');
    });

    it('can be configured using environment variables', () => {
      process.env.HLF_MSP_ID_SECURITYORG = 'SecurityOrgMSPTest';
      process.env.HLF_MSP_ID_INTEGRITYORG = 'IntegrityOrgMSPTest';
      process.env.HLF_MSP_ID_NETWORKMOBILITYORG = 'NetworkMobilityOrgMSPTest';
      process.env.HLF_MSP_ID_AVAILABILITYSENSOR = 'AvailabilitySensorMSPTest';

      const config = require('./config');

      expect(config.mspIdSecurityOrg).toBe('SecurityOrgMSPTest');
      expect(config.mspIdIntegrityOrg).toBe('IntegrityOrgMSPTest');
      expect(config.mspIdNetworkMobilityOrg).toBe('NetworkMobilityOrgMSPTest');
      expect(config.mspIdAvailabilitySensor).toBe('AvailabilitySensorMSPTest');
    });
  });

  describe('Connection Profiles', () => {
    it('throws error if not set', () => {
      delete process.env.HLF_CONNECTION_PROFILE_SECURITYORG;
      expect(() => require('./config')).toThrow();
    });

    it('can be set using environment variables', () => {
      process.env.HLF_CONNECTION_PROFILE_SECURITYORG = '{"name":"test-network-securityorg"}';
      process.env.HLF_CONNECTION_PROFILE_INTEGRITYORG = '{"name":"test-network-integrityorg"}';
      process.env.HLF_CONNECTION_PROFILE_NETWORKMOBILITYORG = '{"name":"test-network-networkmobilityorg"}';
      process.env.HLF_CONNECTION_PROFILE_AVAILABILITYSENSOR = '{"name":"test-network-availabilitysensor"}';

      const config = require('./config');

      expect(config.connectionProfileSecurityOrg).toStrictEqual({
        name: 'test-network-securityorg',
      });
      expect(config.connectionProfileIntegrityOrg).toStrictEqual({
        name: 'test-network-integrityorg',
      });
      expect(config.connectionProfileNetworkMobilityOrg).toStrictEqual({
        name: 'test-network-networkmobilityorg',
      });
      expect(config.connectionProfileAvailabilitySensor).toStrictEqual({
        name: 'test-network-availabilitysensor',
      });
    });
  });

  describe('API Keys', () => {
    it('throws error if not set', () => {
      delete process.env.SECURITYORG_APIKEY;
      delete process.env.INTEGRITYORG_APIKEY;
      delete process.env.NETWORKMOBILITYORG_APIKEY;
      delete process.env.AVAILABILITYSENSOR_APIKEY;
      expect(() => require('./config')).toThrow();
    });

    it('can be configured using environment variables', () => {
      process.env.SECURITYORG_APIKEY = 'apiKeySecurityOrg';
      process.env.INTEGRITYORG_APIKEY = 'apiKeyIntegrityOrg';
      process.env.NETWORKMOBILITYORG_APIKEY = 'apiKeyNetworkMobilityOrg';
      process.env.AVAILABILITYSENSOR_APIKEY = 'apiKeyAvailabilitySensor';

      const config = require('./config');

      expect(config.securityOrgApiKey).toBe('apiKeySecurityOrg');
      expect(config.integrityOrgApiKey).toBe('apiKeyIntegrityOrg');
      expect(config.networkMobilityOrgApiKey).toBe('apiKeyNetworkMobilityOrg');
      expect(config.availabilitySensorApiKey).toBe('apiKeyAvailabilitySensor');
    });
  });

  describe('Transaction Timeouts', () => {
    it('defaults to commit: 300, endorse: 30, query: 3', () => {
      const config = require('./config');
      expect(config.commitTimeout).toBe(300);
      expect(config.endorseTimeout).toBe(30);
      expect(config.queryTimeout).toBe(3);
    });

    it('can be set using environment variables', () => {
      process.env.HLF_COMMIT_TIMEOUT = '500';
      process.env.HLF_ENDORSE_TIMEOUT = '60';
      process.env.HLF_QUERY_TIMEOUT = '10';
      const config = require('./config');

      expect(config.commitTimeout).toBe(500);
      expect(config.endorseTimeout).toBe(60);
      expect(config.queryTimeout).toBe(10);
    });
  });

  describe('Redis Configuration', () => {
    it('defaults to "localhost" and "6379"', () => {
      const config = require('./config');
      expect(config.redisHost).toBe('localhost');
      expect(config.redisPort).toBe(6379);
    });

    it('can be set using environment variables', () => {
      process.env.REDIS_HOST = 'redis.example.org';
      process.env.REDIS_PORT = '9736';
      const config = require('./config');

      expect(config.redisHost).toBe('redis.example.org');
      expect(config.redisPort).toBe(9736);
    });
  });
});

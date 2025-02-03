/*
 * SPDX-License-Identifier: Apache-2.0
 */

import * as env from 'env-var';

// Existing organizations
export const ORG1 = 'Org1';
export const ORG2 = 'Org2';
export const ORG3 = 'Org3';
export const ORG4 = 'Org4';
export const ORG5 = 'Org5';

// New organizations
export const SECURITY_ORG = 'SecurityOrg';
export const INTEGRITY_ORG = 'IntegrityOrg';
export const NETWORK_MOBILITY_ORG = 'NetworkMobilityOrg';
export const AVAILABILITY_SENSOR = 'AvailabilitySensor';

export const JOB_QUEUE_NAME = 'submit';

/**
 * Log level for the REST server
 */
export const logLevel = env
  .get('LOG_LEVEL')
  .default('info')
  .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

/**
 * The port to start the REST server on
 */
export const port = env.get('PORT').default('3000').asPortNumber();

/**
 * Name of the channel which the basic asset sample chaincode has been installed on
 */
export const channelName = env.get('HLF_CHANNEL_NAME').default('mychannel').asString();

/**
 * Name used to install the basic asset sample
 */
export const chaincodeName = env.get('HLF_CHAINCODE_NAME').default('basic').asString();

/**
 * The transaction submit timeout in seconds for commit notification to complete
 */
export const commitTimeout = env.get('HLF_COMMIT_TIMEOUT').default('300').asIntPositive();

/**
 * The transaction submit timeout in seconds for the endorsement to complete
 */
export const endorseTimeout = env.get('HLF_ENDORSE_TIMEOUT').default('30').asIntPositive();

/**
 * The transaction query timeout in seconds
 */
export const queryTimeout = env.get('HLF_QUERY_TIMEOUT').default('3').asIntPositive();

// MSP IDs for all organizations
export const mspIdOrg1 = env.get('HLF_MSP_ID_ORG1').default(`${ORG1}MSP`).asString();
export const mspIdOrg2 = env.get('HLF_MSP_ID_ORG2').default(`${ORG2}MSP`).asString();
export const mspIdOrg3 = env.get('HLF_MSP_ID_ORG3').default(`${ORG3}MSP`).asString();
export const mspIdOrg4 = env.get('HLF_MSP_ID_ORG4').default(`${ORG4}MSP`).asString();
export const mspIdOrg5 = env.get('HLF_MSP_ID_ORG5').default(`${ORG5}MSP`).asString();

export const mspIdSecurityOrg = env.get('HLF_MSP_ID_SECURITY_ORG').default(`${SECURITY_ORG}MSP`).asString();
export const mspIdIntegrityOrg = env.get('HLF_MSP_ID_INTEGRITY_ORG').default(`${INTEGRITY_ORG}MSP`).asString();
export const mspIdNetworkMobilityOrg = env.get('HLF_MSP_ID_NETWORK_MOBILITY_ORG').default(`${NETWORK_MOBILITY_ORG}MSP`).asString();
export const mspIdAvailabilitySensor = env.get('HLF_MSP_ID_AVAILABILITY_SENSOR').default(`${AVAILABILITY_SENSOR}MSP`).asString();

// API Keys for authentication
export const org1ApiKey = env.get('ORG1_APIKEY').required().asString();
export const org2ApiKey = env.get('ORG2_APIKEY').required().asString();
export const org3ApiKey = env.get('ORG3_APIKEY').required().asString();
export const org4ApiKey = env.get('ORG4_APIKEY').required().asString();
export const org5ApiKey = env.get('ORG5_APIKEY').required().asString();

export const securityOrgApiKey = env.get('SECURITY_ORG_APIKEY').required().asString();
export const integrityOrgApiKey = env.get('INTEGRITY_ORG_APIKEY').required().asString();
export const networkMobilityOrgApiKey = env.get('NETWORK_MOBILITY_ORG_APIKEY').required().asString();
export const availabilitySensorApiKey = env.get('AVAILABILITY_SENSOR_APIKEY').required().asString();

// Connection Profiles for each organization
export const connectionProfileOrg1 = env.get('HLF_CONNECTION_PROFILE_ORG1').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileOrg2 = env.get('HLF_CONNECTION_PROFILE_ORG2').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileOrg3 = env.get('HLF_CONNECTION_PROFILE_ORG3').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileOrg4 = env.get('HLF_CONNECTION_PROFILE_ORG4').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileOrg5 = env.get('HLF_CONNECTION_PROFILE_ORG5').required().asJsonObject() as Record<string, unknown>;

export const connectionProfileSecurityOrg = env.get('HLF_CONNECTION_PROFILE_SECURITY_ORG').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileIntegrityOrg = env.get('HLF_CONNECTION_PROFILE_INTEGRITY_ORG').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileNetworkMobilityOrg = env.get('HLF_CONNECTION_PROFILE_NETWORK_MOBILITY_ORG').required().asJsonObject() as Record<string, unknown>;
export const connectionProfileAvailabilitySensor = env.get('HLF_CONNECTION_PROFILE_AVAILABILITY_SENSOR').required().asJsonObject() as Record<string, unknown>;

// Certificates for each organization
export const certificateOrg1 = env.get('HLF_CERTIFICATE_ORG1').required().asString();
export const certificateOrg2 = env.get('HLF_CERTIFICATE_ORG2').required().asString();
export const certificateOrg3 = env.get('HLF_CERTIFICATE_ORG3').required().asString();
export const certificateOrg4 = env.get('HLF_CERTIFICATE_ORG4').required().asString();
export const certificateOrg5 = env.get('HLF_CERTIFICATE_ORG5').required().asString();

export const certificateSecurityOrg = env.get('HLF_CERTIFICATE_SECURITY_ORG').required().asString();
export const certificateIntegrityOrg = env.get('HLF_CERTIFICATE_INTEGRITY_ORG').required().asString();
export const certificateNetworkMobilityOrg = env.get('HLF_CERTIFICATE_NETWORK_MOBILITY_ORG').required().asString();
export const certificateAvailabilitySensor = env.get('HLF_CERTIFICATE_AVAILABILITY_SENSOR').required().asString();

// Private Keys for each organization
export const privateKeyOrg1 = env.get('HLF_PRIVATE_KEY_ORG1').required().asString();
export const privateKeyOrg2 = env.get('HLF_PRIVATE_KEY_ORG2').required().asString();
export const privateKeyOrg3 = env.get('HLF_PRIVATE_KEY_ORG3').required().asString();
export const privateKeyOrg4 = env.get('HLF_PRIVATE_KEY_ORG4').required().asString();
export const privateKeyOrg5 = env.get('HLF_PRIVATE_KEY_ORG5').required().asString();

export const privateKeySecurityOrg = env.get('HLF_PRIVATE_KEY_SECURITY_ORG').required().asString();
export const privateKeyIntegrityOrg = env.get('HLF_PRIVATE_KEY_INTEGRITY_ORG').required().asString();
export const privateKeyNetworkMobilityOrg = env.get('HLF_PRIVATE_KEY_NETWORK_MOBILITY_ORG').required().asString();
export const privateKeyAvailabilitySensor = env.get('HLF_PRIVATE_KEY_AVAILABILITY_SENSOR').required().asString();

// Redis Configuration
export const redisHost = env.get('REDIS_HOST').default('localhost').asString();
export const redisPort = env.get('REDIS_PORT').default('6379').asPortNumber();
export const redisUsername = env.get('REDIS_USERNAME').asString();
export const redisPassword = env.get('REDIS_PASSWORD').asString();

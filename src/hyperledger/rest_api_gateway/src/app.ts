const sensorsOrg = {
  name: 'SensorsOrg',
  mspId: 'SensorsOrgMSP',
  peer: 'peer0.sensors.example.com',
  configProfile: config.connectionProfileSensorsOrg,
};

const chaincodes = [
  {contract: 'availabilitycc', name: 'AvailabilitySensor'},
  {contract: 'securitycc', name: 'SecuritySensor'},
  {contract: 'mobilitycc', name: 'MobilitySensor'},
  {contract: 'integritycc', name: 'IntegritySensor'},
  {contract: 'networkcc', name: 'NetworkMobilitySensor'},
];

async function main() {
  try {
    await checkRedisConfig();
    const app = await initializeRestServer();
    const network = await initializeBlockchainConnection();
    await initializeContracts(network, app);
    await initializeJobQueue(app);
    startServer(app);
  } catch (error) {
    logger.error({err: error}, 'Application initialization failed');
    await cleanUp();
    process.exit(1);
  }
}

async function checkRedisConfig() {
  logger.info('Checking Redis config.env');
  if (!(await isMaxmemoryPolicyNoeviction())) {
    throw new Error(
        'Invalid Redis configuration: maxmemory-policy=noeviction is required.'
    );
  }
}

async function initializeRestServer() {
  logger.info('Creating REST server');
  return await createServer();
}

async function initializeBlockchainConnection() {
  try {
    logger.info('Connecting to Fabric network for SensorsOrg');
    const wallet = await createWallet();
    const gateway = await createGateway(
        sensorsOrg.configProfile,
        sensorsOrg.mspId,
        wallet
    );
    return await getNetwork(gateway);
  } catch (error) {
    logger.error('Failed to initialize Fabric network connection', {error});
    throw error;
  }
}

async function initializeContracts(network: any, app: any) {
  try {
    logger.info('Initializing smart contracts for SensorsOrg');
    const contractInstances = await Promise.all(
        chaincodes.map(async (chaincode) => {
          const {name, contract} = chaincode;
          logger.info(`Connecting ${name} (${contract})`);
          return {
            name,
            instance: await getContracts(network, contract),
          };
        })
    );

    // Store contract instances in app.locals
    contractInstances.forEach(({name, instance}) => {
      app.locals[name] = instance;
    });
    logger.info('Successfully connected all contracts.');
  } catch (error) {
    logger.error('Failed to initialize smart contracts', {error});
    throw error;
  }
}

async function initializeJobQueue(app: any) {
  try {
    logger.info('Initializing job queue');
    app.locals.jobq = initJobQueue();
    jobQueueWorker = initJobQueueWorker(app);

    if (config.submitJobQueueScheduler) {
      logger.info('Initializing job queue scheduler');
      jobQueueScheduler = initJobQueueScheduler();
    }
  } catch (error) {
    logger.error('Failed to initialize job queue system', {error});
    throw error;
  }
}

function startServer(app: any) {
  logger.info('Starting REST server');
  app.listen(config.port, () => {
    logger.info('REST server started on port: %d', config.port);
  });
}

async function cleanUp() {
  if (jobQueueScheduler) {
    logger.debug('Closing job queue scheduler');
    await jobQueueScheduler.close();
  }
  if (jobQueueWorker) {
    logger.debug('Closing job queue worker');
    await jobQueueWorker.close();
  }
  if (jobQueue) {
    logger.debug('Closing job queue');
    await jobQueue.close();
  }
}

main().catch((err) => {
  // Final fallback in case of unexpected errors
  logger.error({err}, 'Unexpected error in main execution');
  process.exit(1);
});
/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample uses BullMQ jobs to process submit transactions, which includes
 * retry support for failing jobs
 */

import { ConnectionOptions, Job, Queue, QueueScheduler, Worker } from 'bullmq';
import { Application } from 'express';
import { Contract, Transaction } from 'fabric-network';
import * as config from './config';
import { getRetryAction, RetryAction } from './errors';
import { submitTransaction } from './fabric';
import { logger } from './logger';

export type JobData = {
  mspid: string;
  transactionName: string;
  transactionArgs: string[];
  transactionState?: Buffer;
  transactionIds: string[];
};

export type JobResult = {
  transactionPayload?: Buffer;
  transactionError?: string;
};

export type JobSummary = {
  jobId: string;
  transactionIds: string[];
  transactionPayload?: string;
  transactionError?: string;
};

export class JobNotFoundError extends Error {
  jobId: string;

  constructor(message: string, jobId: string) {
    super(message);
    Object.setPrototypeOf(this, JobNotFoundError.prototype);

    this.name = 'JobNotFoundError';
    this.jobId = jobId;
  }
}

const connection: ConnectionOptions = {
  port: config.redisPort,
  host: config.redisHost,
  username: config.redisUsername,
  password: config.redisPassword,
};

/**
 * Set up the queue for submit jobs
 */
export const initJobQueue = (): Queue => {
  return new Queue(config.JOB_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: config.submitJobAttempts,
      backoff: {
        type: config.submitJobBackoffType,
        delay: config.submitJobBackoffDelay,
      },
      removeOnComplete: config.maxCompletedSubmitJobs,
      removeOnFail: config.maxFailedSubmitJobs,
    },
  });
};

/**
 * Set up a worker to process submit jobs
 */
export const initJobQueueWorker = (app: Application): Worker => {
  const worker = new Worker<JobData, JobResult>(
    config.JOB_QUEUE_NAME,
    async (job): Promise<JobResult> => {
      return await processSubmitTransactionJob(app, job);
    },
    { connection, concurrency: config.submitJobConcurrency }
  );

  worker.on('failed', (job) => {
    logger.warn({ job }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  if (logger.isLevelEnabled('debug')) {
    worker.on('completed', (job) => {
      logger.debug({ job }, 'Job completed');
    });
  }

  return worker;
};

/**
 * Process a submit transaction request from the job queue
 */
export const processSubmitTransactionJob = async (
  app: Application,
  job: Job<JobData, JobResult>
): Promise<JobResult> => {
  logger.debug({ jobId: job.id, jobName: job.name }, 'Processing job');

  const contract = app.locals[job.data.mspid]?.assetContract as Contract;
  if (!contract) {
    logger.error(
      { jobId: job.id, jobName: job.name },
      'Contract not found for MSP ID %s',
      job.data.mspid
    );

    return { transactionError: undefined, transactionPayload: undefined };
  }

  const args = job.data.transactionArgs;
  let transaction: Transaction;

  if (job.data.transactionState) {
    logger.debug(
      { jobId: job.id, jobName: job.name },
      'Reusing previously saved transaction state'
    );
    transaction = contract.deserializeTransaction(job.data.transactionState);
  } else {
    logger.debug(
      { jobId: job.id, jobName: job.name },
      'Using new transaction'
    );
    transaction = contract.createTransaction(job.data.transactionName);
    await updateJobData(job, transaction);
  }

  logger.debug(
    { jobId: job.id, jobName: job.name, transactionId: transaction.getTransactionId() },
    'Submitting transaction'
  );

  try {
    const payload = await submitTransaction(transaction, ...args);
    return { transactionError: undefined, transactionPayload: payload };
  } catch (err) {
    const retryAction = getRetryAction(err);

    if (retryAction === RetryAction.None) {
      logger.error(
        { jobId: job.id, jobName: job.name, err },
        'Fatal transaction error occurred'
      );
      return { transactionError: `${err}`, transactionPayload: undefined };
    }

    logger.warn(
      { jobId: job.id, jobName: job.name, err },
      'Retryable transaction error occurred'
    );

    if (retryAction === RetryAction.WithNewTransactionId) {
      logger.debug({ jobId: job.id, jobName: job.name }, 'Clearing saved transaction state');
      await updateJobData(job, undefined);
    }

    throw err;
  }
};

/**
 * Set up a scheduler for the submit job queue
 */
export const initJobQueueScheduler = (): QueueScheduler => {
  const queueScheduler = new QueueScheduler(config.JOB_QUEUE_NAME, { connection });

  queueScheduler.on('failed', (jobId, failedReason) => {
    logger.error({ jobId, failedReason }, 'Queue scheduler failure');
  });

  return queueScheduler;
};

/**
 * Helper to add a new submit transaction job to the queue
 */
export const addSubmitTransactionJob = async (
  submitQueue: Queue<JobData, JobResult>,
  mspid: string,
  transactionName: string,
  ...transactionArgs: string[]
): Promise<string> => {
  const job = await submitQueue.add(`submit ${transactionName} transaction`, {
    mspid,
    transactionName,
    transactionArgs: transactionArgs,
    transactionIds: [],
  });

  if (!job.id) {
    throw new Error('Submit transaction job ID not available');
  }

  return job.id;
};

/**
 * Helper to update the data for an existing job
 */
export const updateJobData = async (
  job: Job<JobData, JobResult>,
  transaction?: Transaction
): Promise<void> => {
  const newData = { ...job.data };

  if (transaction) {
    newData.transactionIds.push(transaction.getTransactionId());
    newData.transactionState = transaction.serialize();
  } else {
    newData.transactionState = undefined;
  }

  await job.update(newData);
};

/**
 * Gets a job summary for the REST API
 */
export const getJobSummary = async (queue: Queue, jobId: string): Promise<JobSummary> => {
  const job = await queue.getJob(jobId);
  if (!job) throw new JobNotFoundError(`Job ${jobId} not found`, jobId);

  return {
    jobId: job.id,
    transactionIds: job.data?.transactionIds || [],
    transactionError: job.returnvalue?.transactionError,
    transactionPayload: job.returnvalue?.transactionPayload?.toString() || '',
  };
};

/**
 * Get the current job counts
 */
export const getJobCounts = async (queue: Queue): Promise<{ [index: string]: number }> => {
  return queue.getJobCounts('active', 'completed', 'delayed', 'failed', 'waiting');
};

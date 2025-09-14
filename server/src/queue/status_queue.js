import { Queue, Worker } from 'bullmq';
import { redisConnection } from './config.js';
import db from '../db/index.js';

// Create a queue for job status updates
export const statusQueue = new Queue('status_queue', { connection: redisConnection });

// Create a worker to process job status updates
const statusWorker = new Worker(
  'status_queue',
  async (job) => {
    const { jobId, status, result, log } = job.data;
    
    try {
      // Update job status in database
      if (status) {
        await db.updateJobStatus(jobId, status, result);
      }
      
      // Save log if provided
      if (log) {
        await db.saveJobLog(jobId, log.type, log.content);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`[ERROR] Failed to update job status in database: ${error.message}`);
      throw error;
    }
  },
  { connection: redisConnection }
);

// Handle worker events
statusWorker.on('completed', job => {
  console.log(`Status update for job ${job.data.jobId} completed`);
});

statusWorker.on('failed', (job, error) => {
  console.error(`Status update for job ${job.data.jobId} failed: ${error.message}`);
});

/**
 * Add a job status update to the queue
 * @param {string} jobId - The job ID
 * @param {string} status - The job status
 * @param {Object} [result] - Optional result object
 * @returns {Promise<Object>} - The added job
 */
export async function queueStatusUpdate(jobId, status, result = null) {
  return await statusQueue.add('status-update', { 
    jobId, 
    status, 
    result,
    timestamp: new Date().toISOString()
  });
}

/**
 * Add a job log to the queue
 * @param {string} jobId - The job ID
 * @param {string} type - The log type (stdout or stderr)
 * @param {string} content - The log content
 * @returns {Promise<Object>} - The added job
 */
export async function queueLogUpdate(jobId, type, content) {
  return await statusQueue.add('log-update', { 
    jobId, 
    log: { type, content },
    timestamp: new Date().toISOString()
  });
}

export default {
  statusQueue,
  statusWorker,
  queueStatusUpdate,
  queueLogUpdate
};

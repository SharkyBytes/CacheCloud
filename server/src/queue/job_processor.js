import { Worker } from 'bullmq';
import { redisConnection, QUEUE_CONFIG } from './config.js';
import { resourceManager } from './resource_manager.js';
import { runJobInContainer } from '../docker/index.js';
import { queueStatusUpdate, queueLogUpdate } from './status_queue.js';
import db from '../db/index.js';

// Initialize the system
resourceManager.initialize().catch(err => {
  console.error('[ERROR] Failed to initialize system:', err);
  process.exit(1);
});

// Create a worker to process jobs
const worker = new Worker(
  'job_queue',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log('Job data:', job.data);
    
    try {
      // Save job to database
      await db.saveJob(job, 'waiting');
      
      // Queue status update
      await queueStatusUpdate(job.id, 'waiting');
    } catch (dbError) {
      console.error(`[ERROR] Failed to save job to database: ${dbError.message}`);
    }
    
    // Check if we have resources to run this job
    if (!await resourceManager.checkResources()) {
      console.log(`[INFO] Job ${job.id} delayed due to resource constraints`);
      // Requeue the job with a delay
      await job.moveToDelayed(Date.now() + 10000);
      
      // Queue status update
      await queueStatusUpdate(job.id, 'delayed');
      
      return { status: 'delayed', message: 'Job delayed due to resource constraints' };
    }
    
    // Queue status update - job is now active
    await queueStatusUpdate(job.id, 'active');
    
    // Run the job in Docker
    const result = await runJobInContainer(
      job, 
      resourceManager.getWorkspaceDir(), 
      resourceManager
    );
    
    if (result.status === 'success') {
      console.log(`Job ${job.id} completed successfully`);
      return { 
        status: 'success', 
        message: 'Job processed successfully',
        output: result.output,
        exitCode: result.exitCode
      };
    } else {
      throw new Error(result.error || 'Job failed');
    }
  },
  { 
    connection: redisConnection, 
    concurrency: resourceManager.getMaxConcurrentContainers() 
  }
);

// Worker event handlers
worker.on('completed', async (job, result) => {
  console.log(`Job ${job.id} has been completed`);
  
  try {
    // Queue status update
    await queueStatusUpdate(job.id, 'completed', {
      exitCode: result.exitCode || 0,
      duration: Date.now() - job.timestamp
    });
  } catch (error) {
    console.error(`[ERROR] Failed to queue status update: ${error.message}`);
  }
});

worker.on('failed', async (job, err) => {
  console.error(`Job ${job.id} has failed with error ${err.message}`);
  
  try {
    // Queue status update
    await queueStatusUpdate(job.id, 'failed', {
      exitCode: 1,
      duration: Date.now() - job.timestamp
    });
    
    // Queue error log
    await queueLogUpdate(job.id, 'stderr', err.message);
  } catch (error) {
    console.error(`[ERROR] Failed to queue status update: ${error.message}`);
  }
});

worker.on('error', err => {
  console.error('Worker error:', err);
});

console.log('Job processor worker started');

export default worker;
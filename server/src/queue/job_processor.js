import { Worker } from 'bullmq';
import { redisConnection, QUEUE_CONFIG } from './config.js';
import { resourceManager } from './resource_manager.js';
import { runJobInContainer } from '../docker/index.js';

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
    
    // Check if we have resources to run this job
    if (!await resourceManager.checkResources()) {
      console.log(`[INFO] Job ${job.id} delayed due to resource constraints`);
      // Requeue the job with a delay
      await job.moveToDelayed(Date.now() + 10000);
      return { status: 'delayed', message: 'Job delayed due to resource constraints' };
    }
    
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
worker.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} has failed with error ${err.message}`);
});

worker.on('error', err => {
  console.error('Worker error:', err);
});

console.log('Job processor worker started');

export default worker;
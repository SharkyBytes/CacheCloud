import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { redis_connection_string } from '../config/redis_config.js';

const connection = new IORedis(redis_connection_string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Create a worker to process jobs
const worker = new Worker(
  'job_queue',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log('Job data:', job.data);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Job ${job.id} completed successfully`);
    return { status: 'success', message: 'Job processed successfully' };
  },
  { connection }
);


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

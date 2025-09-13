import IORedis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";
import { redis_connection_string } from "../config/redis_config.js";

const connection = new IORedis(redis_connection_string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const job_queue = new Queue("job_queue", { connection });

await job_queue.add("send_email", {
  to: "abc@gmail.com",
  subject: "hi there",
});

const queueEvents = new QueueEvents("job_queue", { connection });
queueEvents.on("waiting", ({ jobId }) => {
  console.log(`Job ${jobId} waiting`);
});

const worker = new Worker(
  "job_queue",
  async (job) => {
    console.log(`Processing job ${job.id}`, job.data);
  },
  { connection }
);

export { job_queue };

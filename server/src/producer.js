import { job_queue } from "./queue/job_queue.js";

async function px(i) {
  await job_queue.add("send_email", {
    to: `me${i}@gaurav`,
    subject: `Hi there, this is job #${i} from producer`,
  });
  console.log(`Job ${i} added`);
}

async function main() {
  for (let i = 0; i < 10; i++) {
    await px(i);
  }

}

main().then(() => {
  console.log("All jobs added ✅");
  process.exit(0); 
});

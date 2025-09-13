import { redis_connection_string } from "../config/redis_config.js";
import {Queue,Worker} from 'bullmq'

const job_queue = new Queue(
    'job_queue',
    {
        connection:redis_connection_string,
    }
)


await job_queue.add('job_queue',{
    to:"abc@gmail.com",
    "subject":"hi there"
})

job_queue.on('waiting',(jobid)=>{
    console.log(`job ${jobid}added`);
})
export {job_queue}
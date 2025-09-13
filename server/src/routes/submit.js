import { Router } from "express";
import { job_queue } from "../queue/job_queue.js";
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { 
            git_link, 
            start_directory = "", 
            initial_cmds = ["npm install"], 
            env_file = ".env", 
            build_cmd = "node index.js",
            memory_limit = "512MB",
            timeout = 300000, // 5 minutes in milliseconds
            runtime = "nodejs" // nodejs, python, etc.
        } = req.body;

        // Validate required fields
        if (!git_link) {
            return res.status(400).json({ 
                success: false, 
                error: "GitHub repository URL is required" 
            });
        }

        // Generate a unique job ID
        const jobId = uuidv4().substring(0, 8);

        // Create job payload
        const jobPayload = {
            git_link,
            start_directory,
            initial_cmds,
            env_file,
            build_cmd,
            memory_limit,
            timeout,
            runtime,
            submitted_at: new Date().toISOString()
        };

        console.log(`[INFO] Submitting job: ${jobId}`);
        
        // Add job to queue
        const job = await job_queue.add('process-repo', jobPayload, {
            jobId,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            removeOnComplete: false,
            removeOnFail: false
        });

        console.log(`[SUCCESS] Job added to queue with ID: ${job.id}`);

        res.status(200).json({
            success: true,
            jobId: job.id,
            message: "Job submitted successfully",
            status: "queued"
        });
    } catch (err) {
        console.error("[ERROR] Failed to submit job:", err);
        res.status(500).json({
            success: false,
            error: err.message || "Failed to submit job"
        });
    }
});

export default router;
import { Router } from "express";
import { job_queue } from "../queue/job_queue.js";
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Handle both GET and POST requests
const handleSubmit = async (req, res) => {
    try {
        // Get data from either query params (GET) or request body (POST)
        const data = req.method === 'GET' ? req.query : req.body;
        
        // Parse the data properly
        const git_link = data.git_link;
        const start_directory = data.start_directory || "";
        const initial_cmds = Array.isArray(data.initial_cmds) 
            ? data.initial_cmds 
            : (data.initial_cmds ? [data.initial_cmds] : ["npm install"]);
        const env_file = data.env_file; // Optional, no default
        const build_cmd = data.build_cmd || "node index.js";
        const memory_limit = data.memory_limit || "512MB";
        const timeout = parseInt(data.timeout) || 300000;
        const runtime = data.runtime || "nodejs";
        const env = data.env || {};

        // Validate required fields
        if (!git_link) {
            return res.status(400).json({ 
                success: false, 
                error: "GitHub repository URL is required" 
            });
        }

        // Generate a unique job ID (ensure it's a string with a letter prefix)
        const jobId = 'job_' + uuidv4().substring(0, 8);

        // Create job payload
        const jobPayload = {
            git_link,
            start_directory,
            initial_cmds,
            build_cmd,
            memory_limit,
            timeout,
            runtime,
            submitted_at: new Date().toISOString(),
            env
        };
        
        // Only add env_file if it's provided
        if (env_file) {
            jobPayload.env_file = env_file;
        }

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
};

// Register both GET and POST handlers
router.get("/", handleSubmit);
router.post("/", handleSubmit);

export default router;
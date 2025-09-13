import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { redis_connection_string } from '../config/redis_config.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);
const connection = new IORedis(redis_connection_string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Configuration
const MAX_CONCURRENT_CONTAINERS = 3;
const WORKSPACE_DIR = path.join(os.tmpdir(), 'e6data-workspaces');

// Track active containers
let activeContainers = 0;

// Create workspace directory if it doesn't exist
async function ensureWorkspaceDir() {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  console.log(`Workspace directory created at ${WORKSPACE_DIR}`);
}

// Check system resources
async function checkResources() {
  // Check if we have capacity for another container
  if (activeContainers >= MAX_CONCURRENT_CONTAINERS) {
    return false;
  }
  
  // Could add more sophisticated checks here (CPU, memory, etc.)
  return true;
}

// Run a job in a Docker container
async function runInDocker(job) {
  const { 
    git_link, 
    start_directory = "", 
    initial_cmds = ["npm install"], 
    env_file, // Make env_file optional
    build_cmd = "node index.js",
    memory_limit = "512MB",
    timeout = 300000,
    runtime = "nodejs",
    env = {}
  } = job.data;
  
  const jobId = job.id;
  const workDir = path.join(WORKSPACE_DIR, jobId);
  
  try {
    // Create job directory
    await fs.mkdir(workDir, { recursive: true });
    console.log(`Created workspace for job ${jobId} at ${workDir}`);
    
    // Determine Docker image based on runtime
    // Use images that include git
    let dockerImage = 'node:18';  // Full image includes git
    switch (runtime.toLowerCase()) {
      case 'python':
        dockerImage = 'python:3.10';  // Full image includes git
        break;
      case 'java':
        dockerImage = 'openjdk:17';  // Full image includes git
        break;
      // Add more runtimes as needed
    }
    
    // Increment active containers
    activeContainers++;
    console.log(`Active containers: ${activeContainers}/${MAX_CONCURRENT_CONTAINERS}`);
    
    // Prepare environment variables
    const envArgs = Object.entries(env).map(([key, value]) => `--env ${key}=${value}`).join(' ');
    
    // Format the path for Docker volume mounting (handle Windows paths)
    const isWindows = os.platform() === 'win32';
    let formattedWorkDir = workDir;
    
    if (isWindows) {
      // Convert Windows path to Docker-compatible path (e.g., C:\path\to\dir -> /c/path/to/dir)
      formattedWorkDir = workDir
        .replace(/\\/g, '/')
        .replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`);
    }
    
    // Build the Docker command
    let dockerCmd = '';
    
    if (isWindows) {
      // For Windows, use a different volume mount syntax
      dockerCmd = `docker run --rm ` +
        `--name e6data-${jobId} ` +
        `--memory=${memory_limit} ` +
        `--workdir=/app ` +
        `-v "${workDir}:/app" ` +
        `${envArgs} ` +
        `${dockerImage} ` +
        `/bin/sh -c "git clone ${git_link} . && ` +
        `${start_directory ? `cd ${start_directory} && ` : ''}` +
        `${initial_cmds.join(' && ')} && ` +
        `${build_cmd}"`;
    } else {
      // For Unix systems
      dockerCmd = `docker run --rm \
        --name e6data-${jobId} \
        --memory=${memory_limit} \
        --network=host \
        --workdir=/app \
        -v ${workDir}:/app \
        ${envArgs} \
        ${dockerImage} \
        /bin/sh -c "git clone ${git_link} . && \
        ${start_directory ? `cd ${start_directory} && ` : ''} \
        ${initial_cmds.join(' && ')} && \
        ${build_cmd}"`;
    }
    
    console.log(`[INFO] Running docker command for job ${jobId}:\n${dockerCmd}`);
    
    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timed out')), timeout);
    });
    
    // Execute Docker command with streaming output
    const execPromise = new Promise((resolve, reject) => {
      // Use cmd.exe on Windows and sh on Unix-like systems
      const isWindows = os.platform() === 'win32';
      const process = isWindows 
        ? spawn('cmd', ['/c', dockerCmd], { shell: true })
        : spawn('sh', ['-c', dockerCmd], { shell: true });
      let output = '';
      
      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log(`[Job ${jobId}] ${chunk.trim()}`);
        // Emit the output to WebSocket
        if (global.io) {
          global.io.to(`job-${jobId}`).emit('log', {
            jobId,
            type: 'stdout',
            data: chunk.trim()
          });
        }
      });
      
      process.stderr.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.error(`[Job ${jobId}] ${chunk.trim()}`);
        // Emit the error to WebSocket
        if (global.io) {
          global.io.to(`job-${jobId}`).emit('log', {
            jobId,
            type: 'stderr',
            data: chunk.trim()
          });
        }
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ output, exitCode: code });
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
    
    // Wait for execution or timeout
    const result = await Promise.race([execPromise, timeoutPromise]);
    
    return {
      status: 'success',
      output: result.output,
      exitCode: result.exitCode
    };
  } catch (error) {
    console.error(`[ERROR] Job ${jobId} failed:`, error);
    return {
      status: 'error',
      error: error.message
    };
  } finally {
    // Clean up and decrement active containers
    try {
      // Force remove container if it's still running
      await execPromise(`docker rm -f e6data-${jobId} || true`);
      console.log(`[INFO] Removed container for job ${jobId}`);
      
      // Clean up workspace
      await fs.rm(workDir, { recursive: true, force: true });
      console.log(`[INFO] Cleaned up workspace for job ${jobId}`);
    } catch (cleanupError) {
      console.error(`[ERROR] Cleanup for job ${jobId} failed:`, cleanupError);
    }
    
    activeContainers--;
    console.log(`Active containers: ${activeContainers}/${MAX_CONCURRENT_CONTAINERS}`);
  }
}

// Ensure workspace directory exists
ensureWorkspaceDir().catch(err => {
  console.error('Failed to create workspace directory:', err);
  process.exit(1);
});

// Create a worker to process jobs
const worker = new Worker(
  'job_queue',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log('Job data:', job.data);
    
    // Check if we have resources to run this job
    if (!await checkResources()) {
      console.log(`[INFO] Job ${job.id} delayed due to resource constraints`);
      // Requeue the job with a delay
      await job.moveToDelayed(Date.now() + 10000);
      return { status: 'delayed', message: 'Job delayed due to resource constraints' };
    }
    
    // Run the job in Docker
    const result = await runInDocker(job);
    
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

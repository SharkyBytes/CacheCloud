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
const WORKSPACE_DIR = path.join(os.tmpdir(), 'e6data-workspaces');

// System resource management
const DEFAULT_MAX_CONTAINERS = 10;
const CONTAINER_MEMORY_ESTIMATE = 512; // MB per container
let maxConcurrentContainers = DEFAULT_MAX_CONTAINERS;

// Track active containers and resources
let activeContainers = 0;

// Calculate max concurrent containers based on available system resources
async function calculateMaxContainers() {
  try {
    const totalMemoryMB = Math.floor(os.totalmem() / (1024 * 1024));
    const freeMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
    
    // Reserve 20% of total memory or 1GB (whichever is smaller) for the system
    const reservedMemoryMB = Math.min(totalMemoryMB * 0.2, 1024);
    
    // Calculate available memory for containers
    const availableMemoryMB = totalMemoryMB  - reservedMemoryMB;
    
    // Calculate max containers based on memory
    const memoryBasedLimit = Math.floor(availableMemoryMB / CONTAINER_MEMORY_ESTIMATE);
    
    // Get CPU count and use 75% of available cores
    const cpuCount = os.cpus().length;
    const cpuBasedLimit = Math.max(1, Math.floor(cpuCount * 0.75));
    
    // Use the smaller of the two limits
    const calculatedLimit = Math.max(1, Math.min(memoryBasedLimit, cpuBasedLimit));
    
    console.log(`[RESOURCES] System has ${totalMemoryMB}MB total memory, ${freeMemoryMB}MB free memory`);
    console.log(`[RESOURCES] System has ${cpuCount} CPU cores`);
    console.log(`[RESOURCES] Calculated container limit: ${calculatedLimit} (memory: ${memoryBasedLimit}, CPU: ${cpuBasedLimit})`);
    
    return calculatedLimit;
  } catch (error) {
    console.error('[ERROR] Failed to calculate max containers:', error);
    return DEFAULT_MAX_CONTAINERS;
  }
}

// Create workspace directory if it doesn't exist
async function ensureWorkspaceDir() {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  console.log(`Workspace directory created at ${WORKSPACE_DIR}`);
}

// Check system resources and recalculate limits if needed
async function checkResources() {
  // Recalculate max containers based on current system resources
  // Do this periodically (every 5 job checks) to adapt to changing system load
  if (activeContainers % 5 === 0) {
    maxConcurrentContainers = await calculateMaxContainers();
  }
  
  // Check if we have capacity for another container
  if (activeContainers >= maxConcurrentContainers) {
    console.log(`[RESOURCES] No capacity for new containers: ${activeContainers}/${maxConcurrentContainers} active`);
    return false;
  }
  
  // Check current system memory
  const freeMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
  if (freeMemoryMB < CONTAINER_MEMORY_ESTIMATE * 1.5) {
    console.log(`[RESOURCES] Insufficient memory: ${freeMemoryMB}MB free, need ${CONTAINER_MEMORY_ESTIMATE * 1.5}MB`);
    return false;
  }
  
  return true;
}

// Run a job in a Docker container
async function runInDocker(job) {
  const { 
    submission_type = "git_repo",
    git_link, 
    raw_code,
    dependencies = [],
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
    console.log(`Active containers: ${activeContainers}/${maxConcurrentContainers}`);
    
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
    
    // Prepare for raw code execution if needed
    if (submission_type === 'raw_code' && raw_code) {
      // Create appropriate source file based on runtime
      let filename;
      switch (runtime) {
        case 'nodejs':
          filename = 'code.js';
          break;
        case 'python':
          filename = 'code.py';
          break;
        case 'java':
          filename = 'Main.java';
          break;
        case 'cpp':
          filename = 'code.cpp';
          break;
        default:
          filename = 'code.txt';
      }
      
      // Write the raw code to a file
      const sourceFilePath = path.join(workDir, filename);
      await fs.writeFile(sourceFilePath, raw_code);
      console.log(`[INFO] Created source file for job ${jobId}: ${filename}`);
    }
    
    // Build the Docker command
    let dockerCmd = '';
    
    if (isWindows) {
      // For Windows, use a different volume mount syntax
      if (submission_type === 'raw_code') {
        // Raw code execution
        dockerCmd = `docker run --rm ` +
          `--name e6data-${jobId} ` +
          `--memory=${memory_limit} ` +
          `--workdir=/app ` +
          `-v "${workDir}:/app" ` +
          `${envArgs} ` +
          `${dockerImage} ` +
          `/bin/sh -c "${initial_cmds.join(' && ')} && ` +
          `${build_cmd}"`;
      } else {
        // Git repo execution
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
      }
    } else {
      // For Unix systems
      if (submission_type === 'raw_code') {
        // Raw code execution
        dockerCmd = `docker run --rm \
          --name e6data-${jobId} \
          --memory=${memory_limit} \
          --network=host \
          --workdir=/app \
          -v ${workDir}:/app \
          ${envArgs} \
          ${dockerImage} \
          /bin/sh -c "${initial_cmds.join(' && ')} && \
          ${build_cmd}"`;
      } else {
        // Git repo execution
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
    }
    
    console.log(`[INFO] Running docker command for job ${jobId}:\n${dockerCmd}`);
    
    // Execute Docker command with streaming output and proper timeout handling
    const execPromise = new Promise((resolve, reject) => {
      // Use cmd.exe on Windows and sh on Unix-like systems
      const isWindows = os.platform() === 'win32';
      const process = isWindows 
        ? spawn('cmd', ['/c', dockerCmd], { shell: true })
        : spawn('sh', ['-c', dockerCmd], { shell: true });
      let output = '';
      
      // Set timeout that will kill the process
      const timeoutId = setTimeout(() => {
        console.log(`[TIMEOUT] Job ${jobId} exceeded timeout of ${timeout}ms`);
        // Kill the process
        if (isWindows) {
          // On Windows, we need to kill the Docker container directly
          exec(`docker kill e6data-${jobId}`);
        } else {
          process.kill('SIGTERM');
        }
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);
      
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
        // Clear the timeout since the process has completed
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve({ output, exitCode: code });
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      process.on('error', (err) => {
        // Clear the timeout on error
        clearTimeout(timeoutId);
        reject(err);
      });
    });
    
    // Wait for execution (timeout is handled within the promise)
    const result = await execPromise;
    
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
    console.log(`Active containers: ${activeContainers}/${maxConcurrentContainers}`);
  }
}

// Initialize the system
async function initialize() {
  try {
    // Ensure workspace directory exists
    await ensureWorkspaceDir();
    
    // Calculate initial max containers
    maxConcurrentContainers = await calculateMaxContainers();
    console.log(`[INIT] System initialized with max ${maxConcurrentContainers} concurrent containers`);
  } catch (err) {
    console.error('[ERROR] Failed to initialize system:', err);
    process.exit(1);
  }
}

// Run initialization
initialize();

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
  { connection, concurrency: maxConcurrentContainers }
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

// worker-fixed-with-dead-queue.js
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { redis_connection_string } from "../config/redis_config.js";
import { spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Import your job queues (you said ./job_queue.js exports { job_queue, dead_job_queue })
import { job_queue, dead_job_queue } from "./job_queue.js";

const execAsync = promisify((cmd, cb) =>
  require("child_process").exec(cmd, cb)
); // fallback wrapper
const connection = new IORedis(redis_connection_string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Config (tune these)
const DEFAULT_MAX_CONCURRENT_CONTAINERS = 1000; // upper cap
const WORKSPACE_DIR = path.join(os.tmpdir(), "e6data-workspaces");
const MIN_MEMORY_BYTES = 128 * 1024 * 1024; // 128MB minimum sanity
const DEFAULT_CONTAINER_CPUS = 0.5; // default cpu quota per container if not provided (fractional)

// Runtime state
let activeContainers = 0;

// Create the output/postprocess queue (name requested: "postgress queue")
const postProcessQueue = new Queue("postgress queue", { connection });

// Helper: ensure workspace dir exists
async function ensureWorkspaceDir() {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  console.log(`Workspace directory created at ${WORKSPACE_DIR}`);
}

// Helper: parse memory string like "512MB", "1GB" -> bytes
function parseMemoryToBytes(memStr) {
  if (!memStr) return 0;
  const m = String(memStr).trim().toUpperCase();
  const num = parseFloat(m.replace(/[^\d.]/g, ""));
  if (m.endsWith("GB")) return Math.floor(num * 1024 * 1024 * 1024);
  if (m.endsWith("MB")) return Math.floor(num * 1024 * 1024);
  if (m.endsWith("KB")) return Math.floor(num * 1024);
  // plain number treat as bytes
  return Math.floor(num);
}

// Helper: very basic git URL validation (allow http(s) and git@)
function isValidGitLink(gitLink) {
  if (!gitLink || typeof gitLink !== "string") return false;
  const s = gitLink.trim();
  // allow: https://..., http://..., git@..., ssh://...
  return /^(https?:\/\/|git@|ssh:\/\/)/i.test(s);
}

// Helper: sanitize simple shell commands — allow only a restricted safe charset
function sanitizeCmd(cmd) {
  if (typeof cmd !== "string") return "";
  // allow common characters (alnum, spaces, ./-_=:@, parentheses, &&)
  const allowed =
    /^[A-Za-z0-9\s\.\-/_=:@\+\%\(\)\[\],]+(&&\s*[A-Za-z0-9\.\-/_=:@\+\%\(\)\[\],\s]+)*$/;
  if (allowed.test(cmd.trim())) return cmd.trim();
  return "";
}

// Adaptive concurrency calculator
function calculateAdaptiveCapacity(
  maxCap = DEFAULT_MAX_CONCURRENT_CONTAINERS,
  memoryPerContainerBytes = 0,
  cpuPerContainer = DEFAULT_CONTAINER_CPUS
) {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus().length;

  const memCapacity =
    memoryPerContainerBytes > 0
      ? Math.max(1, Math.floor(freeMem / memoryPerContainerBytes))
      : maxCap;
  const cpuCapacity =
    cpuPerContainer > 0
      ? Math.max(1, Math.floor(cpus / cpuPerContainer))
      : maxCap;

  const capacity = Math.max(1, Math.min(maxCap, memCapacity, cpuCapacity));
  return {
    capacity,
    freeMem,
    totalMem,
    cpus,
  };
}

// Check resources before launching a container; this is an async gate
async function checkResourcesRequested(
  requestedMemoryBytes = 0,
  requestedCpus = DEFAULT_CONTAINER_CPUS
) {
  const { capacity } = calculateAdaptiveCapacity(
    DEFAULT_MAX_CONCURRENT_CONTAINERS,
    requestedMemoryBytes,
    requestedCpus
  );
  return activeContainers < capacity;
}

// Run a job in Docker
async function runInDocker(job) {
  const {
    git_link,
    start_directory = "",
    initial_cmds = ["npm install"],
    env_file, // optional
    build_cmd = "node index.js",
    memory_limit = job.memory_limit,
    timeout = 300000,
    runtime = "nodejs",
    env = {},
    cpus = DEFAULT_CONTAINER_CPUS,
  } = job.data;

  const jobId = job.id;
  const workDir = path.join(WORKSPACE_DIR, String(jobId));

  if (!isValidGitLink(git_link)) {
    const msg = `Invalid git_link provided for job ${jobId}`;
    console.error(msg);
    return { status: "error", error: msg };
  }

  const memBytes = parseMemoryToBytes(memory_limit);
  const memoryLimitArg =
    memBytes >= MIN_MEMORY_BYTES
      ? `${Math.floor(memBytes / (1024 * 1024))}m`
      : "512m";
  const cpusArg = Number(cpus) > 0 ? Number(cpus) : DEFAULT_CONTAINER_CPUS;

  if (!(await checkResourcesRequested(memBytes, cpusArg))) {
    const msg = `Insufficient host resources to run job ${jobId} now`;
    console.log(msg);
    return { status: "delayed", message: msg };
  }

  let dockerImage = "node:18";
  switch ((runtime || "").toLowerCase()) {
    case "python":
      dockerImage = "python:3.10";
      break;
    case "java":
      dockerImage = "openjdk:17";
      break;
    case "c":
    case "cpp":
    case "c++":
      dockerImage = "gcc:latest";
      break;
    case "go":
      dockerImage = "golang:1.20";
      break;
    case "rust":
      dockerImage = "rust:1.71";
      break;
  }

  await fs.mkdir(workDir, { recursive: true });
  console.log(`Created workspace for job ${jobId} at ${workDir}`);

  const envEntries = Object.entries(env || {});
  const envArgs = [];
  for (const [k, v] of envEntries) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    envArgs.push("--env", `${k}=${String(v)}`);
  }

  const safeInitialCmds = Array.isArray(initial_cmds)
    ? initial_cmds.map((c) => sanitizeCmd(String(c))).filter(Boolean)
    : [];
  const safeBuildCmd = sanitizeCmd(String(build_cmd)) || "";

  if (safeInitialCmds.length === 0 && safeBuildCmd === "") {
    const msg = `No safe commands to run for job ${jobId}`;
    console.error(msg);
    return { status: "error", error: msg };
  }

  const insideCommands = [];
  insideCommands.push(`git clone ${git_link} .`);
  if (start_directory) insideCommands.push(`cd ${start_directory}`);
  if (safeInitialCmds.length) insideCommands.push(safeInitialCmds.join(" && "));
  if (safeBuildCmd) insideCommands.push(safeBuildCmd);
  const containerShellCommand = insideCommands.join(" && ");

  const containerName = `e6data-${jobId}`;
  const isWindows = os.platform() === "win32";
  const volumeArg = `${workDir}:/app`;

  const dockerArgs = [
    "run",
    "--rm",
    "--name",
    containerName,
    "--memory",
    memoryLimitArg,
    "--cpus",
    String(cpusArg),
    "--workdir",
    "/app",
    "-v",
    volumeArg,
    ...envArgs,
    dockerImage,
    "/bin/sh",
    "-c",
    containerShellCommand,
  ];

  activeContainers++;
  console.log(
    `Starting container ${containerName}. Active containers: ${activeContainers}`
  );

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
  }, timeout);

  try {
    const runProcessPromise = new Promise((resolve, reject) => {
      const proc = spawn("docker", dockerArgs, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";

      proc.stdout.on("data", (chunk) => {
        const s = String(chunk);
        output += s;
        console.log(`[Job ${jobId}] stdout: ${s.trim()}`);
        if (global.io)
          global.io
            .to(`job-${jobId}`)
            .emit("log", { jobId, type: "stdout", data: s });
      });

      proc.stderr.on("data", (chunk) => {
        const s = String(chunk);
        output += s;
        console.error(`[Job ${jobId}] stderr: ${s.trim()}`);
        if (global.io)
          global.io
            .to(`job-${jobId}`)
            .emit("log", { jobId, type: "stderr", data: s });
      });

      proc.on("error", (err) => {
        reject(err);
      });

      proc.on("close", (code) => {
        if (timedOut) {
          return reject(new Error("Execution timed out"));
        }
        if (code === 0) return resolve({ output, exitCode: 0 });
        return reject(new Error(`Process exited with code ${code}`));
      });
    });

    const result = await Promise.race([
      runProcessPromise,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Execution timed out")), timeout)
      ),
    ]);

    // push to post-process queue
    try {
      await postProcessQueue.add("postprocess", {
        jobId,
        status: "success",
        output: result.output,
        exitCode: result.exitCode,
        timestamp: Date.now(),
      });
      console.log(`[INFO] Pushed result of job ${jobId} to "postgress queue"`);
    } catch (qerr) {
      console.error(
        `[WARN] Failed to push to postgress queue for job ${jobId}:`,
        qerr
      );
    }

    // Publish to Redis pubsub channel for clients
    try {
      const channel = `job-${jobId}-pub`;
      await connection.publish(
        channel,
        JSON.stringify({
          jobId,
          status: "success",
          output: result.output,
          exitCode: result.exitCode,
        })
      );
      console.log(`[INFO] Published result to channel ${channel}`);
    } catch (pubErr) {
      console.error(
        `[WARN] Failed to publish result for job ${jobId}:`,
        pubErr
      );
    }

    clearTimeout(timeoutId);
    return {
      status: "success",
      output: result.output,
      exitCode: result.exitCode,
    };
  } catch (err) {
    console.error(`[ERROR] job ${jobId} failed:`, err);

    // push failure to post-process queue (best-effort)
    try {
      await postProcessQueue.add("postprocess", {
        jobId,
        status: "error",
        error: err.message,
        timestamp: Date.now(),
      });
    } catch (qe) {
      console.error(
        `[WARN] Failed to push error to postgress queue for job ${jobId}:`,
        qe
      );
    }

    // Publish failure to pubsub (best-effort)
    try {
      const channel = `job-${jobId}-pub`;
      await connection.publish(
        channel,
        JSON.stringify({
          jobId,
          status: "error",
          error: err.message,
        })
      );
    } catch (pe) {
      console.error(`[WARN] Failed to publish error for job ${jobId}:`, pe);
    }

    // --- NEW: push job to dead_job_queue (best-effort)
    try {
      if (dead_job_queue && typeof dead_job_queue.add === "function") {
        await dead_job_queue.add("dead", {
          jobId,
          originalJobData: job.data,
          error: err.message,
          timestamp: Date.now(),
        });
        console.log(`[INFO] Job ${jobId} added to dead_job_queue`);
      } else {
        console.warn(
          `[WARN] dead_job_queue not available or does not expose add()`
        );
      }
    } catch (dqErr) {
      console.error(
        `[WARN] Failed to add job ${jobId} to dead_job_queue:`,
        dqErr
      );
    }

    return { status: "error", error: err.message };
  } finally {
    try {
      await execAsync(`docker rm -f ${containerName} || true`);
      await fs.rm(workDir, { recursive: true, force: true });
      console.log(`[CLEANUP] cleaned workspace and container for job ${jobId}`);
    } catch (cleanupErr) {
      console.error(`[ERROR] cleanup for job ${jobId} failed:`, cleanupErr);
    } finally {
      activeContainers = Math.max(0, activeContainers - 1);
      console.log(`Active containers: ${activeContainers}`);
    }
  }
}

// Ensure workspace exists at startup
ensureWorkspaceDir().catch((err) => {
  console.error("Failed to create workspace directory:", err);
  process.exit(1);
});


const memPerContainerBytes = parseMemoryToBytes("20MB"); // or a config default
const { capacity } = calculateAdaptiveCapacity(
  DEFAULT_MAX_CONCURRENT_CONTAINERS,
  memPerContainerBytes,
  DEFAULT_CONTAINER_CPUS
);
// Create the worker
const worker = new Worker(
  "job_queue",
  async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log("Job data:", job.data);

    // If resources low, delay job
    const memBytes = parseMemoryToBytes(job.data?.memory_limit || "512MB");
    const cpusReq = job.data?.cpus || DEFAULT_CONTAINER_CPUS;
    if (!(await checkResourcesRequested(memBytes, cpusReq))) {
      console.log(`[INFO] Job ${job.id} delayed due to resource constraints`);
      await job.moveToDelayed(Date.now() + 10000); // 10s delay
      return {
        status: "delayed",
        message: "Job delayed due to resource constraints",
      };
    }

    try {
      const result = await runInDocker(job);

      if (result.status === "success") {
        console.log(`Job ${job.id} completed successfully`);
        return {
          status: "success",
          message: "Job processed successfully",
          output: result.output,
          exitCode: result.exitCode,
        };
      } else if (result.status === "delayed") {
        // Delay happens: move job to delayed state
        await job.moveToDelayed(Date.now() + 10000);
        return result;
      } else {
        // result.status === 'error' -> push to dead queue here as an extra safety (best-effort) and then throw
        try {
          if (dead_job_queue && typeof dead_job_queue.add === "function") {
            await dead_job_queue.add("dead", {
              jobId: job.id,
              originalJobData: job.data,
              error: result.error || "unknown",
              timestamp: Date.now(),
            });
            console.log(
              `[INFO] Job ${job.id} added to dead_job_queue from worker processor`
            );
          }
        } catch (dqErr) {
          console.error(
            `[WARN] Failed to add job ${job.id} to dead_job_queue from worker processor:`,
            dqErr
          );
        }
        throw new Error(result.error || "Job failed");
      }
    } catch (err) {
      // If an unexpected error bubbles up, ensure dead queue gets the job (best-effort)
      try {
        if (dead_job_queue && typeof dead_job_queue.add === "function") {
          await dead_job_queue.add("dead", {
            jobId: job.id,
            originalJobData: job.data,
            error: err.message || "unhandled error",
            timestamp: Date.now(),
          });
          console.log(
            `[INFO] Job ${job.id} added to dead_job_queue from worker catch`
          );
        }
      } catch (dqErr) {
        console.error(
          `[WARN] Failed to add job ${job.id} to dead_job_queue from worker catch:`,
          dqErr
        );
      }
      // rethrow so BullMQ marks the job as failed
      throw err;
    }
  },
  { connection, concurrency:capacity}
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on("failed", async (job, err) => {
  console.error(`Job ${job.id} has failed with error ${err.message}`);

  // Attempt to ensure failed jobs are recorded in dead_job_queue (best-effort)
  try {
    if (dead_job_queue && typeof dead_job_queue.add === "function") {
      await dead_job_queue.add("dead", {
        jobId: job.id,
        originalJobData: job.data,
        error: err.message,
        timestamp: Date.now(),
      });
      console.log(
        `[INFO] Job ${job.id} added to dead_job_queue from failed-event`
      );
    } else {
      console.warn(`[WARN] dead_job_queue not available in failed-event`);
    }
  } catch (dqErr) {
    console.error(
      `[WARN] Could not add job ${job.id} to dead_job_queue from failed-event:`,
      dqErr
    );
  }
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("Job processor worker started");

export default worker;

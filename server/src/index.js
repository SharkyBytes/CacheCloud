import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server } from 'socket.io';
import submitRouter from './routes/submit.js';
import jobsRouter from './routes/jobs.js';
import './queue/job_processor.js'; // Import to start the worker

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/submit", submitRouter);
app.use("/api/jobs", jobsRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('subscribe', (jobId) => {
    console.log(`Client subscribed to job ${jobId}`);
    socket.join(`job-${jobId}`);
  });
  
  socket.on('unsubscribe', (jobId) => {
    console.log(`Client unsubscribed from job ${jobId}`);
    socket.leave(`job-${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io available globally for job_processor.js
global.io = io;

httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';
import submitRouter from './routes/submit.js';
import './queue/job_processor.js'; // Import to start the worker

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/submit", submitRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});


const PORT = process.env.PORT || 5000;
const express_app = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


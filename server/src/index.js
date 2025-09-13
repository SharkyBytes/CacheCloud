import express from "express";
import cors from "cors";
import submitRouter from '../src/routes/submit.js'


const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/submit",submitRouter)


const PORT = 5000;
const express_app = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

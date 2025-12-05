import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    client.release();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/tasks', tasksRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

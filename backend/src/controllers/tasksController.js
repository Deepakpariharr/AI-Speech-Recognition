// backend/src/controllers/tasksController.js
import { pool } from '../db.js';
import * as parser from '../services/parser.js';
import * as heuristicParser from '../services/parser.js';
import { llmParse } from '../services/llmParser.js';

// helpers
function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.duedate,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const createTask = async (req, res) => {
  try {
    const { title, description = '', status = 'To Do', priority = 'Medium', dueDate = null } = req.body;
    const q = `INSERT INTO tasks (title, description, status, priority, duedate)
               VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const values = [title, description, status, priority, dueDate];
    const { rows } = await pool.query(q, values);
    res.status(201).json(rowToTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const listTasks = async (req, res) => {
  try {
    const { status, priority, q: search } = req.query;
    const clauses = [];
    const values = [];
    let idx = 1;

    if (status) { clauses.push(`status = $${idx++}`); values.push(status); }
    if (priority) { clauses.push(`priority = $${idx++}`); values.push(priority); }
    if (search) {
      clauses.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const q = `SELECT * FROM tasks ${where} ORDER BY duedate NULLS LAST, created_at DESC`;
    const { rows } = await pool.query(q, values);
    res.json(rows.map(rowToTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const q = 'SELECT * FROM tasks WHERE id = $1';
    const { rows } = await pool.query(q, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const fields = [];
    const values = [];
    let idx = 1;
    // allow partial updates
    for (const key of ['title','description','status','priority','dueDate']) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const col = key === 'dueDate' ? 'duedate' : key;
        fields.push(`${col} = $${idx++}`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    const q = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(q, values);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const q = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(q, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const parseTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript required" });
    }

    // 1️⃣ Try heuristic parser first
    const h = await heuristicParser.parse(transcript);

    const missing =
      !h.title ||
      h.title.trim().length < 2 ||
      !["Low", "Medium", "High"].includes(h.priority) ||
      !["To Do", "In Progress", "Done"].includes(h.status);

    let finalParsed = h;

    // 2️⃣ If heuristic parser is incomplete → use LLM fallback
    if (missing) {
      console.log("⛔ Heuristic incomplete → using OpenAI…");

      const ai = await llmParse(transcript);
      if (ai) {
        finalParsed = {
          title: ai.title || h.title,
          priority: ai.priority || h.priority,
          status: ai.status || h.status,
          dueDate: ai.dueDate || h.dueDate
        };
      }
    }

    res.json({ transcript, parsed: finalParsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
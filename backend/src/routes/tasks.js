import express from 'express';
import * as controller from '../controllers/tasksController.js';

const router = express.Router();

router.post('/', controller.createTask);
router.get('/', controller.listTasks);
router.get('/:id', controller.getTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);
router.post('/parse/transcript', controller.parseTranscript);

export default router;


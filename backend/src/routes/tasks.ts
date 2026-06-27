import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasksController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// All task routes require authentication
router.use(requireAuth);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
